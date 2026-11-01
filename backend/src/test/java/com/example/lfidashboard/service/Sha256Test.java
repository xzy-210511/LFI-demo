package com.example.lfidashboard.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class Sha256Test {

    @TempDir
    Path temporaryDirectory;

    @Test
    void matchesPublishedTestVectors() throws Exception {
        // FIPS 180-2 test vectors
        assertThat(Sha256.of(new ByteArrayInputStream("abc".getBytes(StandardCharsets.US_ASCII))))
                .isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        assertThat(Sha256.of(new ByteArrayInputStream(new byte[0])))
                .isEqualTo("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    }

    @Test
    void fileAndStreamDigestsAgreeAcrossBufferBoundaries() throws Exception {
        byte[] content = new byte[3 * 1024 * 1024 + 17];
        for (int index = 0; index < content.length; index++) {
            content[index] = (byte) (index * 31);
        }
        Path file = temporaryDirectory.resolve("source.hdf5");
        Files.write(file, content);

        assertThat(Sha256.of(file)).isEqualTo(Sha256.of(new ByteArrayInputStream(content)));
    }
}
