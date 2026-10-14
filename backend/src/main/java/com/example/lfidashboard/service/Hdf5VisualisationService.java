package com.example.lfidashboard.service;

import com.example.lfidashboard.entity.DatasetEntity;
import com.example.lfidashboard.model.FrameAnalysis;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class Hdf5VisualisationService {

    private static final int HISTOGRAM_BINS = 32;

    private final DatasetService datasetService;
    private final Hdf5FileCacheService fileCacheService;
    private final Hdf5ProcessorService processorService;

    public Hdf5VisualisationService(
            DatasetService datasetService,
            Hdf5FileCacheService fileCacheService,
            Hdf5ProcessorService processorService
    ) {
        this.datasetService = datasetService;
        this.fileCacheService = fileCacheService;
        this.processorService = processorService;
    }

    public byte[] getImage(Long datasetId, int frameIndex, String imageType) {
        DatasetEntity dataset = requireHdf5Dataset(datasetId);
        validateFrame(dataset, frameIndex, imageType);

        byte[] preview = frameIndex == 0 ? previewFor(dataset, imageType) : null;
        if (preview != null) {
            return preview;
        }

        Path sourceFile = fileCacheService.getSourceFile(dataset);
        return processorService.generateImage(sourceFile, frameIndex, imageType);
    }

    public FrameAnalysis analyzeFrame(
            Long datasetId,
            int frameIndex,
            String direction,
            Integer requestedPosition
    ) {
        DatasetEntity dataset = requireHdf5Dataset(datasetId);
        validateFrame(dataset, frameIndex, "combined");

        String normalizedDirection = direction == null ? "row" : direction.toLowerCase();
        if (!normalizedDirection.equals("row") && !normalizedDirection.equals("column")) {
            throw new ResponseStatusException(BAD_REQUEST, "Profile direction must be row or column.");
        }

        Integer dimension = normalizedDirection.equals("row")
                ? dataset.getFrameHeight()
                : dataset.getFrameWidth();
        if (dimension == null || dimension <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Frame dimensions are not available for this dataset.");
        }

        int position = requestedPosition == null ? dimension / 2 : requestedPosition;
        if (position < 0 || position >= dimension) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Profile position must be between 0 and " + (dimension - 1) + "."
            );
        }

        Path sourceFile = fileCacheService.getSourceFile(dataset);
        return processorService.analyzeFrame(
                sourceFile,
                frameIndex,
                normalizedDirection,
                position,
                HISTOGRAM_BINS
        );
    }

    private DatasetEntity requireHdf5Dataset(Long id) {
        DatasetEntity dataset = datasetService.findDataset(id);
        if (dataset.getHdf5ObjectId() == null) {
            throw new ResponseStatusException(NOT_FOUND, "No HDF5 source file is stored for this dataset.");
        }
        return dataset;
    }

    private void validateFrame(DatasetEntity dataset, int frameIndex, String imageType) {
        int frameCount = switch (imageType) {
            case "amplitude" -> valueOrZero(dataset.getAmplitudeFrameCount());
            case "phase" -> valueOrZero(dataset.getPhaseFrameCount());
            case "combined" -> Math.min(
                    valueOrZero(dataset.getAmplitudeFrameCount()),
                    valueOrZero(dataset.getPhaseFrameCount())
            );
            default -> throw new ResponseStatusException(BAD_REQUEST, "Unknown image type: " + imageType);
        };

        if (frameIndex < 0 || frameIndex >= frameCount) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Frame index must be between 0 and " + Math.max(0, frameCount - 1) + "."
            );
        }
    }

    private byte[] previewFor(DatasetEntity dataset, String imageType) {
        return switch (imageType) {
            case "amplitude" -> dataset.getAmplitudePreview();
            case "phase" -> dataset.getPhasePreview();
            case "combined" -> dataset.getCombinedPreview();
            default -> null;
        };
    }

    private int valueOrZero(Integer value) {
        return value == null ? 0 : value;
    }
}
