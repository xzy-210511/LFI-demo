import json
import re
import sys

import h5py
import numpy as np
from PIL import Image


def natural_key(name):
    # "2" sorts before "10", so unpadded frame names keep their numeric order.
    return [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", name)]


def frame_name(group, frame_index):
    names = sorted(group.keys(), key=natural_key)
    if frame_index < 0 or frame_index >= len(names):
        raise ValueError(f"Frame index is out of range: {frame_index}")
    return names[frame_index]


def read_frame(hdf5_file, group_name, frame_index):
    if group_name not in hdf5_file:
        raise ValueError(f"The HDF5 file does not contain an {group_name} group.")

    group = hdf5_file[group_name]
    name = frame_name(group, frame_index)
    data = np.asarray(group[name][()], dtype=np.float64)
    if data.ndim != 2:
        raise ValueError(f"{group_name}/{name} must be a two-dimensional matrix.")
    return data, name


def finite_values(data):
    return data[np.isfinite(data)]


def statistics(data):
    finite = finite_values(data)
    if not finite.size:
        return {
            "minimum": 0.0,
            "maximum": 0.0,
            "mean": 0.0,
            "standardDeviation": 0.0,
            "finiteCount": 0,
        }

    return {
        "minimum": float(finite.min()),
        "maximum": float(finite.max()),
        "mean": float(finite.mean()),
        "standardDeviation": float(finite.std()),
        "finiteCount": int(finite.size),
    }


def normalized_percentile(data):
    finite = finite_values(data)
    if not finite.size:
        return np.zeros(data.shape, dtype=np.float64)

    low, high = np.percentile(finite, [1.0, 99.0])
    if high <= low:
        low = float(finite.min())
        high = float(finite.max())
    if high <= low:
        return np.zeros(data.shape, dtype=np.float64)

    clean = np.nan_to_num(data, nan=low, posinf=high, neginf=low)
    return np.clip((clean - low) / (high - low), 0.0, 1.0)


def normalized_phase(data):
    finite = finite_values(data)
    if not finite.size:
        return np.zeros(data.shape, dtype=np.float64)

    minimum = float(finite.min())
    maximum = float(finite.max())
    if minimum >= -np.pi * 1.05 and maximum <= np.pi * 1.05:
        low, high = -np.pi, np.pi
    elif minimum >= -189.0 and maximum <= 189.0:
        low, high = -180.0, 180.0
    else:
        return normalized_percentile(data)

    clean = np.nan_to_num(data, nan=0.0, posinf=high, neginf=low)
    return np.clip((clean - low) / (high - low), 0.0, 1.0)


def histogram(data, bin_count):
    finite = finite_values(data)
    if not finite.size:
        return []

    minimum = float(finite.min())
    maximum = float(finite.max())
    if maximum <= minimum:
        minimum -= 0.5
        maximum += 0.5

    counts, edges = np.histogram(finite, bins=bin_count, range=(minimum, maximum))
    return [
        {
            "start": float(edges[index]),
            "end": float(edges[index + 1]),
            "count": int(counts[index]),
        }
        for index in range(len(counts))
    ]


def summarize(file_path):
    with h5py.File(file_path, "r") as hdf5_file:
        amplitude, amplitude_name = read_frame(hdf5_file, "amplitude", 0)
        phase, phase_name = read_frame(hdf5_file, "phase", 0)
        if amplitude.shape != phase.shape:
            raise ValueError("Amplitude and phase frames must have matching dimensions.")

        phase_dataset = hdf5_file["phase"][phase_name]
        amplitude_stats = statistics(amplitude)
        phase_stats = statistics(phase)

        print(json.dumps({
            "amplitudeFrameCount": len(hdf5_file["amplitude"]),
            "phaseFrameCount": len(hdf5_file["phase"]),
            "frameHeight": int(phase.shape[0]),
            "frameWidth": int(phase.shape[1]),
            "dataType": str(phase_dataset.dtype),
            "compression": phase_dataset.compression or "none",
            "amplitudeMinimum": amplitude_stats["minimum"],
            "amplitudeMaximum": amplitude_stats["maximum"],
            "amplitudeMean": amplitude_stats["mean"],
            "amplitudeStandardDeviation": amplitude_stats["standardDeviation"],
            "phaseMinimum": phase_stats["minimum"],
            "phaseMaximum": phase_stats["maximum"],
            "phaseMean": phase_stats["mean"],
            "phaseStandardDeviation": phase_stats["standardDeviation"],
        }, allow_nan=False))


def rgb_from_hsv(hue, saturation, value):
    hsv = np.stack([hue, saturation, value], axis=-1)
    hsv_bytes = np.asarray(np.clip(hsv, 0.0, 1.0) * 255.0, dtype=np.uint8)
    return np.asarray(Image.fromarray(hsv_bytes, mode="HSV").convert("RGB"))


def generate_image(file_path, output_path, frame_index, image_type):
    with h5py.File(file_path, "r") as hdf5_file:
        if image_type == "amplitude":
            amplitude, _ = read_frame(hdf5_file, "amplitude", frame_index)
            gray = np.asarray(normalized_percentile(amplitude) * 255.0, dtype=np.uint8)
            image = Image.fromarray(gray, mode="L")
        elif image_type == "phase":
            phase, _ = read_frame(hdf5_file, "phase", frame_index)
            hue = normalized_phase(phase)
            image = Image.fromarray(rgb_from_hsv(hue, np.ones_like(hue), np.ones_like(hue)))
        elif image_type == "combined":
            amplitude, _ = read_frame(hdf5_file, "amplitude", frame_index)
            phase, _ = read_frame(hdf5_file, "phase", frame_index)
            if amplitude.shape != phase.shape:
                raise ValueError("Amplitude and phase frames must have matching dimensions.")
            hue = normalized_phase(phase)
            saturation = normalized_percentile(amplitude)
            image = Image.fromarray(rgb_from_hsv(hue, saturation, np.ones_like(hue)))
        else:
            raise ValueError(f"Unknown image type: {image_type}")

        image.save(output_path)


def optional_number(value):
    return float(value) if np.isfinite(value) else None


def analyze(file_path, frame_index, direction, position, bin_count):
    if direction not in ("row", "column"):
        raise ValueError("Direction must be row or column.")
    if bin_count < 5 or bin_count > 100:
        raise ValueError("Histogram bin count must be between 5 and 100.")

    with h5py.File(file_path, "r") as hdf5_file:
        amplitude, amplitude_name = read_frame(hdf5_file, "amplitude", frame_index)
        phase, phase_name = read_frame(hdf5_file, "phase", frame_index)
        if amplitude.shape != phase.shape:
            raise ValueError("Amplitude and phase frames must have matching dimensions.")

        limit = amplitude.shape[0] if direction == "row" else amplitude.shape[1]
        if position < 0 or position >= limit:
            raise ValueError(f"Profile position is out of range: {position}")

        if direction == "row":
            amplitude_profile = amplitude[position, :]
            phase_profile = phase[position, :]
        else:
            amplitude_profile = amplitude[:, position]
            phase_profile = phase[:, position]

        points = [
            {
                "index": index,
                "amplitude": optional_number(amplitude_profile[index]),
                "phase": optional_number(phase_profile[index]),
            }
            for index in range(amplitude_profile.size)
        ]

        print(json.dumps({
            "frameIndex": frame_index,
            "amplitudeFrameName": amplitude_name,
            "phaseFrameName": phase_name,
            "frameHeight": int(amplitude.shape[0]),
            "frameWidth": int(amplitude.shape[1]),
            "direction": direction,
            "position": position,
            "profilePoints": points,
            "amplitudeStatistics": statistics(amplitude),
            "phaseStatistics": statistics(phase),
            "amplitudeHistogram": histogram(amplitude, bin_count),
            "phaseHistogram": histogram(phase, bin_count),
        }, allow_nan=False))


def main():
    if len(sys.argv) < 3:
        raise ValueError("Usage: hdf5_processor.py <summary|image|analysis> <file> [arguments]")

    command = sys.argv[1]
    file_path = sys.argv[2]
    if command == "summary":
        summarize(file_path)
    elif command == "image":
        if len(sys.argv) != 6:
            raise ValueError("Usage: hdf5_processor.py image <file> <output> <frame> <type>")
        generate_image(file_path, sys.argv[3], int(sys.argv[4]), sys.argv[5])
    elif command == "analysis":
        if len(sys.argv) != 7:
            raise ValueError("Usage: hdf5_processor.py analysis <file> <frame> <direction> <position> <bins>")
        analyze(file_path, int(sys.argv[3]), sys.argv[4], int(sys.argv[5]), int(sys.argv[6]))
    elif command == "phase-image":
        if len(sys.argv) != 5:
            raise ValueError("Usage: hdf5_processor.py phase-image <file> <output> <frame>")
        generate_image(file_path, sys.argv[3], int(sys.argv[4]), "phase")
    else:
        raise ValueError(f"Unknown command: {command}")


if __name__ == "__main__":
    main()
