# All 8 zone mentors — parameterized robed-scholar builder, 2-frame idle each.
exec(open('pixel-art-engine.py').read())

MENTORS = {
  # key: robe, trim, skin, hair color, style, prop
  "wren":   dict(robe="#2e6e62", trim="#255a50", skin="#e8c0a0", hair="#c8c4bc", style="bun",     prop="tome"),
  "elowen": dict(robe="#2e4a6e", trim="#243c5a", skin="#f0c8a8", hair="#b8b0d8", style="long",    prop="orb"),
  "orin":   dict(robe="#5c5136", trim="#4a4230", skin="#d8a878", hair="#8a7a5a", style="beard",   prop="lantern"),
  "odell":  dict(robe="#3c5a70", trim="#324a5e", skin="#e0b090", hair="#3a2a20", style="goggles", prop="plans"),
  "isolde": dict(robe="#5a3a78", trim="#4a3064", skin="#f0c8a8", hair="#b06438", style="braid",   prop="key"),
  "edda":   dict(robe="#3a3230", trim="#8a2a2a", skin="#e0b090", hair="#e8e0d0", style="short",   prop="hammer"),
  "imbry":  dict(robe="#6e2a44", trim="#5a2238", skin="#d8a878", hair="#2a2030", style="pony",    prop="spool"),
  "ilex":   dict(robe="#6e5a36", trim="#5a4a2e", skin="#e8c0a0", hair="#e8e0d0", style="monocle", prop="gear"),
}

def mentor(c, m, frame):
    y = 1 if frame==1 else 0
    c.trap(8,22,20+y,38,12,16,m["robe"])
    c.rect(8,20+y,14,6,m["robe"])
    c.rect(9,26+y,12,3,m["trim"])
    c.rect(13,19+y,4,2,m["skin"])
    c.rect(10,9+y,10,11,m["skin"])
    st = m["style"]; hc = m["hair"]
    if st=="bun":
        c.rect(10,6+y,10,4,hc); c.disc(15,5+y,3,2,hc); c.disc(21,7+y,1.6,1.6,hc)
        c.rect(10,9+y,1,3,hc); c.rect(19,9+y,1,3,hc)
    elif st=="long":
        c.rect(10,5+y,10,4,hc); c.rect(8,8+y,2,12,hc); c.rect(20,8+y,2,12,hc); c.rect(10,9+y,1,2,hc); c.rect(19,9+y,1,2,hc)
    elif st=="beard":
        c.rect(10,15+y,10,5,hc); c.rect(11,14+y,8,1,hc); c.rect(12,20+y,6,2,hc)  # beard, bald head
    elif st=="goggles":
        c.rect(10,6+y,10,4,hc); c.rect(10,9+y,10,2,"#8a5a30"); c.px(12,9+y,"#7ae0ff"); c.px(17,9+y,"#7ae0ff")  # goggle band up
    elif st=="braid":
        c.rect(10,5+y,10,4,hc); c.rect(19,8+y,2,14,hc); c.px(20,22+y,hc)
    elif st=="short":
        c.rect(10,6+y,10,3,hc); c.rect(10,9+y,1,2,hc); c.rect(19,9+y,1,2,hc)
    elif st=="pony":
        c.rect(10,6+y,10,3,hc); c.rect(21,7+y,2,10,hc)
    elif st=="monocle":
        c.rect(10,6+y,10,3,hc); c.rect(10,15+y,10,4,hc); c.rect(12,19+y,6,2,hc)  # hair + beard
    # face
    if st!="monocle":
        c.rect(11,12+y,2,1,"#26202e"); c.rect(16,12+y,2,1,"#26202e")
    else:
        c.rect(11,12+y,2,1,"#26202e"); c.rect(16,11+y,3,3,"#ffd166"); c.px(17,12+y,"#26202e")  # monocle
    if st=="bun": c.rect(11,13+y,2,1,"#ffd166"); c.rect(16,13+y,2,1,"#ffd166")  # wren's spectacles
    c.px(15,15+y,"#c08a70")
    if st not in ("beard","monocle"): c.rect(13,17+y,4,1,"#a05a50")
    # prop at chest
    pr = m["prop"]
    if pr=="tome": c.rect(12,24+y,6,4,"#8a5a30"); c.rect(14,24+y,1,4,"#ffd166")
    elif pr=="orb": c.disc(15,25+y,2.4,2.4,"#7ae0ff"); c.px(14,24+y,"#ffffff")
    elif pr=="lantern": c.rect(13,23+y,4,5,"#8a5a30"); c.rect(14,24+y,2,3,"#ffd166")
    elif pr=="plans": c.rect(11,24+y,8,3,"#e8e0d0"); c.rect(11,25+y,8,1,"#8a5a30")
    elif pr=="key": c.rect(13,23+y,2,5,"#ffd166"); c.disc(14,22+y,1.4,1.4,"#ffd166"); c.px(15,27+y,"#ffd166")
    elif pr=="hammer": c.rect(11,22+y,3,6,"#8a5a30"); c.rect(9,21+y,7,3,"#8a8a92")
    elif pr=="spool": c.rect(12,24+y,5,4,"#8a5a30"); c.rect(12,25+y,5,1,"#ffd166"); c.px(18,26+y,"#ffd166")
    elif pr=="gear": c.disc(15,25+y,2.6,2.6,"#c8a040"); c.px(15,25+y,"#26202e"); c.px(12,23+y,"#c8a040"); c.px(18,23+y,"#c8a040"); c.px(12,27+y,"#c8a040"); c.px(18,27+y,"#c8a040")
    return c

def quantize(grid, mx=16):
    from collections import Counter
    counts = Counter(cc for row in grid for cc in row if cc)
    while len(counts) > mx:
        rare = min(counts, key=lambda cc: counts[cc])
        rest = [cc for cc in counts if cc != rare]
        rr,gg,bb = hx(rare)
        near = min(rest, key=lambda cc: sum((a-b)**2 for a,b in zip(hx(cc),(rr,gg,bb))))
        for row in grid:
            for i,cc in enumerate(row):
                if cc == rare: row[i] = near
        counts = Counter(cc for row in grid for cc in row if cc)
    return grid

import json
sheet = json.load(open('walk_sprites.json'))
from PIL import ImageDraw
prev = Image.new("RGB",(8*(W*6+14)+14, H*6+40),(26,22,38)); d=ImageDraw.Draw(prev)
for i,(key,m) in enumerate(MENTORS.items()):
    sheet[key] = {}
    for f in (0,1):
        c = C(); mentor(c, m, f)
        g = quantize(outline(shade(c)))
        sheet[key][f"idle{f}"] = grid_to_datauri(g)
        if f==0:
            img = Image.new("RGBA",(W,H),(0,0,0,0)); px=img.load()
            for yy in range(H):
                for xx in range(W):
                    if g[yy][xx]: px[xx,yy]=hx(g[yy][xx])+(255,)
            prev.paste(img.resize((W*6,H*6),Image.NEAREST),(14+i*(W*6+14),30),img.resize((W*6,H*6),Image.NEAREST))
            d.text((14+i*(W*6+14),8), key, fill=(232,224,255))
prev.save("mentor_preview.png")
json.dump(sheet, open('walk_sprites.json','w'))
import shutil; shutil.copy('walk_sprites.json','../src/assets/sprites.json')
print("mentors:", list(MENTORS))
