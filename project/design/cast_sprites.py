# Claude Quest cast generator — built on sprite-artist's pixel-art-engine core.
exec(open('pixel-art-engine.py').read())

PAL = {
  "skin_c":"#e0b090", "skin_p":"#f0c8a8",
  "hair_c":"#3a2a20", "beard_c":"#33241b",
  "hair_p":"#b06438",
  "navy":"#2c3c60", "dot":"#c8d4e8",
  "olive":"#5c6136", "satchel":"#8a5a30",
  "wine":"#71203a", "pink":"#e85a8a",
  "gold":"#ffd166", "frame_p":"#d8a878",
  "jelly_bg":"#a8cce0", "jelly":"#4a90b8",
  "dark":"#26202e",
}

def castle(c, shirt="navy"):
    # legs (olive) + shoes
    c.rect(10,33,4,5,PAL["olive"]); c.rect(16,33,4,5,PAL["olive"])
    c.rect(9,37,5,2,PAL["dark"]);  c.rect(16,37,5,2,PAL["dark"])
    # torso — broader build
    body = PAL["navy"] if shirt=="navy" else PAL["jelly_bg"]
    c.rect(8,22,14,11,body)
    # arms
    c.rect(6,23,2,8,body); c.rect(22,23,2,8,body)
    c.rect(6,31,2,2,PAL["skin_c"]); c.rect(22,31,2,2,PAL["skin_c"])
    # shirt pattern
    if shirt=="navy":
        for (x,y) in [(10,24),(13,26),(16,24),(19,27),(11,29),(17,30),(20,24),(14,31)]:
            c.px(x,y,PAL["dot"])
    else:
        for (x,y) in [(10,24),(15,25),(19,28),(11,29),(17,31),(20,24)]:
            c.px(x,y,PAL["jelly"]); c.px(x,y+1,PAL["jelly"])
    # satchel strap (diagonal) + collar
    for i in range(11):
        c.px(9+i, 22+i, PAL["satchel"])
    c.rect(12,22,6,1,PAL["dark"])
    # neck
    c.rect(13,20,4,2,PAL["skin_c"])
    # head
    c.rect(9,8,12,12,PAL["skin_c"])
    # swept-up hair with left quiff
    c.rect(9,5,12,4,PAL["hair_c"]); c.rect(10,4,10,2,PAL["hair_c"])
    c.rect(11,3,4,1,PAL["hair_c"])                       # quiff peak
    c.px(9,8,PAL["hair_c"]); c.px(20,8,PAL["hair_c"])
    c.rect(9,8,1,3,PAL["hair_c"]); c.rect(20,8,1,3,PAL["hair_c"])
    # full beard: jaw + chin mass
    c.rect(9,15,12,5,PAL["beard_c"])
    c.rect(11,14,8,1,PAL["beard_c"])
    c.rect(12,17,6,2,PAL["beard_c"])
    c.rect(13,16,4,1,PAL["skin_c"])   # mouth gap
    c.px(14,16,PAL["dark"]); c.px(15,16,PAL["dark"])  # smile
    # eyes + thin glasses (lens = pale blue, 1px dark frame edge only)
    c.rect(11,11,3,2,"#cfe0ea"); c.rect(16,11,3,2,"#cfe0ea")   # lenses
    c.px(12,12,PAL["dark"]); c.px(17,12,PAL["dark"])           # pupils
    c.rect(11,10,3,1,PAL["dark"]); c.rect(16,10,3,1,PAL["dark"]) # top frame
    c.px(10,11,PAL["dark"]); c.px(19,11,PAL["dark"])           # sides
    c.rect(14,11,2,1,PAL["dark"])                               # bridge
    return c

def pickles(c, outfit="wine"):
    # legs + shoes (dress covers most)
    c.rect(11,34,3,4,PAL["skin_p"]); c.rect(16,34,3,4,PAL["skin_p"])
    c.rect(10,37,4,2,PAL["dark"]); c.rect(16,37,4,2,PAL["dark"])
    body = PAL["wine"] if outfit=="wine" else PAL["pink"]
    # dress: fitted top, flared skirt
    c.rect(9,22,12,7,body)
    c.trap(9,21,29,35,12,16,body)
    # sleeves
    c.rect(7,23,2,8,body); c.rect(21,23,2,8,body)
    c.rect(7,31,2,2,PAL["skin_p"]); c.rect(21,31,2,2,PAL["skin_p"])
    if outfit=="wine":
        c.rect(12,34,6,1,PAL["pink"])          # pink hem accent
        c.px(13,23,PAL["skin_p"]); c.px(16,23,PAL["skin_p"])  # v-neck hint
    else:
        c.rect(9,22,12,2,"#f2a8c0")            # fuzzy collar
    # neck
    c.rect(13,20,4,2,PAL["skin_p"])
    # head (hairline lower so the face isn't a blank wall)
    c.rect(10,9,10,11,PAL["skin_p"])
    # long spiral curls: crown + flowing side masses w/ curl lobes
    c.rect(9,4,12,5,PAL["hair_p"]); c.rect(10,3,10,2,PAL["hair_p"])
    c.curve([(9,7),(6,13),(7,20),(6,27)], PAL["hair_p"], width=3)
    c.curve([(21,7),(24,13),(23,20),(24,27)], PAL["hair_p"], width=3)
    for (x,y) in [(6,12),(6,17),(5,22),(6,27),(24,12),(24,17),(25,22),(24,27)]:
        c.disc(x,y,1.6,1.6,PAL["hair_p"])       # curl lobes hugging the strands
    c.rect(9,9,1,3,PAL["hair_p"]); c.rect(20,9,1,3,PAL["hair_p"])
    c.px(11,9,PAL["hair_p"]); c.px(18,9,PAL["hair_p"])   # soft hairline
    # eyes + cat-eye glasses (darker rose-gold so frames actually read)
    FR = "#b8824a"
    c.rect(11,11,3,3,"#f6e6da"); c.rect(16,11,3,3,"#f6e6da")   # taller lenses — eyes open
    c.px(12,12,PAL["dark"]); c.px(17,12,PAL["dark"])           # pupils centered
    c.rect(11,10,3,1,FR); c.rect(16,10,3,1,FR)                 # top frame raised
    c.px(10,10,FR); c.px(19,10,FR)                             # upswept tips
    c.px(10,11,FR); c.px(19,11,FR)
    c.rect(14,12,2,1,FR)                                       # bridge
    # lips + choker + gold pendant
    c.rect(14,17,2,1,"#c03a50")
    c.rect(12,20,6,1,PAL["dark"]); c.px(14,21,PAL["gold"]); c.px(15,21,PAL["gold"])
    return c

def quantize(grid, max_colors=16):
    from collections import Counter
    counts = Counter(c for row in grid for c in row if c)
    while len(counts) > max_colors:
        # merge the rarest color into its nearest neighbor by RGB distance
        rare = min(counts, key=lambda c: counts[c])
        rest = [c for c in counts if c != rare]
        rr,gg,bb = hx(rare)
        near = min(rest, key=lambda c: sum((a-b)**2 for a,b in zip(hx(c),(rr,gg,bb))))
        for row in grid:
            for i,c in enumerate(row):
                if c == rare: row[i] = near
        counts = Counter(c for row in grid for c in row if c)
    return grid

def build(fn, **kw):
    c = C(); fn(c, **kw)
    return quantize(outline(shade(c)), 16)

variants = [
    ("Castle A — navy dot", build(castle, shirt="navy")),
    ("Castle B — jellyfish", build(castle, shirt="jelly")),
    ("Pickles A — wine velvet", build(pickles, outfit="wine")),
    ("Pickles B — pink coat", build(pickles, outfit="pink")),
]

# palette discipline check
for name, g in variants:
    cols = set(c for row in g for c in row if c)
    print(f"{name}: {len(cols)} colors")

# concept sheet: sprites at 8x on game bg + silhouette row at 4x
SC = 8
sheet = Image.new("RGB", (4*(W*SC+20)+20, H*SC+H*4+90), hx("#1a1626"))
d = ImageDraw.Draw(sheet)
for i,(name,g) in enumerate(variants):
    ox = 20+i*(W*SC+20)
    img = Image.new("RGBA",(W,H),(0,0,0,0)); p=img.load()
    for y in range(H):
        for x in range(W):
            if g[y][x]: p[x,y]=hx(g[y][x])+(255,)
    big = img.resize((W*SC,H*SC), Image.NEAREST)
    sheet.paste(big,(ox,30),big)
    d.text((ox, 8), name, fill=(232,224,255))
    # silhouette test
    sil = Image.new("RGBA",(W,H),(0,0,0,0)); sp=sil.load()
    for y in range(H):
        for x in range(W):
            if g[y][x]: sp[x,y]=(0,0,0,255)
    sil4 = sil.resize((W*4,H*4), Image.NEAREST)
    sheet.paste(sil4,(ox+(W*SC-W*4)//2, 40+H*SC), sil4)
d.text((20, 46+H*SC+H*4), "bottom row: silhouette test — shapes must read without color", fill=(154,143,192))
sheet.save("cast_concepts.png")
print("sheet saved")
