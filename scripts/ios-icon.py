"""Draws the app icon: italic serif "Ca" on black with the accent bar.
Needs Pillow: python3 -m pip install pillow && python3 scripts/ios-icon.py"""
from PIL import Image, ImageDraw, ImageFont

img = Image.new('RGB', (1024, 1024), 'black')
d = ImageDraw.Draw(img)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf', 560)
d.text((512, 470), 'Ca', font=font, fill='white', anchor='mm')
d.rectangle((212, 760, 812, 782), fill='#FACC15')
img.save('ios/CineArch/Assets.xcassets/AppIcon.appiconset/AppIcon.png')
