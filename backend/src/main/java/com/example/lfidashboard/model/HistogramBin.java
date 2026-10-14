package com.example.lfidashboard.model;

public record HistogramBin(
        double start,
        double end,
        int count
) {
}
