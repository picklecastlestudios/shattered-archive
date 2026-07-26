# Pet boss sprites — 40x36 canvas (bosses read WIDE), locked SNES style.
exec(open('pixel-art-engine.py').read())
W, H = 40, 36   # override canvas for boss scale (globals read at call time)

DARK="#26202e"; FOG="#9a8fc0"

def pug(c):  # THE VAGUE ONE — fawn, black mask, one-eye squint, fog-wreathed
    c.disc(20,23,11,8,"#d0b088")                     # body
    c.rect(12,27,4,5,"#d0b088"); c.rect(24,27,4,5,"#d0b088")
    c.disc(20,12,10,9,"#d0b088")                     # big head
    c.rect(13,6,14,2,"#b89468"); c.rect(14,8,12,1,"#b89468")  # wrinkle brow rows
    c.disc(10,9,3,4,"#26202e"); c.disc(30,9,3,4,"#26202e")    # black ears
    # eyes ON the fawn, above the mask: left = squint line, right = big open
    c.rect(14,12,3,1,"#0d0b14")                      # SQUINT
    c.disc(25,12,1.8,2,"#0d0b14"); c.px(25,11,"#ffffff")  # open eye
    c.disc(20,17,5,3,"#26202e")                      # black muzzle (smaller, lower)
    c.px(19,16,"#0d0b14"); c.px(21,16,"#0d0b14")     # nostrils
    c.rect(18,19,5,1,"#0d0b14")                      # mouth
    c.px(17,15,"#b89468"); c.px(23,15,"#b89468")     # muzzle-side wrinkles
    c.disc(31,21,2,2,"#b89468")                      # curled tail
    for (x,y) in [(5,6),(35,9),(4,18),(36,26),(8,30),(6,7),(34,10)]: c.px(x,y,FOG)
    return c

def peke(c):  # THE MICROMANAGER — sable, enormous eyes, crown + scroll
    c.disc(20,24,12,8,"#b08858")                     # fluffy body
    c.disc(20,25,10,6,"#c8a070")
    c.disc(20,12,9,8,"#b08858")                      # head
    c.disc(20,13,7,6,"#c8a070")                      # lighter face
    c.disc(11,10,3,5,"#26202e"); c.disc(29,10,3,5,"#26202e") # black ears
    c.disc(16,12,2.4,2.6,"#0d0b14"); c.disc(24,12,2.4,2.6,"#0d0b14")  # ENORMOUS eyes
    c.px(15,11,"#ffffff"); c.px(23,11,"#ffffff"); c.px(17,13,"#e8e0ff")
    c.disc(20,16,3,2,"#4a3826")                      # dark muzzle
    c.px(20,15,"#0d0b14"); c.px(19,17,"#e85a8a")     # nose + tongue tip
    c.rect(16,3,9,2,"#ffd166"); c.px(17,2,"#ffd166"); c.px(20,1,"#ffd166"); c.px(23,2,"#ffd166")  # crown
    c.rect(30,22,6,8,"#e8e0d0"); c.rect(30,24,6,1,"#8a5a30"); c.rect(30,27,6,1,"#8a5a30")  # checklist scroll
    c.px(14,21,"#ffd166"); c.px(15,22,"#ffd166")     # bone tag
    return c

def struggles(c):  # THE SILO WARDEN — grey/white cat curled in a silo bowl
    c.disc(20,26,14,7,"#8a5a30")                     # silo bowl
    c.rect(6,24,28,4,"#a06a3a")
    c.rect(6,23,28,1,"#ffd166")                      # gold rim
    c.disc(22,19,8,6,"#6a6a74")                      # curled grey body
    c.disc(14,13,7,7,"#8a8a92")                      # bigger head
    c.poly([(8,7),(10,12),(13,8)],"#8a8a92"); c.poly([(15,7),(17,12),(20,8)],"#8a8a92")  # ears
    c.px(9,9,"#e88aa0"); c.px(17,9,"#e88aa0")        # inner ears
    c.rect(13,10,2,6,"#f0f0ec"); c.disc(14,16,3,2.4,"#f0f0ec")  # white face blaze + muzzle
    c.rect(10,13,2,2,"#c8d84a"); c.px(11,13,"#0d0b14")   # yellow-green eyes, 2px
    c.rect(16,13,2,2,"#c8d84a"); c.px(16,13,"#0d0b14")
    c.px(14,15,"#e88aa0")                            # pink nose
    c.px(13,17,"#6a6a74")                            # signature grey chin dot
    c.rect(10,19,7,2,"#f0f0ec")                      # white chest
    c.disc(29,15,3,2,"#8a8a92"); c.disc(31,13,2,2,"#f0f0ec")  # tail tip over rim
    return c

def gsd(c):  # THE LONE CODER — all-black shepherd, one ear up one flopped
    c.disc(20,23,13,8,"#2e2a34")                     # curled body
    c.disc(26,25,7,5,"#38323e")
    c.disc(13,13,7,7,"#2e2a34")                      # head
    c.poly([(8,4),(10,11),(13,6)],"#2e2a34")         # ear UP
    c.disc(17,8,3,2,"#38323e"); c.poly([(15,7),(20,8),(17,11)],"#2e2a34")  # ear FLOPPED
    c.disc(10,14,1.4,1.6,"#8a5a30"); c.disc(15,14,1.4,1.6,"#8a5a30")  # warm brown eyes
    c.px(10,13,"#ffffff"); c.px(15,13,"#ffffff")
    c.disc(12,18,3,2,"#1d1a24"); c.px(12,17,"#0d0b14")  # muzzle + nose
    c.rect(12,19,3,2,"#e88aa0")                      # tongue
    c.curve([(31,18),(35,14),(34,22)],"#2e2a34",width=3)  # tail
    c.rect(20,29,5,3,"#38323e"); c.rect(27,29,5,3,"#38323e")  # paws
    return c

def pom(c):  # ENTROPY PRIME — sable/white floof corona crackling with static
    for ang in range(12):                              # floof spikes corona
        import math
        x = 20 + 13*math.cos(ang*0.524); y = 18 + 11*math.sin(ang*0.524)
        c.disc(x,y,3,3,"#b08858" if ang%2 else "#e8e0d0")
    c.disc(20,18,10,9,"#e8e0d0")                     # white core floof
    c.disc(20,19,8,7,"#f0ece0")
    c.disc(20,13,6,5,"#c8a070")                      # small sable face
    c.rect(17,10,7,2,"#e8e0d0")                      # white blaze
    c.poly([(13,6),(15,11),(18,7)],"#b08858"); c.poly([(22,7),(25,11),(27,6)],"#b08858")  # ears
    c.disc(17,13,1.4,1.4,"#0d0b14"); c.disc(23,13,1.4,1.4,"#0d0b14")
    c.px(17,12,"#ffffff"); c.px(23,12,"#ffffff")
    c.px(20,15,"#0d0b14"); c.rect(19,17,3,1,"#4a3826")  # nose + smile
    for (x,y,col) in [(4,8,"#7ae0ff"),(36,6,"#6a4fd0"),(3,24,"#6a4fd0"),(37,26,"#7ae0ff"),(20,2,"#7ae0ff"),(19,34,"#6a4fd0")]:
        c.px(x,y,col)                                 # entropy static sparks
    return c

def choji(c):  # THE AMNESIAC — Choji as a maneki-neko: upright, beckoning paw, koban coin
    # upright seated body
    c.disc(19,25,9,9,"#f0f0ec")
    c.trap(10,28,18,34,14,18,"#f0f0ec")
    # head
    c.disc(19,11,9,7,"#f0f0ec")
    c.rect(11,5,16,4,"#8a8a92")                      # grey cap across crown
    c.poly([(10,2),(13,9),(16,4)],"#8a8a92"); c.poly([(22,4),(25,9),(28,2)],"#8a8a92")  # grey ears
    c.px(12,4,"#e88aa0"); c.px(26,4,"#e88aa0")       # pink inner ears
    c.disc(15,12,1.7,1.9,"#0d0b14"); c.disc(23,12,1.7,1.9,"#0d0b14")  # big round eyes
    c.px(15,11,"#ffffff"); c.px(23,11,"#ffffff")
    c.px(15,13,"#b8863a"); c.px(23,13,"#b8863a")     # amber under-glow
    c.px(19,14,"#e88aa0")                            # pink nose
    c.px(18,16,"#c8c4bc"); c.px(20,16,"#c8c4bc")     # w-mouth
    c.px(14,15,"#8a8a92"); c.px(24,15,"#8a8a92")     # whisker dots
    # BECKONING left paw, raised beside head
    c.rect(28,10,4,12,"#f0f0ec")
    c.disc(30,8,3,3,"#f0f0ec")
    c.px(29,7,"#e88aa0"); c.px(31,7,"#e88aa0")       # paw pads hint
    # grounded right paw
    c.disc(12,32,3,2,"#f0f0ec")
    # red collar + gold koban coin
    c.rect(14,18,11,2,"#c03a50")
    c.disc(19,22,3,3,"#ffd166"); c.px(19,22,"#b8863a")  # coin w/ mark
    # grey flank patch + tail curled around base
    c.disc(26,27,2.4,2.4,"#8a8a92")
    c.curve([(28,33),(33,31),(34,25)],"#8a8a92",width=3)
    for (x,y) in [(4,8),(36,16),(3,20),(37,28),(8,2)]: c.px(x,y,FOG)  # memory motes
    c.px(5,9,FOG); c.px(35,17,FOG)
    return c

def scraps(c):  # THE COPY-PASTER — scruffy cream mop, grey eye-patches, green shirt, eternal tongue blep
    # shaggy body in a green shirt
    c.disc(20,24,11,7,"#8ab84e")                     # green shirt body
    c.rect(9,28,22,3,"#8ab84e")
    c.disc(20,31,10,3,"#e8dcc0")                     # shaggy skirt of fur below shirt
    for (x,y) in [(8,30),(12,32),(17,33),(23,33),(28,32),(32,30)]:
        c.disc(x,y,1.6,1.6,"#e8dcc0")                # wispy fur tufts
    # big shaggy head
    c.disc(20,12,10,8,"#e8dcc0")
    for (x,y) in [(10,7),(15,4),(21,4),(27,6),(30,10),(9,15),(31,15)]:
        c.disc(x,y,2,2,"#e8dcc0")                    # flyaway fur
    c.rect(13,5,14,3,"#c8b890")                      # darker crown sweep
    c.disc(15,12,2.6,2.6,"#8a8478"); c.disc(25,12,2.6,2.6,"#8a8478")  # grey eye patches
    c.disc(15,12,1.7,1.9,"#0d0b14"); c.disc(25,12,1.7,1.9,"#0d0b14")  # big round eyes
    c.px(15,11,"#ffffff"); c.px(25,11,"#ffffff")
    c.disc(20,16,3,2,"#8a8478")                      # grey muzzle
    c.rect(19,15,3,2,"#0d0b14")                      # black button nose
    c.rect(22,18,3,4,"#e88aa0"); c.px(23,22,"#c86a80")  # THE BLEP (sideways tongue)
    c.px(14,19,"#c8b890"); c.px(26,19,"#c8b890")     # chin wisps
    return c

def kitherine(c):  # THE REINVENTOR — solid grey cat unraveling the Atelier's spool, gold eyes
    # seated grey body, tail raised
    c.disc(18,23,9,8,"#6a6a74")
    c.trap(9,27,20,33,13,16,"#6a6a74")
    c.disc(17,11,8,7,"#6a6a74")                      # head
    c.poly([(9,3),(12,10),(15,5)],"#6a6a74"); c.poly([(19,5),(22,10),(25,3)],"#6a6a74")  # ears
    c.px(11,5,"#c88a96"); c.px(23,5,"#c88a96")       # pink-tinged inner ears
    c.disc(14,12,1.8,2,"#0d0b14"); c.disc(21,12,1.8,2,"#0d0b14")  # round eyes
    c.px(14,11,"#ffffff"); c.px(21,11,"#ffffff")
    c.px(14,13,"#d8a83a"); c.px(21,13,"#d8a83a")     # amber-gold glow
    c.px(17,14,"#4e4e58")                            # grey nose
    c.px(16,16,"#4e4e58"); c.px(18,16,"#4e4e58")     # mouth
    c.curve([(27,30),(31,24),(30,16)],"#6a6a74",width=3)  # tail raised
    # the spool being unraveled: wooden spool + GOLD thread trailing away
    c.rect(28,29,6,5,"#8a5a30"); c.rect(28,31,6,1,"#ffd166")
    c.curve([(28,31),(22,34),(14,32),(7,34)],"#ffd166",width=1)  # unspooled thread
    c.px(5,33,"#ffd166"); c.px(3,34,"#ffd166")
    # paw pinning the thread, mid-crime
    c.disc(24,31,2.6,2,"#6a6a74")
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
BOSSES = {
    "boss_vestibule": pug, "boss_hall-of-memory": choji, "boss_cowork-caverns": peke, "boss_bridge-wing": scraps,
    "boss_connector-keep": struggles, "boss_skillwright-atelier": kitherine, "boss_codeforge": gsd, "boss_automation-spire": pom,
}
sheet = json.load(open('walk_sprites.json'))
from PIL import ImageDraw
prev = Image.new("RGB",(8*(W*8+16)+16, H*8+46),(26,22,38)); d=ImageDraw.Draw(prev)
for i,(key,fn) in enumerate(BOSSES.items()):
    c = C(); fn(c)
    g = quantize(outline(shade(c)))
    sheet[key] = {"idle0": grid_to_datauri(g)}
    img = Image.new("RGBA",(W,H),(0,0,0,0)); px=img.load()
    for yy in range(H):
        for xx in range(W):
            if g[yy][xx]: px[xx,yy]=hx(g[yy][xx])+(255,)
    prev.paste(img.resize((W*8,H*8),Image.NEAREST),(16+i*(W*8+16),36),img.resize((W*8,H*8),Image.NEAREST))
    d.text((16+i*(W*8+16),10), key.replace("boss_",""), fill=(232,224,255))
prev.save("boss_preview.png")
json.dump(sheet, open('walk_sprites.json','w'))
import shutil; shutil.copy('walk_sprites.json','../src/assets/sprites.json')
print("bosses:", list(BOSSES))
