package com.example.lfidashboard.model;

import java.util.List;

public record FrameAnalysis(
        int frameIndex,
        String amplitudeFrameName,
        String phaseFrameName,
        int frameHeight,
        int frameWidth,
        String direction,
        int position,
        List<FrameProfilePoint> profilePoints,
        DataStatistics amplitudeStatistics,
        DataStatistics phaseStatistics,
        List<HistogramBin> amplitudeHistogram,
        List<HistogramBin> phaseHistogram
) {
}
