# 把 verify-covers/<cat>-<num>.jpg 裁出「游戏释义」区，按 4x5 拼成每类一张 sheet
import os
from PIL import Image, ImageDraw

SRC = 'verify-covers'
OUT = 'verify-sheets'
os.makedirs(OUT, exist_ok=True)

CATS = ['block', 'tool', 'weapon', 'food', 'ore', 'redstone', 'animal', 'monster']
CROP = (25, 100, 470, 395)  # 游戏释义区域
CW, CH = CROP[2] - CROP[0], CROP[3] - CROP[1]

for cat in CATS:
    sheet = Image.new('RGB', (CW * 4, CH * 5), 'white')
    draw = ImageDraw.Draw(sheet)
    for i in range(20):
        num = f'{i+1:03d}'
        p = os.path.join(SRC, f'{cat}-{num}.jpg')
        im = Image.open(p).crop(CROP)
        x, y = (i % 4) * CW, (i // 4) * CH
        sheet.paste(im, (x, y))
        draw.rectangle([x, y, x + 44, y + 20], fill='yellow')
        draw.text((x + 3, y + 3), num, fill='black')
    out = os.path.join(OUT, f'{cat}.jpg')
    sheet.save(out, quality=88)
    print(out, sheet.size)
