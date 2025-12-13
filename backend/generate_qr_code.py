#!/usr/bin/env python3
"""
QR Code Generator for Bloom Application
Generates a QR code for the deployed Bloom frontend URL
"""

import qrcode
from PIL import Image
import os

# Configuration
BLOOM_URL = "https://bloom-sigma-lake.vercel.app/"
OUTPUT_FILE = "bloom_qr_code.png"

def generate_qr_code(url, filename, logo_path=None):
    """
    Generate a QR code for the given URL

    Args:
        url: The URL to encode in the QR code
        filename: Output filename for the QR code image
        logo_path: Optional path to a logo image to embed in the center
    """

    # Create QR code instance
    qr = qrcode.QRCode(
        version=1,  # Controls the size (1-40, 1 is smallest)
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction (30%)
        box_size=10,  # Size of each box in pixels
        border=4,  # Border size in boxes
    )

    # Add data to QR code
    qr.add_data(url)
    qr.make(fit=True)

    # Create the image
    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to RGB for logo embedding
    img = img.convert('RGB')

    # Add logo if provided
    if logo_path and os.path.exists(logo_path):
        logo = Image.open(logo_path)

        # Calculate logo size (should be ~20% of QR code size)
        qr_width, qr_height = img.size
        logo_size = min(qr_width, qr_height) // 5

        # Resize logo
        logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

        # Calculate position to center logo
        logo_pos = ((qr_width - logo_size) // 2, (qr_height - logo_size) // 2)

        # Paste logo onto QR code
        img.paste(logo, logo_pos)

    # Save the image
    img.save(filename)
    print(f"✅ QR code generated successfully: {filename}")
    print(f"📱 URL: {url}")
    print(f"📏 Image size: {img.size[0]}x{img.size[1]} pixels")

    return filename


def generate_multiple_sizes(url, base_name="bloom_qr"):
    """
    Generate QR codes in multiple sizes for different use cases
    """
    sizes = {
        'small': 5,    # For digital use (smaller file)
        'medium': 10,  # Standard size (default)
        'large': 15,   # For printing (high quality)
        'poster': 20,  # For posters/banners
    }

    generated_files = []

    for size_name, box_size in sizes.items():
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=box_size,
            border=4,
        )

        qr.add_data(url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        filename = f"{base_name}_{size_name}.png"
        img.save(filename)

        generated_files.append({
            'name': size_name,
            'file': filename,
            'size': f"{img.size[0]}x{img.size[1]}",
            'use_case': {
                'small': 'Digital sharing (WhatsApp, email)',
                'medium': 'Website, presentations',
                'large': 'Print materials (flyers, posters)',
                'poster': 'Large banners, billboards'
            }[size_name]
        })

    return generated_files


if __name__ == "__main__":
    print("=" * 60)
    print("🌸 BLOOM QR CODE GENERATOR")
    print("=" * 60)
    print()

    # Check if qrcode library is installed
    try:
        import qrcode
        from PIL import Image
    except ImportError:
        print("❌ Required libraries not installed!")
        print("\nPlease install:")
        print("  pip3 install qrcode[pil]")
        print("  pip3 install pillow")
        exit(1)

    # Generate standard QR code
    print("Generating standard QR code...")
    generate_qr_code(BLOOM_URL, OUTPUT_FILE)
    print()

    # Generate multiple sizes
    print("Generating QR codes in multiple sizes...")
    print()
    files = generate_multiple_sizes(BLOOM_URL)

    print("\n" + "=" * 60)
    print("📦 GENERATED FILES:")
    print("=" * 60)
    for f in files:
        print(f"\n{f['name'].upper()}:")
        print(f"  File: {f['file']}")
        print(f"  Size: {f['size']} pixels")
        print(f"  Use: {f['use_case']}")

    print("\n" + "=" * 60)
    print("✨ QR CODES GENERATED SUCCESSFULLY!")
    print("=" * 60)
    print("\nThese QR codes link to:")
    print(f"  {BLOOM_URL}")
    print("\nShare them on:")
    print("  📱 Social media (Instagram, Twitter, Facebook)")
    print("  📧 Email campaigns")
    print("  📄 Print materials (flyers, posters)")
    print("  🏥 Clinic waiting rooms")
    print("  🎪 Community events")
    print()
