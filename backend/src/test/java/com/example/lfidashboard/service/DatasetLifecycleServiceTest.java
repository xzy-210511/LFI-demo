package com.example.lfidashboard.service;

import com.example.lfidashboard.entity.DatasetEntity;
import com.example.lfidashboard.model.IntegrityReport;
import com.example.lfidashboard.repository.DatasetRepository;
import com.example.lfidashboard.repository.MetadataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.NOT_FOUND;

class DatasetLifecycleServiceTest {

    private static final String RECORDED = "a".repeat(64);

    private DatasetService datasetService;
    private DatasetRepository datasetRepository;
    private MetadataRepository metadataRepository;
    private LargeObjectStorageService storage;
    private Hdf5FileCacheService cache;
    private DatasetLifecycleService service;

    @BeforeEach
    void setUp() {
        datasetService = mock(DatasetService.class);
        datasetRepository = mock(DatasetRepository.class);
        metadataRepository = mock(MetadataRepository.class);
        storage = mock(LargeObjectStorageService.class);
        cache = mock(Hdf5FileCacheService.class);
        service = new DatasetLifecycleService(datasetService, datasetRepository, metadataRepository, storage, cache);
    }

    @Test
    void deleteRemovesMetadataLargeObjectRecordAndCache() {
        DatasetEntity dataset = dataset(5L, 99L, RECORDED);
        when(datasetService.findDataset(5L)).thenReturn(dataset);

        service.deleteDataset(5L);

        verify(metadataRepository).deleteByDatasetId(5L);
        verify(storage).delete(99L);
        verify(datasetRepository).delete(dataset);
        verify(cache).evict(5L);
    }

    @Test
    void deleteOfRecordWithoutStoredFileSkipsLargeObject() {
        DatasetEntity seed = dataset(1L, null, null);
        when(datasetService.findDataset(1L)).thenReturn(seed);

        service.deleteDataset(1L);

        verify(storage, never()).delete(anyLong());
        verify(datasetRepository).delete(seed);
    }

    @Test
    void deleteOfUnknownDatasetDoesNotTouchStorage() {
        when(datasetService.findDataset(404L)).thenThrow(new ResponseStatusException(NOT_FOUND, "Dataset not found: 404"));

        assertThatThrownBy(() -> service.deleteDataset(404L)).isInstanceOf(ResponseStatusException.class);
        verify(storage, never()).delete(anyLong());
        verify(datasetRepository, never()).delete(any());
    }

    @Test
    void integrityIsVerifiedWhenStoredBytesMatch() {
        when(datasetService.findDataset(5L)).thenReturn(dataset(5L, 99L, RECORDED));
        when(storage.sha256(99L)).thenReturn(RECORDED);

        IntegrityReport report = service.verifyIntegrity(5L);

        assertThat(report.status()).isEqualTo("VERIFIED");
        assertThat(report.storedSha256()).isEqualTo(RECORDED);
    }

    @Test
    void integrityMismatchIsReported() {
        when(datasetService.findDataset(5L)).thenReturn(dataset(5L, 99L, RECORDED));
        when(storage.sha256(99L)).thenReturn("b".repeat(64));

        assertThat(service.verifyIntegrity(5L).status()).isEqualTo("MISMATCH");
    }

    @Test
    void legacyDatasetGetsBaselineChecksumRecorded() {
        DatasetEntity legacy = dataset(4L, 77L, null);
        when(datasetService.findDataset(4L)).thenReturn(legacy);
        when(storage.sha256(77L)).thenReturn(RECORDED);

        IntegrityReport report = service.verifyIntegrity(4L);

        assertThat(report.status()).isEqualTo("BASELINE_RECORDED");
        assertThat(legacy.getSha256()).isEqualTo(RECORDED);
        verify(datasetRepository).save(legacy);
        verify(metadataRepository).saveAll(anyIterable());
    }

    private DatasetEntity dataset(Long id, Long objectId, String sha256) {
        DatasetEntity dataset = new DatasetEntity(
                "p1", "p1.hdf5", LocalDate.now(), "Mushroom", "IMPORTED", LocalDateTime.now(), "test");
        ReflectionTestUtils.setField(dataset, "id", id);
        dataset.setHdf5ObjectId(objectId);
        dataset.setFileSize(1024L);
        dataset.setSha256(sha256);
        return dataset;
    }
}
