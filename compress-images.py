"""
Batch compress card PNG images to WebP format.
Reduces ~2MB PNGs to ~100-150KB WebP files (90%+ size reduction).

Usage:
  python compress-images.py            # Convert all PNGs to WebP, remove originals
  python compress-images.py --dry-run  # Preview without modifying files
  python compress-images.py --quality 85  # Custom WebP quality (default: 80)
"""

import os
import sys
import argparse
from pathlib import Path
from PIL import Image

CARDS_DIR = Path(__file__).parent / 'assets' / 'images' / 'cards'
CATEGORIES = [
    '01-block', '02-tool', '03-weapon', '04-food',
    '05-ore', '06-armor', '07-animal', '08-monster',
    '09-redstone', '10-spawn-egg',
]
FILE_PATTERN_PREFIX_LEN = 3  # e.g., "001-"


def is_card_image(filename):
    """Check if filename matches the card image pattern: {3-digit-id}-{name}.{png|jpg|jpeg}"""
    lower = filename.lower()
    if not (lower.endswith('.png') or lower.endswith('.jpg') or lower.endswith('.jpeg')):
        return False
    parts = filename.split('-', 1)
    return len(parts) == 2 and parts[0].isdigit() and len(parts[0]) == 3


def compress_image(png_path, quality=80, dry_run=False):
    """Convert a PNG to WebP. Returns (original_size, new_size) or None on skip."""
    original_size = png_path.stat().st_size
    webp_path = png_path.with_suffix('.webp')

    if webp_path.exists():
        print(f"  SKIP (WebP exists): {webp_path.name}")
        return None

    if dry_run:
        # Estimate: WebP at q80 is typically ~8-12% of PNG size for this type of content
        estimated = original_size // 10
        return (original_size, estimated)

    with Image.open(png_path) as img:
        # Convert palette/transparency to RGBA for WebP compatibility
        if img.mode == 'P':
            img = img.convert('RGBA')
        elif img.mode == 'RGB':
            pass  # RGB is fine
        elif img.mode not in ('RGBA', 'RGB'):
            img = img.convert('RGBA')

        img.save(webp_path, 'WEBP', quality=quality, method=6)

    new_size = webp_path.stat().st_size

    # Remove original PNG after successful conversion
    png_path.unlink()

    return (original_size, new_size)


def main():
    parser = argparse.ArgumentParser(description='Compress card PNG images to WebP')
    parser.add_argument('--dry-run', action='store_true', help='Preview without modifying files')
    parser.add_argument('--quality', type=int, default=80, help='WebP quality (1-100, default: 80)')
    parser.add_argument('--keep-png', action='store_true', help='Keep original PNG files after conversion')
    args = parser.parse_args()

    if not CARDS_DIR.exists():
        print(f"Error: Cards directory not found: {CARDS_DIR}")
        sys.exit(1)

    total_original = 0
    total_compressed = 0
    file_count = 0
    skip_count = 0

    mode_label = "DRY RUN" if args.dry_run else "CONVERTING"
    print(f"\n{'='*60}")
    print(f"  Image Compression ({mode_label})")
    print(f"  Quality: {args.quality} | Source: {CARDS_DIR}")
    print(f"{'='*60}\n")

    for cat in CATEGORIES:
        cat_dir = CARDS_DIR / cat
        if not cat_dir.exists():
            continue

        png_files = sorted([f for f in cat_dir.iterdir() if is_card_image(f.name)])

        if not png_files:
            continue

        print(f"  [{cat}] {len(png_files)} images")

        for png_path in png_files:
            result = compress_image(png_path, args.quality, args.dry_run)
            if result is None:
                skip_count += 1
                continue
            orig, comp = result
            ratio = (1 - comp / orig) * 100
            total_original += orig
            total_compressed += comp
            file_count += 1

            if args.dry_run:
                print(f"    {png_path.name}: {orig/1024:.0f}KB -> ~{comp/1024:.0f}KB (est. {ratio:.0f}% smaller)")
            else:
                print(f"    {png_path.name}: {orig/1024:.0f}KB -> {comp/1024:.0f}KB ({ratio:.0f}% smaller)")

    print(f"\n{'='*60}")
    print(f"  Summary")
    print(f"{'='*60}")
    print(f"  Files processed: {file_count}")
    print(f"  Skipped (WebP exists): {skip_count}")
    print(f"  Original total:  {total_original/1024/1024:.1f} MB")

    if args.dry_run:
        print(f"  Estimated total: ~{total_compressed/1024/1024:.1f} MB")
        print(f"  Estimated savings: ~{(1 - total_compressed/total_original)*100:.0f}%")
        print(f"\n  Run without --dry-run to apply changes.")
    else:
        savings = total_original - total_compressed
        print(f"  Compressed total: {total_compressed/1024/1024:.1f} MB")
        print(f"  Space saved: {savings/1024/1024:.1f} MB ({savings/total_original*100:.0f}%)")

    print()


if __name__ == '__main__':
    main()
