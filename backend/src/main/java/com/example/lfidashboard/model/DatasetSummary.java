package com.example.lfidashboard.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DatasetSummary(
        Long id,
        String name,
        String sourceFile,
        LocalDate experimentDate,
        String target,
        String status,
        LocalDateTime importedAt
) {
}
