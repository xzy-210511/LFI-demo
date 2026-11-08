"""HDF5 storage layout of the supplied files (thesis Section 2.4).

Reports chunk shape, filters, attributes, raw and stored sizes, the compressed size of frame 0 and the
median time to read one frame. Usage: python hdf5_layout.py <dir containing p1.hdf5 and mm3a.hdf5> <out.json>
"""
import json
import statistics
import sys
import time
from pathlib import Path

import h5py

SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])
result = {}
for name in ("p1", "mm3a"):
    t0 = time.perf_counter()
    f = h5py.File(SRC / f"{name}.hdf5", "r")
    open_s = time.perf_counter() - t0
    info = {"file_attrs": len(f.attrs), "groups": list(f), "open_s": round(open_s, 4)}
    raw = stored = 0
    for g in ("amplitude", "phase"):
        info[f"{g}_group_attrs"] = len(f[g].attrs)
        names = sorted(f[g])
        first = f[g][names[0]]
        info[f"{g}_frame0"] = {"shape": first.shape, "dtype": str(first.dtype), "chunks": first.chunks,
                               "compression": first.compression, "level": first.compression_opts,
                               "shuffle": first.shuffle, "fletcher32": first.fletcher32,
                               "chunk0_bytes": first.id.get_chunk_info(0).size}
        info[f"{g}_dataset_attrs_total"] = sum(len(f[g][n].attrs) for n in names)
        for n in names:
            ds = f[g][n]
            raw += ds.size * ds.dtype.itemsize
            stored += ds.id.get_storage_size()
    info["raw_bytes"], info["stored_bytes"] = raw, stored
    info["compression_ratio"] = round(raw / stored, 2)
    reads = []
    names = sorted(f["amplitude"])
    for k in range(0, len(names), max(1, len(names) // 25)):
        t0 = time.perf_counter()
        f["amplitude"][names[k]][()]
        reads.append(time.perf_counter() - t0)
    info["single_frame_read_median_ms"] = round(statistics.median(reads) * 1000, 1)
    f.close()
    result[name] = info
OUT.write_text(json.dumps(result, indent=1, default=list), encoding="utf-8")
print(json.dumps(result, indent=1, default=list))
