package com.example.lfidashboard.model;

import java.time.LocalDateTime;

/**
 * Result of re-reading a stored HDF5 source from PostgreSQL and comparing its SHA-256.
 *
 * @param status VERIFIED when the stored bytes match the recorded checksum, MISMATCH when they do not,
 *               BASELINE_RECORDED when the dataset predates checksums and the stored value was recorded now
 */
public record IntegrityReport(
        Long datasetId,
        String status,
        String recordedSha256,
        String storedSha256,
        long fileSizeBytes,
        LocalDateTime checkedAt
) {
}
