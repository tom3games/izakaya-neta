# 緑背景を抜いて webp(透過) にする。~/tools/pyimg/bin/python art/key.py（Pillow と numpy が要る）
# 生成元の画像はリポジトリの外（../_art_raw/izakaya-neta/raw）
import numpy as np, glob, os
from PIL import Image, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); OUT = D + '/../img/'; RAW = D + '/../../_art_raw/izakaya-neta/raw'
os.makedirs(OUT, exist_ok=True)
def fit23(im):
    # 高さ1536にそろえ、横を中央で1024に切る・足りなければ透明で足す（人の大きさを全員そろえる）
    w, h = im.size; s = 1536 / h; im = im.resize((round(w * s), 1536), Image.LANCZOS); w = im.size[0]
    c = Image.new(im.mode, (1024, 1536), (0, 255, 0) if im.mode == 'RGB' else (0, 0, 0, 0))
    c.paste(im, ((1024 - w) // 2, 0)); return c
def key(src):
    im = fit23(Image.open(src).convert('RGB'))
    a = np.asarray(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    k = g - np.maximum(r, b)
    al = 1 - np.clip((k - 2) / (40 - 2), 0, 1)
    lim = np.maximum(r, b); g = np.where(g > lim, lim, g)
    spill = (k > -6) | (al < 0.98); g = np.where(spill, np.minimum(g, 0.72 * r + 0.28 * b), g)
    out = Image.fromarray(np.dstack([r, g, b, al * 255]).clip(0, 255).astype(np.uint8), 'RGBA')
    A = out.split()[3].filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.9)); out.putalpha(A)
    return out
def save(im, n, q=76):
    im.save(OUT + n + '.webp', quality=q, method=6); print(n, im.size, os.path.getsize(OUT + n + '.webp') // 1024, 'KB')
for f in sorted(glob.glob(RAW + '/*.png')):
    n = os.path.basename(f)[:-4]
    if n == 'bg': continue
    if os.path.exists(OUT + n + '.webp') and os.path.getmtime(OUT + n + '.webp') > os.path.getmtime(f): continue
    save(key(f).resize((400, 600), Image.LANCZOS), n)
bg = Image.open(RAW + '/bg.png').convert('RGB').resize((720, 1080), Image.LANCZOS); save(bg, 'bg', 72)
