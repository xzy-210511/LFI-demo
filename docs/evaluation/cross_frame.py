"""Cross-frame statistics for both supplied files, using the processor's finite-value conventions.
Usage: python cross_frame.py <mushroomDir> <outDir>"""
import json
import sys
import time
from pathlib import Path

import h5py
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])
plt.rcParams["font.family"] = "Arial"
NAVY, TEAL = "#17324d", "#2b8a8a"


def natural(names):
    import re
    return sorted(names, key=lambda n: [int(p) if p.isdigit() else p for p in re.split(r"(\d+)", n)])


def stats(path):
    t0 = time.time()
    with h5py.File(path, "r") as f:
        an, pn = natural(f["amplitude"].keys()), natural(f["phase"].keys())
        a0 = np.asarray(f["amplitude"][an[0]][()], dtype=np.float64).ravel()
        prev = a0
        rows = []
        for k, (na, npn) in enumerate(zip(an, pn)):
            a = np.asarray(f["amplitude"][na][()], dtype=np.float64)
            p = np.asarray(f["phase"][npn][()], dtype=np.float64)
            fa, fp = a[np.isfinite(a)], p[np.isfinite(p)]
            ar = a.ravel()
            # circular statistics of phase (degrees): mean resultant length R in [0, 1]
            ang = np.deg2rad(fp)
            R = float(np.hypot(np.cos(ang).mean(), np.sin(ang).mean()))
            rows.append({
                "frame": k,
                "amp_mean": float(fa.mean()), "amp_p99": float(np.percentile(fa, 99)), "amp_max": float(fa.max()),
                "finite_a": int(fa.size), "finite_p": int(fp.size),
                "corr_first": float(np.corrcoef(a0, ar)[0, 1]),
                "corr_prev": float(np.corrcoef(prev, ar)[0, 1]) if k else 1.0,
                "phase_R": R,
            })
            prev = ar
    return rows, time.time() - t0


results = {}
for name in ("p1", "mm3a"):
    rows, secs = stats(SRC / f"{name}.hdf5")
    results[name] = {"rows": rows, "seconds": round(secs, 1)}
    am = np.array([r["amp_mean"] for r in rows])
    cp = np.array([r["corr_prev"] for r in rows[1:]])
    cf = np.array([r["corr_first"] for r in rows])
    R = np.array([r["phase_R"] for r in rows])
    fin = {r["finite_a"] for r in rows} | {r["finite_p"] for r in rows}
    s = {
        "frames": len(rows), "seconds": round(secs, 1), "finite_counts": sorted(fin),
        "amp_mean_first": round(am[0], 2), "amp_mean_last": round(am[-1], 2),
        "amp_mean_min": [round(am.min(), 2), int(am.argmin())], "amp_mean_max": [round(am.max(), 2), int(am.argmax())],
        "amp_mean_median": round(float(np.median(am)), 2),
        "corr_prev_median": round(float(np.median(cp)), 3), "corr_prev_min": [round(cp.min(), 3), int(cp.argmin()) + 1],
        "corr_first_at": {k: round(float(cf[k]), 3) for k in (1, 10, 50, 100, 200, len(rows) // 2, len(rows) - 1)},
        "frames_corr_first_below_0.3": int((cf < 0.3).sum()),
        "phase_R_median": round(float(np.median(R)), 3), "phase_R_max": [round(R.max(), 3), int(R.argmax())],
    }
    results[name]["summary"] = s
    print(name, json.dumps(s))

(OUT / "cross_frame_stats.json").write_text(json.dumps(results, indent=1), encoding="utf-8")

fig, axes = plt.subplots(2, 2, figsize=(12, 7), dpi=200, sharex="col")
for col, name in enumerate(("p1", "mm3a")):
    rows = results[name]["rows"]
    k = [r["frame"] for r in rows]
    ax = axes[0, col]
    ax.plot(k, [r["amp_mean"] for r in rows], color=NAVY, lw=1.2, label="mean")
    ax.plot(k, [r["amp_p99"] for r in rows], color=TEAL, lw=1.0, label="99th percentile")
    ax.set_title(f"{name}.hdf5 ({len(rows)} frames)", fontsize=12, color=NAVY, fontweight="bold")
    ax.set_ylabel("amplitude (stored units)")
    ax.legend(frameon=False, fontsize=9)
    ax.grid(alpha=0.25)
    ax = axes[1, col]
    ax.plot(k[1:], [r["corr_prev"] for r in rows[1:]], color=NAVY, lw=1.0, label="with previous frame")
    ax.plot(k, [r["corr_first"] for r in rows], color=TEAL, lw=1.0, label="with frame 0")
    ax.set_ylim(-0.05, 1.02)
    ax.set_xlabel("frame index")
    ax.set_ylabel("amplitude correlation")
    ax.legend(frameon=False, fontsize=9, loc="lower left")
    ax.grid(alpha=0.25)
fig.tight_layout()
fig.savefig(OUT / "fig_new_cross_frame.png")
print("saved figure; seconds:", {n: results[n]["seconds"] for n in results})
