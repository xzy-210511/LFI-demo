# Mushroom HDF5 Data Integration Notes

This note records the observed structure of the teacher-provided mushroom LFI files and suggests how to connect them to the dashboard.

## Files Found

```text
Mushroom/mm3a.hdf5
Mushroom/p1.hdf5
Mushroom/m1.jpg
Mushroom/m2.jpg
```

Approximate HDF5 file sizes:

- `mm3a.hdf5`: 2.21 GB
- `p1.hdf5`: 1.29 GB

The JPG files appear to be visual reference/export images for amplitude log views.

## Observed HDF5 Structure

Both HDF5 files have the same top-level structure:

```text
/
  amplitude/
    0000
    0001
    ...
  phase/
    0000
    0001
    ...
```

There were no root attributes in the inspected files.

### `mm3a.hdf5`

- Top-level groups: `amplitude`, `phase`
- `amplitude` frame count: 899
- `phase` frame count: 899
- Frame name range: mostly `0000` to `0899`
- Each frame shape: `1300 x 400`
- Data type: `float64`
- Compression: `gzip`

### `p1.hdf5`

- Top-level groups: `amplitude`, `phase`
- `amplitude` frame count: 554
- `phase` frame count: 554
- Frame name range: `0000` to `0553`
- Each frame shape: `1300 x 400`
- Data type: `float64`
- Compression: `gzip`

## What This Means

These files are not simple raw one-dimensional signal files. They look like already processed LFI result files containing many two-dimensional amplitude and phase frames.

For the dashboard, they should be treated as result datasets:

- Dataset summary: one row per HDF5 file
- Metadata: file name, file size, group names, frame counts, image dimensions, dtype, compression
- Result visualisation: amplitude and phase image previews
- Signal chart: optional derived preview, such as a row/column profile from one selected frame

## Recommended Integration Path

### Stage 1: Lightweight Local Preview

Keep the Spring Boot backend and React frontend, but add a small import/preview module that extracts only lightweight data from HDF5 files.

Recommended backend endpoints:

```text
GET /api/datasets/{id}/hdf5-summary
GET /api/datasets/{id}/frames
GET /api/datasets/{id}/frames/{frameIndex}/amplitude-image
GET /api/datasets/{id}/frames/{frameIndex}/phase-image
GET /api/datasets/{id}/frames/{frameIndex}/profile
```

Suggested frontend additions:

- Show frame count
- Add a frame selector slider
- Display amplitude image
- Display phase image
- Display a simple line profile from the selected frame

### Stage 2: Do Not Load Full Files Into Memory

Each frame is `1300 x 400 float64`, and each file contains hundreds of frames. The backend must read slices or single frames only.

Avoid:

- Loading the whole HDF5 file at once
- Sending full numeric matrices directly to the browser
- Letting the browser parse multi-GB HDF5 files

Prefer:

- Backend reads one selected frame
- Backend converts that frame to a PNG/JPG preview
- Frontend displays the generated image
- Backend sends small sampled line data for charts

### Stage 3: Long-term System Design

For the final system with PostgreSQL:

- Store file-level metadata in PostgreSQL
- Store frame metadata and extracted statistics in PostgreSQL
- Keep the original HDF5 files on disk or object storage
- Generate preview images and cache them
- Only read HDF5 numeric arrays when the user asks for a specific frame/result

## Java HDF5 Options

Possible approaches:

- Use a Java HDF5 library in Spring Boot, such as HDF Group Java bindings or another maintained HDF5 reader
- Use a small Python helper service/script with `h5py` for HDF5 extraction, called by the backend
- Preprocess HDF5 files into preview PNG files and JSON metadata before the dashboard loads them

For this beginner-friendly project, the safest next step is preprocessing:

1. Read each HDF5 file with Python `h5py`
2. Extract summary metadata to JSON
3. Export selected amplitude/phase frames as PNG images
4. Let Spring Boot serve the JSON and PNG files

This avoids adding complex native HDF5 dependencies to the Java backend too early.
