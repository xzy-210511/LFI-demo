import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

import h5py
import numpy as np
from PIL import Image

import hdf5_processor


class Hdf5ProcessorTest(unittest.TestCase):

    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.source_file = Path(self.temporary_directory.name) / "fixture.hdf5"
        self.amplitude = np.arange(12, dtype=np.float64).reshape(4, 3)
        self.phase = np.linspace(-180.0, 180.0, 12, dtype=np.float64).reshape(4, 3)

        with h5py.File(self.source_file, "w") as hdf5_file:
            amplitude_group = hdf5_file.create_group("amplitude")
            phase_group = hdf5_file.create_group("phase")
            amplitude_group.create_dataset("0000", data=self.amplitude, compression="gzip")
            phase_group.create_dataset("0000", data=self.phase, compression="gzip")
            amplitude_group.create_dataset("0001", data=self.amplitude + 1.0, compression="gzip")
            phase_group.create_dataset("0001", data=self.phase + 1.0, compression="gzip")

    def tearDown(self):
        self.temporary_directory.cleanup()

    def capture_json(self, function, *arguments):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            function(*arguments)
        return json.loads(output.getvalue())

    def test_summary_reports_source_dimensions_and_counts(self):
        summary = self.capture_json(hdf5_processor.summarize, self.source_file)

        self.assertEqual(summary["amplitudeFrameCount"], 2)
        self.assertEqual(summary["phaseFrameCount"], 2)
        self.assertEqual(summary["frameHeight"], 4)
        self.assertEqual(summary["frameWidth"], 3)
        self.assertEqual(summary["dataType"], "float64")
        self.assertEqual(summary["compression"], "gzip")

    def test_all_visualisations_keep_the_matrix_dimensions(self):
        for image_type in ("amplitude", "phase", "combined"):
            output_file = Path(self.temporary_directory.name) / f"{image_type}.png"
            hdf5_processor.generate_image(self.source_file, output_file, 0, image_type)

            with Image.open(output_file) as image:
                self.assertEqual(image.size, (3, 4))

    def test_analysis_uses_exact_source_profile_values(self):
        analysis = self.capture_json(
            hdf5_processor.analyze,
            self.source_file,
            0,
            "row",
            2,
            6,
        )

        amplitude_profile = [point["amplitude"] for point in analysis["profilePoints"]]
        phase_profile = [point["phase"] for point in analysis["profilePoints"]]
        np.testing.assert_allclose(amplitude_profile, self.amplitude[2, :])
        np.testing.assert_allclose(phase_profile, self.phase[2, :])
        self.assertEqual(analysis["amplitudeStatistics"]["finiteCount"], 12)
        self.assertEqual(sum(item["count"] for item in analysis["amplitudeHistogram"]), 12)
        self.assertEqual(sum(item["count"] for item in analysis["phaseHistogram"]), 12)

    def test_unpadded_frame_names_keep_numeric_order(self):
        unpadded_file = Path(self.temporary_directory.name) / "unpadded.hdf5"
        with h5py.File(unpadded_file, "w") as hdf5_file:
            for group_name in ("amplitude", "phase"):
                group = hdf5_file.create_group(group_name)
                for index in range(12):
                    group.create_dataset(str(index), data=np.full((2, 2), float(index)))

        analysis = self.capture_json(hdf5_processor.analyze, unpadded_file, 2, "row", 0, 5)

        self.assertEqual(analysis["amplitudeFrameName"], "2")
        self.assertEqual(analysis["amplitudeStatistics"]["mean"], 2.0)


if __name__ == "__main__":
    unittest.main()
