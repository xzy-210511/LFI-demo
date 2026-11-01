# LFI Data Management and Visualisation Dashboard

Design and Development of a Data Management and Visualisation Dashboard for Laser Feedback Interferometry Experiments.

This repository contains a local development starter project for a web-based Laser Feedback Interferometry (LFI) experimental data dashboard. The current MVP is a prototype for managing, browsing, and visualising LFI datasets using mock backend data only. It does not implement new LFI sensing theory or new signal processing algorithms.

## Tech Stack

- Backend: Java 17, Spring Boot, REST APIs
- Frontend: Vite, React, TypeScript, React Router, Recharts
- Future database: PostgreSQL
- Future source data: mushroom HDF5 files

## Folder Structure

```text
backend/
  pom.xml
  src/main/java/com/example/lfidashboard/
    config/
    controller/
    model/
    service/
  src/main/resources/application.properties

frontend/
  package.json
  index.html
  src/
    api/
    components/
    pages/
    types/
    App.tsx
    main.tsx
    styles.css
```

## Run the Backend

Prerequisites:

- Java 17 or later
- Maven

From the repository root:

```powershell
cd backend
mvn spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

Health check:

```text
GET http://localhost:8080/api/health
```

Expected response:

```json
{
  "status": "UP",
  "service": "LFI Dashboard Backend"
}
```

## Run the Frontend

Prerequisites:

- Node.js
- npm

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

The frontend expects the backend to be running at `http://localhost:8080`.

## One-command Docker Startup

Docker is optional, but it is the easiest startup path when Java, Maven, or Node.js are not installed locally.

Prerequisite:

- Docker Desktop

From the repository root:

```powershell
docker compose up --build
```

Or run the helper script:

```powershell
.\start-dev.ps1
```

Then open:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8080
```

To stop the containers:

```powershell
docker compose down
```

Or run:

```powershell
.\stop-dev.ps1
```

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check whether the backend is running |
| GET | `/api/datasets` | List dataset summaries |
| GET | `/api/datasets/{id}` | Dataset detail, frame counts, dimensions, file size and SHA-256 |
| GET | `/api/datasets/{id}/metadata` | Extracted key-value metadata |
| POST | `/api/datasets/import` | Validate an `.h5`/`.hdf5` upload, record its SHA-256, generate frame-0 previews and store the file |
| DELETE | `/api/datasets/{id}` | Delete the record, its metadata, the stored Large Object and the cached file |
| POST | `/api/datasets/{id}/integrity` | Re-read the stored file from PostgreSQL and compare its SHA-256 with the upload checksum |
| GET | `/api/datasets/{id}/frames/{frame}/analysis` | Row/column profile (`direction`, `position`), statistics and 32-bin histograms |
| GET | `/api/datasets/{id}/frames/{frame}/amplitude-image` | Amplitude PNG |
| GET | `/api/datasets/{id}/frames/{frame}/phase-image` | Phase PNG |
| GET | `/api/datasets/{id}/frames/{frame}/combined-image` | Combined THz PNG (hue = phase, saturation = amplitude) |

The import endpoint accepts `multipart/form-data` with the field name `file`.

Every restore of a stored file into the HDF5 cache is checked against the SHA-256 recorded at upload. A mismatch
returns HTTP 409 and the restored copy is discarded. Datasets imported before checksums existed get a baseline
recorded the first time `/integrity` is called.

## Tests

```powershell
# Python HDF5 processor (needs h5py, numpy, Pillow)
cd backend/tools
python -m unittest test_hdf5_processor -v

# Java services, using the same Maven image as the Docker build
docker run --rm -v "${PWD}/backend:/app" -v lfi-maven-repo:/root/.m2 -w /app maven:3.9.9-eclipse-temurin-17 mvn -B test
```

## Current Limitations

- Login, registration and profile pages are browser-only prototypes, not secure authentication
- No participant-based usability study yet
- Response times were measured on one local machine only; no load testing
- Physical axis units and spacing are not stored in the supplied files, so profiles use sample indices
- Expected HDF5 structure: `amplitude` and `phase` groups of matching 2-D frames
