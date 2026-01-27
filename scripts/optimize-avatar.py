#!/usr/bin/env python3
"""
Optimize avatar image for web:
- Resize to 400px (2x for 200px display, covers Retina)
- Convert to WebP format with quality optimization
- Keep original as fallback
"""

from PIL import Image
import os

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
INPUT_PATH = os.path.join(PROJECT_ROOT, "public/images/profile.jpeg")
OUTPUT_WEBP = os.path.join(PROJECT_ROOT, "public/images/profile.webp")
OUTPUT_JPEG = os.path.join(PROJECT_ROOT, "public/images/profile-optimized.jpg")

# Target size (2x for 200px display on Retina)
TARGET_SIZE = 400


def optimize_avatar():
    print(f"📷 Loading: {INPUT_PATH}")

    with Image.open(INPUT_PATH) as img:
        original_size = os.path.getsize(INPUT_PATH)
        print(
            f"   Original: {img.size[0]}x{img.size[1]}, {original_size / 1024:.1f} KiB"
        )

        # Resize maintaining aspect ratio (crop to square first if needed)
        width, height = img.size

        # Crop to square (center crop)
        if width != height:
            size = min(width, height)
            left = (width - size) // 2
            top = (height - size) // 2
            img = img.crop((left, top, left + size, top + size))
            print(f"   Cropped to square: {size}x{size}")

        # Resize to target
        img = img.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)
        print(f"   Resized to: {TARGET_SIZE}x{TARGET_SIZE}")

        # Convert to RGB if necessary (for JPEG/WebP)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Save as WebP (best compression)
        img.save(OUTPUT_WEBP, "WEBP", quality=85, method=6)
        webp_size = os.path.getsize(OUTPUT_WEBP)
        print(f"✅ WebP saved: {OUTPUT_WEBP}")
        print(
            f"   Size: {webp_size / 1024:.1f} KiB ({100 - webp_size / original_size * 100:.1f}% smaller)"
        )

        # Save optimized JPEG as fallback
        img.save(OUTPUT_JPEG, "JPEG", quality=85, optimize=True)
        jpeg_size = os.path.getsize(OUTPUT_JPEG)
        print(f"✅ JPEG saved: {OUTPUT_JPEG}")
        print(
            f"   Size: {jpeg_size / 1024:.1f} KiB ({100 - jpeg_size / original_size * 100:.1f}% smaller)"
        )


if __name__ == "__main__":
    optimize_avatar()
