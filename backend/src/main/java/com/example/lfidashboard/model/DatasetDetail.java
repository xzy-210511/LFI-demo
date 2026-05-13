package com.example.lfidashboard.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record DatasetDetail(
        Long id,
        String name,
        String sourceFile,
        LocalDate experimentDate,
        String target,
        String status,
        LocalDateTime importedAt,
        String description,
        List<String> availableOutputs
) {
}
