package com.example.lfidashboard.entity;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "datasets")
public class DatasetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String sourceFile;

    private LocalDate experimentDate;
    private String target;
    private String status;
    private LocalDateTime importedAt;
    private String description;
    private Long hdf5ObjectId;
    private Long fileSize;
    private Integer amplitudeFrameCount;
    private Integer phaseFrameCount;
    private Integer frameHeight;
    private Integer frameWidth;

    @Column(name = "sha256", length = 64)
    private String sha256;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "phase_preview", columnDefinition = "bytea")
    private byte[] phasePreview;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "amplitude_preview", columnDefinition = "bytea")
    private byte[] amplitudePreview;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "combined_preview", columnDefinition = "bytea")
    private byte[] combinedPreview;

    protected DatasetEntity() {
    }

    public DatasetEntity(
            String name,
            String sourceFile,
            LocalDate experimentDate,
            String target,
            String status,
            LocalDateTime importedAt,
            String description
    ) {
        this.name = name;
        this.sourceFile = sourceFile;
        this.experimentDate = experimentDate;
        this.target = target;
        this.status = status;
        this.importedAt = importedAt;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSourceFile() {
        return sourceFile;
    }

    public LocalDate getExperimentDate() {
        return experimentDate;
    }

    public String getTarget() {
        return target;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getImportedAt() {
        return importedAt;
    }

    public String getDescription() {
        return description;
    }

    public Long getHdf5ObjectId() {
        return hdf5ObjectId;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public Integer getAmplitudeFrameCount() {
        return amplitudeFrameCount;
    }

    public Integer getPhaseFrameCount() {
        return phaseFrameCount;
    }

    public Integer getFrameHeight() {
        return frameHeight;
    }

    public Integer getFrameWidth() {
        return frameWidth;
    }

    public String getSha256() {
        return sha256;
    }

    public byte[] getPhasePreview() {
        return phasePreview;
    }

    public byte[] getAmplitudePreview() {
        return amplitudePreview;
    }

    public byte[] getCombinedPreview() {
        return combinedPreview;
    }

    public void setHdf5ObjectId(Long hdf5ObjectId) {
        this.hdf5ObjectId = hdf5ObjectId;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public void setAmplitudeFrameCount(Integer amplitudeFrameCount) {
        this.amplitudeFrameCount = amplitudeFrameCount;
    }

    public void setPhaseFrameCount(Integer phaseFrameCount) {
        this.phaseFrameCount = phaseFrameCount;
    }

    public void setFrameHeight(Integer frameHeight) {
        this.frameHeight = frameHeight;
    }

    public void setFrameWidth(Integer frameWidth) {
        this.frameWidth = frameWidth;
    }

    public void setSha256(String sha256) {
        this.sha256 = sha256;
    }

    public void setPhasePreview(byte[] phasePreview) {
        this.phasePreview = phasePreview;
    }

    public void setAmplitudePreview(byte[] amplitudePreview) {
        this.amplitudePreview = amplitudePreview;
    }

    public void setCombinedPreview(byte[] combinedPreview) {
        this.combinedPreview = combinedPreview;
    }
}
