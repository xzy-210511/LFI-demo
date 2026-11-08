"""Robustness tests: import HDF5 files with other structures through the running API, then delete them.
Usage: python robustness.py <workDir>"""
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

import h5py
import numpy as np

WORK = Path(sys.argv[1])
FIX = WORK / "fixtures"
FIX.mkdir(exist_ok=True)
(WORK / "out").mkdir(exist_ok=True)
API = "http://localhost:8080/api"
rng = np.random.default_rng(42)


def make(name, groups):
    path = FIX / name
    with h5py.File(path, "w") as f:
        for g, frames in groups.items():
            grp = f.create_group(g)
            for k, arr in frames.items():
                grp.create_dataset(k, data=arr, compression="gzip")
    return path


def frames(n, shape, dtype=np.float64, names=None):
    names = names or ["%04d" % i for i in range(n)]
    return {nm: (rng.random(shape) * 100).astype(dtype) for nm in names}


fixtures = []
fixtures.append(("wide_200x700", make("wide_200x700.h5", {"amplitude": frames(5, (200, 700)), "phase": frames(5, (200, 700))})))
fixtures.append(("int32_512x512", make("int32_512x512.h5", {"amplitude": frames(4, (512, 512), np.int32), "phase": frames(4, (512, 512), np.int32)})))
nan_amp = frames(3, (60, 40), np.float32)
for a in nan_amp.values():
    a[0:5, :] = np.nan
    a[10, 10] = np.inf
fixtures.append(("float32_nan_inf", make("float32_nan_inf.h5", {"amplitude": nan_amp, "phase": frames(3, (60, 40), np.float32)})))
un = [str(i) for i in range(12)]
fixtures.append(("unpadded_names", make("unpadded_names.h5", {
    "amplitude": {n: np.full((20, 30), float(n)) for n in un}, "phase": {n: np.full((20, 30), float(n)) for n in un}})))
fixtures.append(("three_d_frames", make("three_d_frames.h5", {"amplitude": frames(2, (4, 20, 30)), "phase": frames(2, (4, 20, 30))})))
fixtures.append(("missing_phase", make("missing_phase.h5", {"amplitude": frames(3, (20, 30))})))
fixtures.append(("shape_mismatch", make("shape_mismatch.h5", {"amplitude": frames(3, (20, 30)), "phase": frames(3, (30, 20))})))
fixtures.append(("unequal_counts", make("unequal_counts.h5", {"amplitude": frames(10, (20, 30)), "phase": frames(8, (20, 30))})))
fixtures.append(("varying_shapes", make("varying_shapes.h5", {
    "amplitude": {"0000": rng.random((100, 100)), "0001": rng.random((50, 80))},
    "phase": {"0000": rng.random((100, 100)), "0001": rng.random((50, 80))}})))
bad = FIX / "not_hdf5.h5"
bad.write_bytes(rng.bytes(4096))
fixtures.append(("not_hdf5", bad))


def curl(*args):
    r = subprocess.run(["curl", "-s", "-w", "\n%{http_code}", *args], capture_output=True, text=True)
    body, code = r.stdout.rsplit("\n", 1)
    return int(code), body


def lo_count():
    r = subprocess.run(["docker", "exec", "lfi-dashboard-postgres", "psql", "-U", "lfi_user", "-d", "lfi_dashboard", "-tAc",
                        "select count(*) from pg_largeobject_metadata"], capture_output=True, text=True)
    return int(r.stdout.strip())


results = {"lo_before": lo_count(), "cases": []}
created = []
for label, path in fixtures:
    code, body = curl("-F", "file=@%s" % path.as_posix(), API + "/datasets/import")
    case = {"case": label, "import_status": code}
    try:
        j = json.loads(body)
    except json.JSONDecodeError:
        j = {"raw": body[:200]}
    case["import_message"] = (j.get("message") or j.get("error") or j.get("raw") or "")[:180]
    if code == 200:
        did = j["datasetId"]
        created.append(did)
        _, det = curl(API + "/datasets/%d" % did)
        det = json.loads(det)
        case["detail"] = {k: det.get(k) for k in ("amplitudeFrameCount", "phaseFrameCount", "frameHeight", "frameWidth")}
        checks = {}
        last = min(det["amplitudeFrameCount"], det["phaseFrameCount"]) - 1
        c, b = curl("-o", "NUL" if sys.platform == "win32" else "/dev/null", API + "/datasets/%d/frames/%d/combined-image" % (did, last))
        checks["combined_last_frame"] = c
        c, b = curl(API + "/datasets/%d/frames/%d/analysis?direction=column&position=0" % (did, last))
        if c == 200:
            a = json.loads(b)
            checks["analysis_last_frame"] = {"status": 200, "points": len(a["profilePoints"]), "frame_name": a["amplitudeFrameName"],
                                             "finite_amp": a["amplitudeStatistics"]["finiteCount"],
                                             "hist_total": sum(x["count"] for x in a["amplitudeHistogram"])}
        else:
            checks["analysis_last_frame"] = {"status": c, "message": (json.loads(b).get("message") or "")[:160] if b.startswith("{") else b[:120]}
        if label == "unpadded_names":
            c, b = curl(API + "/datasets/%d/frames/2/analysis?direction=row&position=0" % did)
            a = json.loads(b)
            checks["frame_index_2"] = {"frame_name": a["amplitudeFrameName"], "mean": a["amplitudeStatistics"]["mean"]}
        if label == "unequal_counts":
            c, _ = curl("-o", "NUL", API + "/datasets/%d/frames/9/amplitude-image" % did)
            checks["amplitude_frame_9"] = c
            c, _ = curl("-o", "NUL", API + "/datasets/%d/frames/9/combined-image" % did)
            checks["combined_frame_9"] = c
        if label == "varying_shapes":
            c, b = curl(API + "/datasets/%d/frames/1/analysis?direction=row&position=75" % did)
            checks["frame1_row75"] = {"status": c, "message": (json.loads(b).get("message") or "")[:160] if b.startswith("{") else b[:120]}
            c, _ = curl("-o", "NUL", API + "/datasets/%d/frames/1/amplitude-image" % did)
            checks["frame1_image"] = c
        case["checks"] = checks
    results["cases"].append(case)

results["lo_after_import"] = lo_count()
for did in created:
    curl("-X", "DELETE", API + "/datasets/%d" % did)
results["lo_after_delete"] = lo_count()
(WORK / "out" / "robustness.json").write_text(json.dumps(results, indent=1), encoding="utf-8")
print(json.dumps(results, indent=1))
