package com.example.lfidashboard.service;

import com.example.lfidashboard.entity.DatasetEntity;
import com.example.lfidashboard.entity.MetadataEntity;
import com.example.lfidashboard.model.IntegrityReport;
import com.example.lfidashboard.repository.DatasetRepository;
import com.example.lfidashboard.repository.MetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Deletion and integrity checks for stored datasets.
 */
@Service
public class DatasetLifecycleService {

    private final DatasetService datasetService;
    private final DatasetRepository datasetRepository;
    private final MetadataRepository metadataRepository;
    private final LargeObjectStorageService largeObjectStorageService;
    private final Hdf5FileCacheService fileCacheService;

    public DatasetLifecycleService(
            DatasetService datasetService,
            DatasetRepository datasetRepository,
            MetadataRepository metadataRepository,
            LargeObjectStorageService largeObjectStorageService,
            Hdf5FileCacheService fileCacheService
    ) {
        this.datasetService = datasetService;
        this.datasetRepository = datasetRepository;
        this.metadataRepository = metadataRepository;
        this.largeObjectStorageService = largeObjectStorageService;
        this.fileCacheService = fileCacheService;
    }

    /**
     * Removes the record, its metadata and its Large Object in one transaction.
     * The cache file is removed only after the transaction commits, so a rollback never loses the source.
     */
    @Transactional
    public void deleteDataset(Long id) {
        DatasetEntity dataset = datasetService.findDataset(id);

        metadataRepository.deleteByDatasetId(id);
        if (dataset.getHdf5ObjectId() != null) {
            largeObjectStorageService.delete(dataset.getHdf5ObjectId());
        }
        datasetRepository.delete(dataset);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    fileCacheService.evict(id);
                }
            });
        } else {
            fileCacheService.evict(id);
        }
    }

    /**
     * Re-reads the stored bytes from PostgreSQL (not the cache) and compares them with the upload checksum.
     */
    @Transactional
    public IntegrityReport verifyIntegrity(Long id) {
        DatasetEntity dataset = datasetService.findDataset(id);
        if (dataset.getHdf5ObjectId() == null) {
            throw new ResponseStatusException(NOT_FOUND, "No HDF5 source file is stored for this dataset.");
        }

        String storedSha256 = largeObjectStorageService.sha256(dataset.getHdf5ObjectId());
        String recordedSha256 = dataset.getSha256();
        String status;

        if (recordedSha256 == null) {
            // Datasets imported before checksums existed get a baseline from their stored copy.
            dataset.setSha256(storedSha256);
            datasetRepository.save(dataset);
            metadataRepository.saveAll(List.of(
                    new MetadataEntity(dataset, "sha256", storedSha256),
                    new MetadataEntity(dataset, "sha256_source", "stored copy (imported before checksums)")
            ));
            recordedSha256 = storedSha256;
            status = "BASELINE_RECORDED";
        } else {
            status = recordedSha256.equalsIgnoreCase(storedSha256) ? "VERIFIED" : "MISMATCH";
        }

        long fileSize = dataset.getFileSize() == null ? 0 : dataset.getFileSize();
        return new IntegrityReport(id, status, recordedSha256, storedSha256, fileSize, LocalDateTime.now());
    }
}
