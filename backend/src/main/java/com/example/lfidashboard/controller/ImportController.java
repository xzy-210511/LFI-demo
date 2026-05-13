package com.example.lfidashboard.controller;

import com.example.lfidashboard.model.ImportResult;
import com.example.lfidashboard.service.Hdf5ImportService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/datasets")
public class ImportController {

    private final Hdf5ImportService importService;

    public ImportController(Hdf5ImportService importService) {
        this.importService = importService;
    }

    @PostMapping("/import")
    public ImportResult importDataset(@RequestParam("file") MultipartFile file) {
        return importService.importFile(file);
    }
}
