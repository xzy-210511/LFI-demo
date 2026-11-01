package com.example.lfidashboard.service;

import com.example.lfidashboard.entity.DatasetEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class Hdf5VisualisationServiceTest {

    private static final Path SOURCE = Path.of("dataset-4.hdf5");

    private DatasetService datasetService;
    private Hdf5FileCacheService cache;
    private Hdf5ProcessorService processor;
    private Hdf5VisualisationService service;

    @BeforeEach
    void setUp() {
        datasetService = mock(DatasetService.class);
        cache = mock(Hdf5FileCacheService.class);
        processor = mock(Hdf5ProcessorService.class);
        service = new Hdf5VisualisationService(datasetService, cache, processor);

        DatasetEntity p1 = new DatasetEntity(
                "p1", "p1.hdf5", LocalDate.now(), "Mushroom", "IMPORTED", LocalDateTime.now(), "test");
        ReflectionTestUtils.setField(p1, "id", 4L);
        p1.setHdf5ObjectId(10L);
        p1.setAmplitudeFrameCount(554);
        p1.setPhaseFrameCount(554);
        p1.setFrameHeight(1300);
        p1.setFrameWidth(400);
        p1.setAmplitudePreview(new byte[] {1, 2, 3});
        when(datasetService.findDataset(4L)).thenReturn(p1);
        when(cache.getSourceFile(any())).thenReturn(SOURCE);
    }

    @Test
    void frameOutsideStoredRangeIsRejectedBeforeCallingPython() {
        assertThatThrownBy(() -> service.getImage(4L, 554, "amplitude"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("between 0 and 553");
        verifyNoInteractions(processor);
    }

    @Test
    void unknownProfileDirectionIsRejected() {
        assertThatThrownBy(() -> service.analyzeFrame(4L, 0, "diagonal", 0))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("row or column");
    }

    @Test
    void columnPositionIsBoundedByFrameWidthNotHeight() {
        assertThatThrownBy(() -> service.analyzeFrame(4L, 0, "column", 400))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("between 0 and 399");
        verify(processor, never()).analyzeFrame(any(), anyInt(), anyString(), anyInt(), anyInt());
    }

    @Test
    void missingPositionDefaultsToTheMiddleRow() {
        service.analyzeFrame(4L, 3, "row", null);

        verify(processor).analyzeFrame(SOURCE, 3, "row", 650, 32);
    }

    @Test
    void frameZeroImageIsServedFromStoredPreview() {
        assertThat(service.getImage(4L, 0, "amplitude")).containsExactly(1, 2, 3);
        verifyNoInteractions(cache, processor);
    }
}
