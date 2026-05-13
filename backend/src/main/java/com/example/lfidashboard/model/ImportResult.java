package com.example.lfidashboard.model;

public record ImportResult(
        Long datasetId,
        String fileName,
        String status,
        String message
) {
}
