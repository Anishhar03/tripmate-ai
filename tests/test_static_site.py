import json
import pathlib
import re
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class StaticSiteTests(unittest.TestCase):
    def test_entrypoint_references_existing_assets(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("./app.js", html)
        self.assertIn("./src/styles.css", html)
        self.assertTrue((ROOT / "app.js").is_file())
        self.assertTrue((ROOT / "src" / "styles.css").is_file())

    def test_manifest_is_valid_and_scoped_for_pages(self):
        manifest = json.loads((ROOT / "public" / "manifest.webmanifest").read_text(encoding="utf-8"))
        self.assertEqual(manifest["start_url"], "../")
        self.assertEqual(manifest["display"], "standalone")

    def test_core_workflows_are_present(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        for workflow in ("submitTrip", "exportTrip", "bookmark", "addActivity", "sendChat"):
            self.assertIn(workflow, script)

    def test_no_obvious_embedded_secrets(self):
        script = (ROOT / "app.js").read_text(encoding="utf-8")
        secret_patterns = [r"ghp_[A-Za-z0-9]+", r"github_pat_[A-Za-z0-9_]+", r"gsk_[A-Za-z0-9]+"]
        for pattern in secret_patterns:
            self.assertIsNone(re.search(pattern, script))


if __name__ == "__main__":
    unittest.main()
