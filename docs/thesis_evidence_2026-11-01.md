# Thesis revision evidence — 1 November 2026

Collected for the thesis revision (deadline 9 November 2026). All figures in `docs/thesis_figures/`.

Environment: Windows 11, Intel Core Ultra 7 155H, 31 GB RAM; Docker Desktop 29.8.2 (22 CPUs, 15.4 GiB to Docker);
PostgreSQL 16, Spring Boot 3.3.5 (Java 17 source), Python 3.12 (h5py 3.16.0), React 18 + Vite 5.

## 1. Datasets after p1 re-import

| ID | Name | Frames | Size (bytes) | SHA-256 (stored = original `sha256sum`) | Imported |
|---|---|---|---|---|---|
| 5 | mm3a | 899 / 899 | 2,368,577,814 | `2d04ec55c5cf3b5381e07e39e701de64c775b9b3f30b204ed8c566d0f5fd34ac` | 2026-10-22 |
| 7 | p1 | 554 / 554 | 1,381,181,338 | `844f8207ac6fe57cfec93b99b7332303f18d4a16f90917f8fd77270bff664b2e` | 2026-11-01 |

- p1 was previously dataset 4 (imported 2 Oct with the older processor). It was deleted through `DELETE /api/datasets/4`
  (HTTP 204, 7.10 s; Large Objects 2 → 1; metadata rows for id 4 → 0; cache file `dataset-4.hdf5` removed) and
  re-imported through `POST /api/datasets/import` (HTTP 200, 28.76 s including upload; new id 7; Large Objects 1 → 2).
- p1 now has a checksum recorded **at upload** (not a later baseline). mm3a's checksum was also recorded at upload (22 Oct).
- Seeded demonstration records 1 and 2 were already absent when the stack started on 1 Nov (not deleted in this session;
  origin to be confirmed). `DataInitializer` only seeds an empty table, so they are not recreated. The catalogue now
  holds only the two real files.
- New p1 frame-0 phase preview uses the full colour wheel (hue share per sixth ≈ 0.17 each), matching frame 1 and the
  current processor. The stale 2 Oct preview (two hues only) is gone.
- `POST /api/datasets/7/integrity` → `VERIFIED`.

## 2. Local response medians (5 sequential requests, warm cache)

| Operation | p1 (id 7) | mm3a (id 5) |
|---|---|---|
| Health | 0.0056 s | 0.0054 s |
| Dataset list | 0.0399 s | 0.0152 s |
| Dataset detail | 0.0147 s | 0.0134 s |
| Frame analysis (frame 0, row 650) | 0.2829 s | 0.2856 s |
| Frame-zero amplitude preview | 0.0130 s | 0.0145 s |
| Dynamic amplitude image, frame 1 | 0.2989 s | 0.3076 s |
| Dynamic phase image, frame 1 | 0.5730 s | 0.5807 s |
| Dynamic combined image, frame 1 | 0.4551 s | 0.4580 s |
| Integrity check (full re-read from PostgreSQL) | 4.49 s | 8.27 s |

- Every frame request on both files is under 0.65 s (max single run 0.653 s, p1 phase).
- Frame-zero preview is now ~0.013 s (served from stored bytes); the 2 Oct figure of 0.327 s is superseded.
- Cold cache (cache file removed, first frame request restores from PostgreSQL + verifies SHA-256 + renders):
  p1 6.41 s, mm3a 10.11 s; the next request on the warm cache: 0.32 s and 0.30 s.
- First mm3a integrity run was 16.04 s (cold database pages); later runs ~8.2 s.

## 3. Restart persistence (T12)

`docker compose down` (containers and network removed, named volumes kept) → `docker compose up -d`:
datasets 2 → 2, Large Objects 2 → 2; both datasets `VERIFIED` after restart; frame 100 combined image HTTP 200 for both.

## 4. Large Object transactionality

Inside `BEGIN … ROLLBACK`, `lo_from_bytea` created OID 40969 (count 2 → 3); after `ROLLBACK` the count returned to 2.
So a Large Object created during a failed import transaction is rolled back with it; the thesis's "explicit compensation"
caveat (Section 4.4) can be narrowed to the temporary file and cache, which are outside the database transaction.

## 5. Automated tests

| Suite | Tests | Result | Command |
|---|---|---|---|
| Python processor (`backend/tools`) | 4 | OK, 0.057 s | `docker run --rm --entrypoint python -w /app/tools lfi-demo-backend -m unittest test_hdf5_processor -v` |
| Java services (JUnit 5 + Mockito) | 18 in 5 classes | BUILD SUCCESS, 12.2 s | `docker run --rm -v "<repo>/backend:/app" -v lfi-maven-repo:/root/.m2 -w /app maven:3.9.9-eclipse-temurin-17 mvn -B test` |
| React (Vitest + Testing Library, jsdom) | 15 in 4 files | all passed, 2.89 s | `cd frontend && npm test` |
| **Total** | **37** | **all pass** | |

Java classes: `Sha256Test` (2), `Hdf5FileCacheServiceTest` (3), `DatasetLifecycleServiceTest` (6),
`Hdf5VisualisationServiceTest` (5), `Hdf5ImportServiceTest` (2).
React files: `api/client.test.ts` (3: 204 handling, JSON, error message), `components/DataIntegrityPanel.test.tsx`
(7: display, VERIFIED, MISMATCH, cancel delete, confirm delete, failed delete, seed record), `components/ResultPanel.test.tsx`
(2: same-frame URLs, failed image fallback), `pages/DatasetList.test.tsx` (3: search, URL status filter, error state).

## 6. Frontend production build

`npm run build` (tsc --noEmit + vite build): 851 modules, `index.js` 580.34 kB (167.31 kB gzip), CSS 12.16 kB, 2.74 s;
500 kB chunk-size warning still present.

## 7. Integrity and deletion end-to-end (22 Oct, small fixture)

Fixture `e2e_fixture.h5` (12 frames, 20 × 30): recorded SHA-256 equals local `sha256sum`; `/integrity` → VERIFIED;
recorded checksum overwritten → `/integrity` → MISMATCH; cache removed → frame request HTTP 409 "Stored HDF5 file failed
SHA-256 verification", no cache file left; checksum restored → HTTP 200; DELETE → 204; GET → 404; metadata rows 0;
Large Objects 3 → 2; cache file removed; second DELETE → 404; CORS preflight allows `GET,POST,DELETE,OPTIONS`;
frame 10 of unpadded names resolves to dataset name `10` (natural order).

## 8. Figures (docs/thesis_figures)

| File | Replaces / new |
|---|---|
| fig02_architecture.png | Figure 2 (adds SHA-256) |
| fig03_import_sequence.png | Figure 3 (adds checksum step and single transaction) |
| fig04_persistence_model.png | Figure 4 (adds `sha256`; table name corrected to `metadata_items`; column `hdf5object_id`) |
| fig_new_integrity_lifecycle.png | New figure for the integrity and lifecycle design section |
| fig06–fig14 | Figures 6–14 re-captured from p1 (id 7) and mm3a at 2× |
| fig_new_data_integrity_panel.png | New figure: Data Integrity panel after verification |
