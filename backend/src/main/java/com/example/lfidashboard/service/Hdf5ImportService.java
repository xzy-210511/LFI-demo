package com.example.lfidashboard.service;

import com.example.lfidashboard.model.ImportResult;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class Hdf5ImportService {

    public ImportResult importFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Please select a non-empty .h5 or .hdf5 file.");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Uploaded file must have a filename.");
        }

        String lowerCaseName = originalFileName.toLowerCase();
        boolean isHdf5File = lowerCaseName.endsWith(".h5") || lowerCaseName.endsWith(".hdf5");
        if (!isHdf5File) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid file type. Please upload a .h5 or .hdf5 file.");
        }

        return new ImportResult(
                3L,
                originalFileName,
                "IMPORTED",
                "File uploaded successfully. Real HDF5 parsing will be added in a later stage."
        );
    }
}
