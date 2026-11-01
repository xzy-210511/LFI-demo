package com.example.lfidashboard.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * SHA-256 helpers used to prove that a stored HDF5 source is byte-for-byte identical to the upload.
 */
public final class Sha256 {

    private static final int BUFFER_SIZE = 1024 * 1024;

    private Sha256() {
    }

    public static MessageDigest newDigest() {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available in this Java runtime.", exception);
        }
    }

    public static String hex(MessageDigest digest) {
        return HexFormat.of().formatHex(digest.digest());
    }

    public static String of(Path file) {
        try (InputStream input = Files.newInputStream(file)) {
            return of(input);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read file for SHA-256 calculation: " + file, exception);
        }
    }

    public static String of(InputStream input) throws IOException {
        MessageDigest digest = newDigest();
        byte[] buffer = new byte[BUFFER_SIZE];
        int bytesRead;
        while ((bytesRead = input.read(buffer)) != -1) {
            digest.update(buffer, 0, bytesRead);
        }
        return hex(digest);
    }
}
