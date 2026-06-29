import pathlib
import re
import unittest
from urllib.parse import unquote


ROOT = pathlib.Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
MARKDOWN_LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


class DocumentationTests(unittest.TestCase):
    def markdown_files(self):
        return [ROOT / "README.md", *sorted(DOCS.glob("*.md"))]

    def test_handbook_contains_all_numbered_chapters(self):
        index = (DOCS / "README.md").read_text(encoding="utf-8")
        for chapter in range(1, 11):
            prefix = f"{chapter:02d}-"
            matches = list(DOCS.glob(f"{prefix}*.md"))
            self.assertEqual(len(matches), 1, f"Expected one chapter beginning with {prefix}")
            self.assertIn(matches[0].name, index)

    def test_relative_markdown_links_resolve(self):
        broken = []
        for source in self.markdown_files():
            content = source.read_text(encoding="utf-8")
            for raw_target in MARKDOWN_LINK.findall(content):
                target = raw_target.split("#", 1)[0]
                if not target or target.startswith(("http://", "https://", "mailto:")):
                    continue
                resolved = (source.parent / unquote(target)).resolve()
                if not resolved.exists():
                    broken.append(f"{source.relative_to(ROOT)} -> {target}")
        self.assertEqual(broken, [], "Broken Markdown links:\n" + "\n".join(broken))

    def test_code_fences_are_balanced(self):
        for source in self.markdown_files():
            content = source.read_text(encoding="utf-8")
            self.assertEqual(
                content.count("```") % 2,
                0,
                f"Unbalanced code fence in {source.relative_to(ROOT)}",
            )


if __name__ == "__main__":
    unittest.main()
