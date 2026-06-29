from pathlib import Path
from random import Random

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public"
W, H = 1800, 1000


def texture(image: Image.Image, seed: int) -> Image.Image:
    rng = Random(seed)
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for _ in range(4200):
        x, y = rng.randrange(W), rng.randrange(H)
        shade = rng.choice([(255, 255, 255, 9), (10, 20, 18, 8)])
        draw.ellipse((x, y, x + rng.randrange(1, 5), y + rng.randrange(1, 5)), fill=shade)
    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def kyoto() -> Image.Image:
    image = Image.new("RGB", (W, H), "#a6c4b4")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, W, 430), fill="#a7c5bc")
    draw.polygon([(0, 500), (340, 260), (680, 500)], fill="#50746a")
    draw.polygon([(380, 500), (860, 200), (1330, 500)], fill="#385e58")
    draw.polygon([(1050, 500), (1470, 280), (W, 500)], fill="#53796b")
    draw.rectangle((0, 480, W, H), fill="#203e38")
    for index, x in enumerate(range(110, 1760, 210)):
        height = 610 - (index % 2) * 45
        draw.rectangle((x, 250, x + 42, height), fill="#c84932")
        draw.rectangle((x + 125, 250, x + 167, height), fill="#c84932")
        draw.rectangle((x - 22, 230, x + 190, 275), fill="#df5a3d")
        draw.rectangle((x - 2, 220, x + 170, 236), fill="#2a2c28")
    draw.polygon([(410, H), (760, 505), (1030, 505), (1390, H)], fill="#bd8661")
    draw.polygon([(560, H), (810, 540), (980, 540), (1240, H)], fill="#e1b47b")
    for x in range(0, W, 120):
        draw.ellipse((x, 410 + (x % 180), x + 180, 650 + (x % 120)), fill="#2f5c4d")
    return texture(image, 11)


def lisbon() -> Image.Image:
    image = Image.new("RGB", (W, H), "#b9d6df")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, W, 430), fill="#a9cedc")
    draw.ellipse((1360, 85, 1510, 235), fill="#f3bd51")
    draw.rectangle((0, 760, W, H), fill="#3f8795")
    colors = ["#efb147", "#d95f50", "#f0d49a", "#5a8ca5", "#d78658", "#f3eee1"]
    rng = Random(19)
    for row in range(5):
        y = 330 + row * 92
        for col in range(12):
            x = 40 + col * 150 + (row % 2) * 45
            width = rng.randrange(100, 155)
            height = rng.randrange(90, 165)
            color = colors[(row + col) % len(colors)]
            draw.rectangle((x, y - height, x + width, y), fill=color)
            draw.polygon([(x - 6, y - height), (x + width / 2, y - height - 42), (x + width + 6, y - height)], fill="#9f433e")
            for wx in range(x + 18, x + width - 10, 42):
                draw.rectangle((wx, y - height + 28, wx + 17, y - height + 54), fill="#234d59")
    draw.polygon([(0, 660), (650, 600), (1120, 700), (W, 610), (W, 780), (0, 780)], fill="#e6d8bc")
    draw.rounded_rectangle((690, 545, 1100, 715), radius=28, fill="#eacb59", outline="#2d4b4c", width=9)
    draw.rectangle((735, 505, 1055, 565), fill="#eacb59", outline="#2d4b4c", width=8)
    for x in (790, 915, 1040):
        draw.ellipse((x - 25, 690, x + 25, 740), fill="#263c3c")
    for x in (750, 840, 930, 1020):
        draw.rectangle((x, 585, x + 52, 650), fill="#426d73")
    return texture(image, 23)


def cappadocia() -> Image.Image:
    image = Image.new("RGB", (W, H), "#9bc1cc")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, W, 620), fill="#9cc4cf")
    draw.ellipse((180, 105, 340, 265), fill="#f1ba57")
    draw.rectangle((0, 600, W, H), fill="#c89165")
    rng = Random(31)
    for index in range(42):
        x = index * 48 + rng.randrange(-20, 20)
        top = rng.randrange(490, 740)
        width = rng.randrange(42, 88)
        draw.polygon([(x, H), (x + width // 2, top), (x + width, H)], fill=rng.choice(["#b97851", "#cf9367", "#9e6b50", "#dba676"]))
        draw.ellipse((x + width // 2 - 9, top - 4, x + width // 2 + 9, top + 15), fill="#765044")
    balloon_colors = ["#d84e3e", "#e8b53f", "#3b7b88", "#7d5b93", "#e2783d"]
    for index, (x, y, scale) in enumerate([(470, 210, 1.2), (1050, 155, .9), (1390, 310, .72), (760, 360, .55), (225, 380, .48)]):
        w, h = int(135 * scale), int(170 * scale)
        color = balloon_colors[index]
        draw.ellipse((x - w // 2, y - h // 2, x + w // 2, y + h // 2), fill=color, outline="#f7e2b3", width=max(2, int(5 * scale)))
        draw.line((x, y - h // 2, x, y + h // 2), fill="#f7e2b3", width=max(2, int(6 * scale)))
        draw.line((x - w // 3, y - h // 3, x + w // 3, y + h // 3), fill="#f7e2b3", width=max(2, int(4 * scale)))
        draw.rectangle((x - int(18 * scale), y + h // 2 + 8, x + int(18 * scale), y + h // 2 + int(35 * scale)), fill="#5a3e34")
    return texture(image, 37)


def save(name: str, image: Image.Image) -> None:
    image.filter(ImageFilter.GaussianBlur(radius=0.25)).save(OUT / name, "JPEG", quality=88, optimize=True)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    save("kyoto.jpg", kyoto())
    save("lisbon.jpg", lisbon())
    save("cappadocia.jpg", cappadocia())
    save("travelers.jpg", lisbon().resize((1200, 900)))
