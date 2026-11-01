package com.example.lfidashboard.service;

import com.example.lfidashboard.entity.DatasetEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

import static org.springframework.http.HttpStatus.CONFLICT;

@Service
public class Hdf5FileCacheService {

    private final LargeObjectStorageService largeObjectStorageService;
    private final Path cacheDirectory;

    public Hdf5FileCacheService(
            LargeObjectStorageService largeObjectStorageService,
            @Value("${hdf5.cache-directory}") String cacheDirectory
    ) {
        this.largeObjectStorageService = largeObjectStorageService;
        this.cacheDirectory = Path.of(cacheDirectory).toAbsolutePath().normalize();
    }

    @Transactional(readOnly = true)
    public synchronized Path getSourceFile(DatasetEntity dataset) {
        if (dataset.getId() == null || dataset.getHdf5ObjectId() == null) {
            throw new IllegalStateException("The dataset does not contain a stored HDF5 file.");
        }

        try {
            Files.createDirectories(cacheDirectory);
            Path cachedFile = cacheDirectory.resolve("dataset-" + dataset.getId() + ".hdf5");
            if (isComplete(cachedFile, dataset.getFileSize())) {
                return cachedFile;
            }

            Path partialFile = cacheDirectory.resolve("dataset-" + dataset.getId() + ".part");
            Files.deleteIfExists(partialFile);
            String restoredSha256 = largeObjectStorageService.copyTo(dataset.getHdf5ObjectId(), partialFile);
            // Every restore from PostgreSQL is checked against the checksum recorded at upload time.
            // Cache hits are not re-hashed so that frame requests stay fast.
            if (dataset.getSha256() != null && !dataset.getSha256().equalsIgnoreCase(restoredSha256)) {
                Files.deleteIfExists(partialFile);
                throw new ResponseStatusException(
                        CONFLICT,
                        "Stored HDF5 file failed SHA-256 verification for dataset " + dataset.getId() + "."
                );
            }
            Files.move(partialFile, cachedFile, StandardCopyOption.REPLACE_EXISTING);
            return cachedFile;
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to prepare the cached HDF5 source file.", exception);
        }
    }

    public synchronized void evict(Long datasetId) {
        try {
            Files.deleteIfExists(cacheDirectory.resolve("dataset-" + datasetId + ".hdf5"));
            Files.deleteIfExists(cacheDirectory.resolve("dataset-" + datasetId + ".part"));
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to remove cached HDF5 file for dataset " + datasetId + ".", exception);
        }
    }

    private boolean isComplete(Path file, Long expectedSize) throws IOException {
        if (!Files.isRegularFile(file)) {
            return false;
        }
        return expectedSize == null || expectedSize <= 0 || Files.size(file) == expectedSize;
    }
}
