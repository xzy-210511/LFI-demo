"""Concurrent load test against the running backend (warm cache).
Usage: python loadtest.py <outJson>"""
import json
import random
import statistics
import sys
import threading
import time
import urllib.error
import urllib.request

API = "http://localhost:8080/api"
DATASET, FRAMES = 5, 899          # mm3a
REQ_PER_CLIENT = 10
random.seed(7)


def get(url):
    t = time.perf_counter()
    try:
        with urllib.request.urlopen(url, timeout=120) as r:
            r.read()
            code = r.status
    except urllib.error.HTTPError as e:
        code = e.code
    except Exception:
        code = -1
    return time.perf_counter() - t, code


def url_for(kind, frame):
    if kind == "analysis":
        return f"{API}/datasets/{DATASET}/frames/{frame}/analysis?direction=row&position=650"
    return f"{API}/datasets/{DATASET}/frames/{frame}/combined-image"


def run(kind, clients):
    frames = random.sample(range(1, FRAMES), clients * REQ_PER_CLIENT)
    lat, codes, lock = [], [], threading.Lock()

    def worker(i):
        for k in range(REQ_PER_CLIENT):
            dt, code = get(url_for(kind, frames[i * REQ_PER_CLIENT + k]))
            with lock:
                lat.append(dt)
                codes.append(code)

    t0 = time.perf_counter()
    ts = [threading.Thread(target=worker, args=(i,)) for i in range(clients)]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    wall = time.perf_counter() - t0
    lat.sort()
    p95 = lat[int(0.95 * (len(lat) - 1))]
    return {"endpoint": kind, "clients": clients, "requests": len(lat), "errors": sum(1 for c in codes if c != 200),
            "wall_s": round(wall, 2), "throughput_rps": round(len(lat) / wall, 2),
            "median_s": round(statistics.median(lat), 3), "p95_s": round(p95, 3), "max_s": round(lat[-1], 3)}


get(url_for("analysis", 0))  # make sure the cache file exists
results = []
for kind in ("analysis", "combined"):
    for c in (1, 2, 4, 8, 16):
        r = run(kind, c)
        results.append(r)
        print(json.dumps(r))
json.dump(results, open(sys.argv[1], "w"), indent=1)
