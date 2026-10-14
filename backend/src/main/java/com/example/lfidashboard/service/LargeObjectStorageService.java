package com.example.lfidashboard.service;

import org.postgresql.PGConnection;
import org.postgresql.largeobject.LargeObject;
import org.postgresql.largeobject.LargeObjectManager;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class LargeObjectStorageService {

    private final JdbcTemplate jdbcTemplate;

    public LargeObjectStorageService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long store(Path file) {
        Long objectId = jdbcTemplate.execute((ConnectionCallback<Long>) connection -> {
            PGConnection pgConnection = connection.unwrap(PGConnection.class);
            LargeObjectManager manager = pgConnection.getLargeObjectAPI();
            long createdObjectId = manager.createLO(LargeObjectManager.READ | LargeObjectManager.WRITE);

            try (InputStream input = Files.newInputStream(file)) {
                LargeObject largeObject = manager.open(createdObjectId, LargeObjectManager.WRITE);
                try {
                    byte[] buffer = new byte[1024 * 1024];
                    int bytesRead;
                    while ((bytesRead = input.read(buffer)) != -1) {
                        largeObject.write(buffer, 0, bytesRead);
                    }
                } finally {
                    largeObject.close();
                }
            } catch (IOException exception) {
                throw new IllegalStateException("Unable to store HDF5 file in PostgreSQL.", exception);
            }

            return createdObjectId;
        });

        if (objectId == null) {
            throw new IllegalStateException("PostgreSQL did not return a Large Object identifier.");
        }
        return objectId;
    }

    public void copyTo(long objectId, Path destination) {
        jdbcTemplate.execute((ConnectionCallback<Void>) connection -> {
            PGConnection pgConnection = connection.unwrap(PGConnection.class);
            LargeObjectManager manager = pgConnection.getLargeObjectAPI();
            LargeObject largeObject = manager.open(objectId, LargeObjectManager.READ);

            try (OutputStream output = Files.newOutputStream(destination)) {
                byte[] buffer = new byte[1024 * 1024];
                int bytesRead;
                while ((bytesRead = largeObject.read(buffer, 0, buffer.length)) > 0) {
                    output.write(buffer, 0, bytesRead);
                }
            } catch (IOException exception) {
                throw new IllegalStateException("Unable to read HDF5 file from PostgreSQL.", exception);
            } finally {
                largeObject.close();
            }

            return null;
        });
    }
}
