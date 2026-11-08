"""Cost of one processor call inside the backend container (thesis Section 6.8).

Run inside the running backend container against the cached mm3a file (dataset 5):
    docker exec -i lfi-dashboard-backend python - < docs/evaluation/processor_timing.py
Prints the median of five runs for Python start-up with the processor's imports and for each processor command.
"""
import statistics
import subprocess
import time

CACHE = "/app/data/hdf5-cache/dataset-5.hdf5"
SCRIPT = "/app/tools/hdf5_processor.py"
FRAME = "300"
cases = {
    "python start + imports (h5py, numpy, PIL)": ["python", "-c", "import h5py, numpy, PIL.Image"],
    "processor phase image": ["python", SCRIPT, "image", CACHE, "/tmp/t.png", FRAME, "phase"],
    "processor amplitude image": ["python", SCRIPT, "image", CACHE, "/tmp/t.png", FRAME, "amplitude"],
    "processor analysis, row 650": ["python", SCRIPT, "analysis", CACHE, FRAME, "row", "650", "32"],
}
for label, cmd in cases.items():
    runs = []
    for _ in range(5):
        t0 = time.perf_counter()
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)
        runs.append(time.perf_counter() - t0)
    print(f"{label}: median {statistics.median(runs):.3f} s")
