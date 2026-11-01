package com.example.lfidashboard.service;

import com.example.lfidashboard.entity.DatasetEntity;
import com.example.lfidashboard.model.DatasetDetail;
import com.example.lfidashboard.model.DatasetSummary;
import com.example.lfidashboard.model.MetadataItem;
import com.example.lfidashboard.repository.DatasetRepository;
import com.example.lfidashboard.repository.MetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class DatasetService {

    private final DatasetRepository datasetRepository;
    private final MetadataRepository metadataRepository;

    public DatasetService(DatasetRepository datasetRepository, MetadataRepository metadataRepository) {
        this.datasetRepository = datasetRepository;
        this.metadataRepository = metadataRepository;
    }

    public List<DatasetSummary> getAllDatasets() {
        return datasetRepository.findAll()
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public DatasetDetail getDatasetDetail(Long id) {
        DatasetEntity dataset = findDataset(id);
        boolean hdf5Available = dataset.getHdf5ObjectId() != null;
        return new DatasetDetail(
                dataset.getId(),
                dataset.getName(),
                dataset.getSourceFile(),
                dataset.getExperimentDate(),
                dataset.getTarget(),
                dataset.getStatus(),
                dataset.getImportedAt(),
                dataset.getDescription(),
                hdf5Available
                        ? List.of("metadata", "amplitudeImage", "phaseImage", "combinedImage", "frameProfiles", "histograms")
                        : List.of("metadata"),
                hdf5Available,
                dataset.getAmplitudeFrameCount(),
                dataset.getPhaseFrameCount(),
                dataset.getFrameHeight(),
                dataset.getFrameWidth(),
                dataset.getFileSize(),
                dataset.getSha256()
        );
    }

    public List<MetadataItem> getMetadata(Long id) {
        findDataset(id);
        return metadataRepository.findByDatasetIdOrderById(id)
                .stream()
                .map(metadata -> new MetadataItem(metadata.getMetadataKey(), metadata.getMetadataValue()))
                .toList();
    }

    public DatasetEntity findDataset(Long id) {
        return datasetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Dataset not found: " + id));
    }

    private DatasetSummary toSummary(DatasetEntity dataset) {
        return new DatasetSummary(
                dataset.getId(),
                dataset.getName(),
                dataset.getSourceFile(),
                dataset.getExperimentDate(),
                dataset.getTarget(),
                dataset.getStatus(),
                dataset.getImportedAt()
        );
    }
}
