package com.example.lfidashboard.repository;

import com.example.lfidashboard.entity.DatasetEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DatasetRepository extends JpaRepository<DatasetEntity, Long> {
}
