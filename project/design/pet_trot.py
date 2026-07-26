# Overworld trot cycles for the 8 pet companions.
# Frames are derived from each pet's EXACT boss sprite grid via row/column
# displacement (retro "bounce trot": contact-splay / air-tuck) — likeness and
# palette stay pixel-identical to the approved battle art, no re-quantize drift.
# Frame map matches WALK_SEQ semantics: 0 contact-L, 1 air, 2 contact-R, 3 air.
exec(open('boss_sprites.py').read())  # brings in engine, builders, BOSSES, quantize, sheet writing

def blank():
    return [[None] * W for _ in range(H)]

def rows_used(g):
    ys = [y for y in range(H) if any(g[y])]
    return (min(ys), max(ys)) if ys else (0, 0)

def shift_vert(g, dy):
    out = blank()
    for y in range(H):
        ny = y + dy
        if 0 <= ny < H:
            out[ny] = list(g[y])
    return out

def shift_rows_h(g, y0, y1, dx):
    out = [list(r) for r in g]
    for y in range(max(0, y0), min(H, y1 + 1)):
        row = [None] * W
        for x in range(W):
            nx = x + dx
            if 0 <= nx < W and g[y][x]:
                row[nx] = g[y][x]
        out[y] = row
    return out

def tuck(g, y0, y1):
    """pull the feet rows up 1 (air frame: legs tucked under the body)"""
    out = [list(r) for r in g]
    for y in range(max(1, y0), min(H, y1 + 1)):
        for x in range(W):
            if g[y][x] and not out[y - 1][x]:
                out[y - 1][x] = g[y][x]
            out[y][x] = None if y == y1 else out[y][x]
    return out

def trot_frames(base):
    top, bot = rows_used(base)
    feet0 = bot - 3  # bottom 4 occupied rows = the feet zone
    contactL = shift_rows_h(base, feet0, bot, -1)
    contactR = shift_rows_h(base, feet0, bot, 1)
    air = tuck(shift_vert(base, -2), feet0 - 2, bot - 2)
    return [contactL, air, contactR, air]

import json
sheet = json.load(open('walk_sprites.json'))
strip = Image.new("RGB", (8 * (W * 4 * 2 + 24) + 16, (H * 2 + 30)), (26, 22, 38))
from PIL import ImageDraw
d = ImageDraw.Draw(strip)
for i, (key, fn) in enumerate(BOSSES.items()):
    c = C(); fn(c)
    base = quantize(outline(shade(c)))
    frames = trot_frames(base)
    for fi, g in enumerate(frames):
        sheet[key][f"trot{fi}"] = grid_to_datauri(g)
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0)); px = img.load()
        for yy in range(H):
            for xx in range(W):
                if g[yy][xx]: px[xx, yy] = hx(g[yy][xx]) + (255,)
        strip.paste(img.resize((W * 2, H * 2), Image.NEAREST), (16 + i * (W * 4 * 2 + 24) + fi * (W * 2), 24), img.resize((W * 2, H * 2), Image.NEAREST))
    d.text((16 + i * (W * 4 * 2 + 24), 6), key.replace("boss_", ""), fill=(232, 224, 255))
strip.save("pet_trot_preview.png")
json.dump(sheet, open('walk_sprites.json', 'w'))
import shutil; shutil.copy('walk_sprites.json', '../src/assets/sprites.json')
print("trot frames added for:", [k for k in BOSSES])

# animated GIF previews (animation-guide rule: always check motion, not stills)
for key, fn in BOSSES.items():
    c = C(); fn(c)
    base = quantize(outline(shade(c)))
    frames = trot_frames(base)
    seq = [frames[j] for j in [0, 0, 1, 2, 2, 3]]  # contact-weighted, like WALK_SEQ
    imgs = []
    for g in seq:
        img = Image.new("RGBA", (W * 4, H * 4), (26, 22, 38, 255))
        f = Image.new("RGBA", (W, H), (0, 0, 0, 0)); px = f.load()
        for yy in range(H):
            for xx in range(W):
                if g[yy][xx]: px[xx, yy] = hx(g[yy][xx]) + (255,)
        img.paste(f.resize((W * 4, H * 4), Image.NEAREST), (0, 0), f.resize((W * 4, H * 4), Image.NEAREST))
        imgs.append(img.convert("P"))
    imgs[0].save(f"trot_{key.replace('boss_', '')}.gif", save_all=True, append_images=imgs[1:], duration=110, loop=0)
print("gifs written")
