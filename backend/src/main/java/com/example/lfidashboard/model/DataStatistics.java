package com.example.lfidashboard.model;

public record DataStatistics(
        double minimum,
        double maximum,
        double mean,
        double standardDeviation,
        int finiteCount
) {
}
