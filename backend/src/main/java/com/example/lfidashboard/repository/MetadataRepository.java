package com.example.lfidashboard.repository;

import com.example.lfidashboard.entity.MetadataEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MetadataRepository extends JpaRepository<MetadataEntity, Long> {

    List<MetadataEntity> findByDatasetIdOrderById(Long datasetId);

    void deleteByDatasetId(Long datasetId);
}
