package com.example.lfidashboard.service;

import com.example.lfidashboard.model.DatasetDetail;
import com.example.lfidashboard.model.DatasetSummary;
import com.example.lfidashboard.model.MetadataItem;
import com.example.lfidashboard.model.SignalPoint;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class DatasetService {

    private final List<DatasetSummary> datasets = List.of(
            new DatasetSummary(
                    1L,
                    "Mushroom LFI Sample 01",
                    "mushroom_sample_01.h5",
                    LocalDate.of(2026, 4, 20),
                    "Mushroom",
                    "IMPORTED",
                    LocalDateTime.of(2026, 5, 12, 10, 30)
            ),
            new DatasetSummary(
                    2L,
                    "Mushroom LFI Sample 02",
                    "mushroom_sample_02.h5",
                    LocalDate.of(2026, 4, 22),
                    "Mushroom",
                    "PROCESSED",
                    LocalDateTime.of(2026, 5, 12, 11, 0)
            )
    );

    public List<DatasetSummary> getAllDatasets() {
        return datasets;
    }

    public DatasetDetail getDatasetDetail(Long id) {
        DatasetSummary summary = findDataset(id);

        return new DatasetDetail(
                summary.id(),
                summary.name(),
                summary.sourceFile(),
                summary.experimentDate(),
                summary.target(),
                summary.status(),
                summary.importedAt(),
                "Mock LFI dataset for early dashboard prototype.",
                List.of("metadata", "rawSignal", "processedSignal", "amplitudeImage", "phaseImage")
        );
    }

    public List<MetadataItem> getMetadata(Long id) {
        findDataset(id);

        return List.of(
                new MetadataItem("experiment_name", "Mushroom LFI Test 0" + id),
                new MetadataItem("sample_type", "Mushroom"),
                new MetadataItem("scan_width", "100"),
                new MetadataItem("scan_height", "100"),
                new MetadataItem("sampling_rate", "1000 Hz"),
                new MetadataItem("laser_type", "LFI / self-mixing setup"),
                new MetadataItem("operator", "Xiaoyang Zhang")
        );
    }

    public List<SignalPoint> getSignalPoints(Long id) {
        findDataset(id);

        List<SignalPoint> points = new ArrayList<>();
        for (int x = 0; x < 100; x++) {
            double baseWave = Math.sin((x + id) * 0.18);
            double secondaryWave = Math.cos(x * 0.07);
            double noise = Math.sin(x * 0.91) * 0.08;

            double raw = round(baseWave + secondaryWave * 0.25 + noise);
            double processed = round(baseWave * 0.92 + secondaryWave * 0.18);

            points.add(new SignalPoint(x, raw, processed));
        }

        return points;
    }

    private DatasetSummary findDataset(Long id) {
        return datasets.stream()
                .filter(dataset -> dataset.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Dataset not found: " + id));
    }

    private double round(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }
}
