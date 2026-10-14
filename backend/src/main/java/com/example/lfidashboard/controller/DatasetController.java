package com.example.lfidashboard.controller;

import com.example.lfidashboard.model.DatasetDetail;
import com.example.lfidashboard.model.DatasetSummary;
import com.example.lfidashboard.model.FrameAnalysis;
import com.example.lfidashboard.model.MetadataItem;
import com.example.lfidashboard.service.DatasetService;
import com.example.lfidashboard.service.Hdf5VisualisationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/datasets")
public class DatasetController {

    private final DatasetService datasetService;
    private final Hdf5VisualisationService visualisationService;

    public DatasetController(DatasetService datasetService, Hdf5VisualisationService visualisationService) {
        this.datasetService = datasetService;
        this.visualisationService = visualisationService;
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

    @GetMapping("/{id}/frames/{frame}/analysis")
    public FrameAnalysis getFrameAnalysis(
            @PathVariable Long id,
            @PathVariable int frame,
            @RequestParam(defaultValue = "row") String direction,
            @RequestParam(required = false) Integer position
    ) {
        return visualisationService.analyzeFrame(id, frame, direction, position);
    }

    @GetMapping(value = "/{id}/frames/{frame}/amplitude-image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getAmplitudeImage(@PathVariable Long id, @PathVariable int frame) {
        return png(visualisationService.getImage(id, frame, "amplitude"));
    }

    @GetMapping(value = "/{id}/frames/{frame}/phase-image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getFramePhaseImage(@PathVariable Long id, @PathVariable int frame) {
        return png(visualisationService.getImage(id, frame, "phase"));
    }

    @GetMapping(value = "/{id}/frames/{frame}/combined-image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getCombinedImage(@PathVariable Long id, @PathVariable int frame) {
        return png(visualisationService.getImage(id, frame, "combined"));
    }

    // Kept for existing bookmarks created by the first prototype.
    @GetMapping(value = "/{id}/phase-image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getPhaseImage(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int frame
    ) {
        return png(visualisationService.getImage(id, frame, "phase"));
    }

    private ResponseEntity<byte[]> png(byte[] image) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(image);
    }
}
