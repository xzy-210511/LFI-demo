package com.example.lfidashboard.config;

import com.example.lfidashboard.entity.DatasetEntity;
import com.example.lfidashboard.entity.MetadataEntity;
import com.example.lfidashboard.repository.DatasetRepository;
import com.example.lfidashboard.repository.MetadataRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(DatasetRepository datasetRepository, MetadataRepository metadataRepository) {
        return args -> {
            if (datasetRepository.count() > 0) {
                return;
            }

            DatasetEntity first = datasetRepository.save(new DatasetEntity(
                    "Mushroom LFI Sample 01",
                    "mushroom_sample_01.h5",
                    LocalDate.of(2026, 4, 20),
                    "Mushroom",
                    "IMPORTED",
                    LocalDateTime.of(2026, 5, 12, 10, 30),
                    "Seed dataset for the dashboard prototype."
            ));
            DatasetEntity second = datasetRepository.save(new DatasetEntity(
                    "Mushroom LFI Sample 02",
                    "mushroom_sample_02.h5",
                    LocalDate.of(2026, 4, 22),
                    "Mushroom",
                    "PROCESSED",
                    LocalDateTime.of(2026, 5, 12, 11, 0),
                    "Seed dataset for the dashboard prototype."
            ));

            metadataRepository.saveAll(List.of(
                    new MetadataEntity(first, "experiment_name", "Mushroom LFI Test 01"),
                    new MetadataEntity(first, "sample_type", "Mushroom"),
                    new MetadataEntity(first, "scan_width", "100"),
                    new MetadataEntity(first, "scan_height", "100"),
                    new MetadataEntity(first, "sampling_rate", "1000 Hz"),
                    new MetadataEntity(first, "laser_type", "LFI / self-mixing setup"),
                    new MetadataEntity(first, "operator", "Xiaoyang Zhang"),
                    new MetadataEntity(second, "experiment_name", "Mushroom LFI Test 02"),
                    new MetadataEntity(second, "sample_type", "Mushroom"),
                    new MetadataEntity(second, "scan_width", "100"),
                    new MetadataEntity(second, "scan_height", "100"),
                    new MetadataEntity(second, "sampling_rate", "1000 Hz"),
                    new MetadataEntity(second, "laser_type", "LFI / self-mixing setup"),
                    new MetadataEntity(second, "operator", "Xiaoyang Zhang")
            ));
        };
    }
}
