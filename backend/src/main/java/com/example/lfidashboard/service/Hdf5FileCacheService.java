package com.example.lfidashboard.service;

import com.example.lfidashboard.entity.DatasetEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

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
            largeObjectStorageService.copyTo(dataset.getHdf5ObjectId(), partialFile);
            Files.move(partialFile, cachedFile, StandardCopyOption.REPLACE_EXISTING);
            return cachedFile;
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to prepare the cached HDF5 source file.", exception);
        }
    }

    private boolean isComplete(Path file, Long expectedSize) throws IOException {
        if (!Files.isRegularFile(file)) {
            return false;
        }
        return expectedSize == null || expectedSize <= 0 || Files.size(file) == expectedSize;
    }
}
