package com.example.lfidashboard.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "metadata_items")
public class MetadataEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dataset_id", nullable = false)
    private DatasetEntity dataset;

    private String metadataKey;
    private String metadataValue;

    protected MetadataEntity() {
    }

    public MetadataEntity(DatasetEntity dataset, String metadataKey, String metadataValue) {
        this.dataset = dataset;
        this.metadataKey = metadataKey;
        this.metadataValue = metadataValue;
    }

    public String getMetadataKey() {
        return metadataKey;
    }

    public String getMetadataValue() {
        return metadataValue;
    }
}
