package com.example.lfidashboard.service;

import com.example.lfidashboard.repository.DatasetRepository;
import com.example.lfidashboard.repository.MetadataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class Hdf5ImportServiceTest {

    private Hdf5ProcessorService processor;
    private LargeObjectStorageService storage;
    private Hdf5ImportService service;

    @BeforeEach
    void setUp() {
        processor = mock(Hdf5ProcessorService.class);
        storage = mock(LargeObjectStorageService.class);
        service = new Hdf5ImportService(
                mock(DatasetRepository.class), mock(MetadataRepository.class), storage, processor);
    }

    @Test
    void rejectsFilesWithoutHdf5Extension() {
        MockMultipartFile readme = new MockMultipartFile("file", "README.md", "text/markdown", "# notes".getBytes());

        assertThatThrownBy(() -> service.importFile(readme))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid file type");
        verifyNoInteractions(processor, storage);
    }

    @Test
    void rejectsEmptyHdf5Files() {
        MockMultipartFile empty = new MockMultipartFile("file", "empty.h5", "application/octet-stream", new byte[0]);

        assertThatThrownBy(() -> service.importFile(empty))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("non-empty");
        verifyNoInteractions(processor, storage);
    }
}
