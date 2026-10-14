package com.example.lfidashboard.model;

public record Hdf5Summary(
        int amplitudeFrameCount,
        int phaseFrameCount,
        int frameHeight,
        int frameWidth,
        String dataType,
        String compression,
        double amplitudeMinimum,
        double amplitudeMaximum,
        double amplitudeMean,
        double amplitudeStandardDeviation,
        double phaseMinimum,
        double phaseMaximum,
        double phaseMean,
        double phaseStandardDeviation
) {
}
