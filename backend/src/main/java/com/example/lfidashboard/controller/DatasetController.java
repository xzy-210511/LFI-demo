package com.example.lfidashboard.controller;

import com.example.lfidashboard.model.DatasetDetail;
import com.example.lfidashboard.model.DatasetSummary;
import com.example.lfidashboard.model.MetadataItem;
import com.example.lfidashboard.model.SignalPoint;
import com.example.lfidashboard.service.DatasetService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/datasets")
public class DatasetController {

    private final DatasetService datasetService;

    public DatasetController(DatasetService datasetService) {
        this.datasetService = datasetService;
    }

    @GetMapping
    public List<DatasetSummary> getDatasets() {
        return datasetService.getAllDatasets();
    }

    @GetMapping("/{id}")
    public DatasetDetail getDatasetDetail(@PathVariable Long id) {
        return datasetService.getDatasetDetail(id);
    }

    @GetMapping("/{id}/metadata")
    public List<MetadataItem> getDatasetMetadata(@PathVariable Long id) {
        return datasetService.getMetadata(id);
    }

    @GetMapping("/{id}/signals")
    public List<SignalPoint> getDatasetSignals(@PathVariable Long id) {
        return datasetService.getSignalPoints(id);
    }
}
