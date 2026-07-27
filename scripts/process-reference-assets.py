"""Create privacy-safe, web-ready V3.3 assets from user-supplied originals."""

from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = (
    ROOT
    / "PORTFOLIO_V3_3_FINAL_PACKAGE"
    / "PORTFOLIO_V3_3_FINAL_PACKAGE"
    / "reference-assets"
)


def save_webp(image: Image.Image, target: Path, quality: int = 84) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(
        target,
        "WEBP",
        quality=quality,
        method=6,
        exif=b"",
        xmp=b"",
        icc_profile=b"",
    )


def fitted_crop(image: Image.Image, size: tuple[int, int], centering=(0.5, 0.5)):
    return ImageOps.fit(
        image,
        size,
        method=Image.Resampling.LANCZOS,
        centering=centering,
    )


def process_landscapes() -> None:
    queenstown = Image.open(SOURCE / "04-queenstown-home-background.jpg")
    desktop = fitted_crop(queenstown, (1920, 1080), centering=(0.5, 0.39))
    mobile = fitted_crop(queenstown, (1080, 1600), centering=(0.16, 0.44))
    save_webp(desktop, ROOT / "public/backgrounds/home-hero-desktop.webp")
    save_webp(mobile, ROOT / "public/backgrounds/home-hero-mobile.webp")

    mount_cook = Image.open(SOURCE / "02-mount-cook-about-background.jpg")
    about = fitted_crop(mount_cook, (1600, 800), centering=(0.5, 0.51))
    save_webp(about, ROOT / "public/backgrounds/about-hero.webp")

    wanaka = Image.open(SOURCE / "03-wanaka-tree-alternate.jpg")
    alternate = fitted_crop(wanaka, (1440, 960), centering=(0.5, 0.5))
    save_webp(alternate, ROOT / "public/backgrounds/wanaka-alternate.webp")


def process_portrait() -> None:
    source = Image.open(SOURCE / "01-portrait-graduation-fullbody.jpg").convert("RGB")
    subject_crop = source.crop((360, 710, 1160, 2047))

    canvas_size = (1200, 1200)
    background = fitted_crop(source, canvas_size, centering=(0.5, 0.58))
    background = background.filter(ImageFilter.GaussianBlur(34))
    neutral = Image.new("RGB", canvas_size, "#d7d2c6")
    background = Image.blend(background, neutral, 0.48)

    foreground = ImageOps.contain(
        subject_crop,
        (880, 1110),
        method=Image.Resampling.LANCZOS,
    )
    x = (canvas_size[0] - foreground.width) // 2
    y = canvas_size[1] - foreground.height - 24
    background.paste(foreground, (x, y))
    save_webp(background, ROOT / "public/profile/portrait.webp", quality=88)


if __name__ == "__main__":
    process_landscapes()
    process_portrait()
