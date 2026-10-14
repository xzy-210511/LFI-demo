package com.example.lfidashboard.service;

import com.example.lfidashboard.entity.DatasetEntity;
import com.example.lfidashboard.entity.MetadataEntity;
import com.example.lfidashboard.model.Hdf5Summary;
import com.example.lfidashboard.model.ImportResult;
import com.example.lfidashboard.repository.DatasetRepository;
import com.example.lfidashboard.repository.MetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class Hdf5ImportService {

    private final DatasetRepository datasetRepository;
    private final MetadataRepository metadataRepository;
    private final LargeObjectStorageService largeObjectStorageService;
    private final Hdf5ProcessorService hdf5ProcessorService;

    public Hdf5ImportService(
            DatasetRepository datasetRepository,
            MetadataRepository metadataRepository,
            LargeObjectStorageService largeObjectStorageService,
            Hdf5ProcessorService hdf5ProcessorService
    ) {
        this.datasetRepository = datasetRepository;
        this.metadataRepository = metadataRepository;
        this.largeObjectStorageService = largeObjectStorageService;
        this.hdf5ProcessorService = hdf5ProcessorService;
    }

    @Transactional
    public ImportResult importFile(MultipartFile file) {
        validateFile(file);

        String originalFileName = file.getOriginalFilename();
        Path temporaryFile = null;

        try {
            temporaryFile = Files.createTempFile("lfi-upload-", ".hdf5");
            try (var input = file.getInputStream()) {
                Files.copy(input, temporaryFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }

            Hdf5Summary summary = hdf5ProcessorService.readSummary(temporaryFile);
            byte[] amplitudePreview = hdf5ProcessorService.generateImage(temporaryFile, 0, "amplitude");
            byte[] phasePreview = hdf5ProcessorService.generateImage(temporaryFile, 0, "phase");
            byte[] combinedPreview = hdf5ProcessorService.generateImage(temporaryFile, 0, "combined");
            long largeObjectId = largeObjectStorageService.store(temporaryFile);

            DatasetEntity dataset = new DatasetEntity(
                    removeExtension(originalFileName),
                    originalFileName,
                    LocalDate.now(),
                    "Mushroom",
                    "IMPORTED",
                    LocalDateTime.now(),
                    "Imported HDF5 result dataset with generated frame visualisations."
            );
            dataset.setHdf5ObjectId(largeObjectId);
            dataset.setFileSize(file.getSize());
            dataset.setAmplitudeFrameCount(summary.amplitudeFrameCount());
            dataset.setPhaseFrameCount(summary.phaseFrameCount());
            dataset.setFrameHeight(summary.frameHeight());
            dataset.setFrameWidth(summary.frameWidth());
            dataset.setAmplitudePreview(amplitudePreview);
            dataset.setPhasePreview(phasePreview);
            dataset.setCombinedPreview(combinedPreview);

            DatasetEntity savedDataset = datasetRepository.save(dataset);
            metadataRepository.saveAll(List.of(
                    new MetadataEntity(savedDataset, "source_file", originalFileName),
                    new MetadataEntity(savedDataset, "file_size_bytes", String.valueOf(file.getSize())),
                    new MetadataEntity(savedDataset, "amplitude_frame_count", String.valueOf(summary.amplitudeFrameCount())),
                    new MetadataEntity(savedDataset, "phase_frame_count", String.valueOf(summary.phaseFrameCount())),
                    new MetadataEntity(savedDataset, "frame_height", String.valueOf(summary.frameHeight())),
                    new MetadataEntity(savedDataset, "frame_width", String.valueOf(summary.frameWidth())),
                    new MetadataEntity(savedDataset, "data_type", summary.dataType()),
                    new MetadataEntity(savedDataset, "compression", summary.compression()),
                    new MetadataEntity(savedDataset, "amplitude_minimum", String.valueOf(summary.amplitudeMinimum())),
                    new MetadataEntity(savedDataset, "amplitude_maximum", String.valueOf(summary.amplitudeMaximum())),
                    new MetadataEntity(savedDataset, "amplitude_mean", String.valueOf(summary.amplitudeMean())),
                    new MetadataEntity(savedDataset, "amplitude_standard_deviation", String.valueOf(summary.amplitudeStandardDeviation())),
                    new MetadataEntity(savedDataset, "phase_minimum", String.valueOf(summary.phaseMinimum())),
                    new MetadataEntity(savedDataset, "phase_maximum", String.valueOf(summary.phaseMaximum())),
                    new MetadataEntity(savedDataset, "phase_mean", String.valueOf(summary.phaseMean())),
                    new MetadataEntity(savedDataset, "phase_standard_deviation", String.valueOf(summary.phaseStandardDeviation()))
            ));

            return new ImportResult(
                    savedDataset.getId(),
                    originalFileName,
                    "IMPORTED",
                    "HDF5 file stored in PostgreSQL and the first visualisation frame was generated."
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to prepare the uploaded HDF5 file.", exception);
        } finally {
            if (temporaryFile != null) {
                try {
                    Files.deleteIfExists(temporaryFile);
                } catch (IOException ignored) {
                    // Temporary files are cleaned up by the operating system if needed.
                }
            }
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Please select a non-empty .h5 or .hdf5 file.");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Uploaded file must have a filename.");
        }

        String lowerCaseName = originalFileName.toLowerCase();
        if (!lowerCaseName.endsWith(".h5") && !lowerCaseName.endsWith(".hdf5")) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid file type. Please upload a .h5 or .hdf5 file.");
        }
    }

    private String removeExtension(String fileName) {
        int extensionIndex = fileName.lastIndexOf('.');
        return extensionIndex > 0 ? fileName.substring(0, extensionIndex) : fileName;
    }
}
