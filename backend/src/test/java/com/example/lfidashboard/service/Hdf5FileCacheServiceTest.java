package com.example.lfidashboard.service;

import com.example.lfidashboard.entity.DatasetEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class Hdf5FileCacheServiceTest {

    private static final byte[] STORED_BYTES = "stored hdf5 bytes".getBytes(StandardCharsets.US_ASCII);

    @TempDir
    Path cacheDirectory;

    private LargeObjectStorageService storage;
    private Hdf5FileCacheService cache;

    @BeforeEach
    void setUp() {
        storage = mock(LargeObjectStorageService.class);
        cache = new Hdf5FileCacheService(storage, cacheDirectory.toString());
        doAnswer(invocation -> {
            Path destination = invocation.getArgument(1);
            Files.write(destination, STORED_BYTES);
            return Sha256.of(new ByteArrayInputStream(STORED_BYTES));
        }).when(storage).copyTo(eq(42L), any(Path.class));
    }

    @Test
    void restoresVerifiedSourceOnceAndThenServesTheCache() throws Exception {
        DatasetEntity dataset = dataset(Sha256.of(new ByteArrayInputStream(STORED_BYTES)));

        Path first = cache.getSourceFile(dataset);
        Path second = cache.getSourceFile(dataset);

        assertThat(first).isEqualTo(second);
        assertThat(Files.readAllBytes(first)).isEqualTo(STORED_BYTES);
        verify(storage, times(1)).copyTo(eq(42L), any(Path.class));
    }

    @Test
    void rejectsRestoredSourceWhenChecksumDoesNotMatch() {
        DatasetEntity dataset = dataset("0".repeat(64));

        assertThatThrownBy(() -> cache.getSourceFile(dataset))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("SHA-256");
        assertThat(cacheDirectory.resolve("dataset-7.hdf5")).doesNotExist();
        assertThat(cacheDirectory.resolve("dataset-7.part")).doesNotExist();
    }

    @Test
    void evictRemovesCachedSource() {
        DatasetEntity dataset = dataset(null);
        Path cached = cache.getSourceFile(dataset);

        cache.evict(7L);

        assertThat(cached).doesNotExist();
    }

    private DatasetEntity dataset(String sha256) {
        DatasetEntity dataset = new DatasetEntity(
                "p1", "p1.hdf5", LocalDate.now(), "Mushroom", "IMPORTED", LocalDateTime.now(), "test");
        ReflectionTestUtils.setField(dataset, "id", 7L);
        dataset.setHdf5ObjectId(42L);
        dataset.setFileSize((long) STORED_BYTES.length);
        dataset.setSha256(sha256);
        return dataset;
    }
}
