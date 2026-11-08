# Evaluation scripts and raw results

Scripts and raw outputs behind the evaluation reported in the thesis (Chapters 2 and 6). They do not change the
application; they only read the supplied HDF5 files or call the running API.

Environment for the reported runs (1 November 2026): Windows 11, Intel Core Ultra 7 155H (22 logical processors),
31 GB RAM, Docker Desktop with the three Compose services from this repository (PostgreSQL 16, Spring Boot 3.3.5 on
Java 17, Python 3.12 with h5py 3.16). Host-side scripts use Python 3.12 with h5py, NumPy and Matplotlib. Further
context is in [`../thesis_evidence_2026-11-01.md`](../thesis_evidence_2026-11-01.md).

| Experiment | Thesis location | Script | Command (from the repository root) | Result location |
|---|---|---|---|---|
| HDF5 storage layout | §2.4 | `hdf5_layout.py` | `python docs/evaluation/hdf5_layout.py Mushroom docs/evaluation/results/hdf5_layout.json` | `results/hdf5_layout.json` |
| Cross-frame statistics | §6.6, Figure 18 | `cross_frame.py` | `python docs/evaluation/cross_frame.py Mushroom docs/thesis_figures` | `../thesis_figures/cross_frame_stats.json`, `../thesis_figures/fig_new_cross_frame.png` |
| Robustness imports | §6.5, Table 20 | `robustness.py` | `python docs/evaluation/robustness.py <workDir>` | `<workDir>/out/robustness.json` (reported run: `results/robustness.json`) |
| Endpoint timing medians | §6.8, Table 23 | `endpoint_timing.sh` | `bash docs/evaluation/endpoint_timing.sh 7 p1` and `... 5 mm3a` | `results/endpoint_timing_p1.txt`, `results/endpoint_timing_mm3a.txt` (all five runs per endpoint) |
| Concurrent load test | §6.8, Table 24, Figure 19 | `loadtest.py` | `python docs/evaluation/loadtest.py docs/evaluation/results/loadtest.json` | `results/loadtest.json` |
| Processor cost per request | §6.8 | `processor_timing.py` | `docker exec -i lfi-dashboard-backend python - < docs/evaluation/processor_timing.py` | thesis §6.8 only (summary; no raw log was kept) |

## Definitions and conditions

- **Cross-frame statistics.** For every frame pair, finite amplitude values give the mean and 99th percentile.
  Correlations are Pearson correlations between all values of the amplitude matrix and those of the previous frame
  and of frame 0. Phase values are treated as degrees (thesis assumption A3), converted to radians θ and summarised by
  the mean resultant length R = √(mean(cos θ)² + mean(sin θ)²). R depends on that unit assumption.
- **Robustness.** Ten fixtures are generated with h5py (NumPy seed 42) and uploaded to `POST /api/datasets/import`.
  Accepted fixtures are queried for images and analysis of their last paired frame and then deleted through the API.
  The Large Object count is read with `psql` in the `lfi-dashboard-postgres` container before the imports, after them
  and after the deletions. Requires the running Compose stack and `curl`; the script writes `NUL` as the discard target
  on Windows.
- **Load test.** mm3a (dataset 5) with its file already in the cache (warm cache). For 1, 2, 4, 8 and 16 client
  threads, each thread sends ten requests for distinct frames drawn at random from frames 1 to 898
  (`random.seed(7)`), first to `/frames/{n}/analysis?direction=row&position=650` and then to
  `/frames/{n}/combined-image`. Latency is the client-side time from sending the request to reading the complete
  response; throughput is requests divided by the wall time of the run. The client runs on the same machine.
- **Endpoint timing.** Five sequential `curl` requests per endpoint; the median of `time_total` is reported.
  The last row of Table 23, the first frame request after the cache file was removed, was recorded with a one-off
  command; its output is `results/cold_cache_first_request.txt`.
- **Processor cost.** Five runs of each command inside the backend container on frame 300 of the cached mm3a file.
  The values in §6.8 (0.216 s start-up and imports; 0.299 s analysis; 0.312 s amplitude image; 0.607 s phase image)
  were measured on 1 November 2026 with an equivalent one-off loop; this script reproduces that measurement.

Timing results vary between runs and machines: a repeat of `hdf5_layout.py` on 8 November 2026 gave single-frame read
medians of 12.8 ms (p1) and 15.0 ms (mm3a) against 11.8 ms and 12.6 ms in the thesis, while all sizes, ratios, chunk
shapes, filters and attribute counts were identical.

The supplied HDF5 files themselves are not part of the repository.
