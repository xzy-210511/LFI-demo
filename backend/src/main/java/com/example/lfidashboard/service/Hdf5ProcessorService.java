package com.example.lfidashboard.service;

import com.example.lfidashboard.model.FrameAnalysis;
import com.example.lfidashboard.model.Hdf5Summary;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Service
public class Hdf5ProcessorService {

    private final ObjectMapper objectMapper;
    private final String pythonCommand;
    private final String processorScript;

    public Hdf5ProcessorService(
            ObjectMapper objectMapper,
            @Value("${hdf5.python-command}") String pythonCommand,
            @Value("${hdf5.processor-script}") String processorScript
    ) {
        this.objectMapper = objectMapper;
        this.pythonCommand = pythonCommand;
        this.processorScript = processorScript;
    }

    public Hdf5Summary readSummary(Path inputFile) {
        String output = run(List.of("summary", inputFile.toString()));
        try {
            return objectMapper.readValue(output, Hdf5Summary.class);
        } catch (IOException exception) {
            throw new IllegalStateException("The HDF5 summary could not be read.", exception);
        }
    }

    public byte[] generateImage(Path inputFile, int frameIndex, String imageType) {
        try {
            Path outputFile = Files.createTempFile("lfi-" + imageType + "-", ".png");
            try {
                run(List.of(
                        "image",
                        inputFile.toString(),
                        outputFile.toString(),
                        String.valueOf(frameIndex),
                        imageType
                ));
                return Files.readAllBytes(outputFile);
            } finally {
                Files.deleteIfExists(outputFile);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("The HDF5 image could not be generated.", exception);
        }
    }

    public FrameAnalysis analyzeFrame(
            Path inputFile,
            int frameIndex,
            String direction,
            int position,
            int histogramBins
    ) {
        String output = run(List.of(
                "analysis",
                inputFile.toString(),
                String.valueOf(frameIndex),
                direction,
                String.valueOf(position),
                String.valueOf(histogramBins)
        ));
        try {
            return objectMapper.readValue(output, FrameAnalysis.class);
        } catch (IOException exception) {
            throw new IllegalStateException("The HDF5 frame analysis could not be read.", exception);
        }
    }

    private String run(List<String> arguments) {
        List<String> command = new ArrayList<>();
        command.add(pythonCommand);
        command.add(processorScript);
        command.addAll(arguments);

        try {
            Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
            String output = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new IllegalStateException("HDF5 processor failed: " + output);
            }

            return output.trim();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to start the HDF5 processor. Check Python and h5py installation.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("HDF5 processing was interrupted.", exception);
        }
    }
}
