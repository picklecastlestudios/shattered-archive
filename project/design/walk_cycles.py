# 4-direction walk cycles for Castle & Pickles. Facings: down/up/side (side flips for left).
# Frames: 0 contact-L, 1 passing, 2 contact-R, 3 passing. Silhouette-first per animation-guide.
exec(open('pixel-art-engine.py').read())

PAL = {
  "skin_c":"#e0b090","skin_p":"#f0c8a8","hair_c":"#3a2a20","beard_c":"#33241b",
  "hair_p":"#b06438","navy":"#2c3c60","dot":"#c8d4e8","olive":"#5c6136",
  "satchel":"#8a5a30","wine":"#71203a","pink":"#e85a8a","gold":"#ffd166","dark":"#26202e",
}
FR_P = "#b8824a"

def walk_off(frame):
    # (left_leg_dy, right_leg_dy, bob) — legs shorten on their step; body bobs on contact
    return {0:(-2,0,1), 1:(0,0,0), 2:(0,-2,1), 3:(0,0,0)}[frame]

def castle_head_front(c, bob):
    y=bob
    c.rect(13,20+y,4,2,PAL["skin_c"])
    c.rect(9,8+y,12,12,PAL["skin_c"])
    c.rect(9,5+y,12,4,PAL["hair_c"]); c.rect(10,4+y,10,2,PAL["hair_c"]); c.rect(11,3+y,4,1,PAL["hair_c"])
    c.rect(9,8+y,1,3,PAL["hair_c"]); c.rect(20,8+y,1,3,PAL["hair_c"])
    c.rect(9,15+y,12,5,PAL["beard_c"]); c.rect(11,14+y,8,1,PAL["beard_c"]); c.rect(12,17+y,6,2,PAL["beard_c"])
    c.rect(13,16+y,4,1,PAL["skin_c"]); c.px(14,16+y,PAL["dark"]); c.px(15,16+y,PAL["dark"])
    c.rect(11,11+y,3,2,"#cfe0ea"); c.rect(16,11+y,3,2,"#cfe0ea")
    c.px(12,12+y,PAL["dark"]); c.px(17,12+y,PAL["dark"])
    c.rect(11,10+y,3,1,PAL["dark"]); c.rect(16,10+y,3,1,PAL["dark"])
    c.px(10,11+y,PAL["dark"]); c.px(19,11+y,PAL["dark"]); c.rect(14,11+y,2,1,PAL["dark"])

def castle(c, facing, frame, outfit=0):
    l,r,bob = walk_off(frame); y=bob
    if facing in ("down","up"):
        # legs
        c.rect(10,33+y+l,4,5-l,PAL["olive"]); c.rect(16,33+y+r,4,5-r,PAL["olive"])
        c.rect(9,37+y+l,5,2,PAL["dark"]); c.rect(16,37+y+r,5,2,PAL["dark"])
        # torso + arms (arms swing opposite legs)
        BODY = PAL["navy"] if outfit==0 else ("#a8cce0" if outfit==1 else ("#e8e0d0" if outfit==2 else ("#5a7a9a" if outfit==3 else ("#705a78" if outfit==4 else "#5c3340"))))
        c.rect(8,22+y,14,11,BODY)
        c.rect(6,23+y+r,2,8,BODY); c.rect(22,23+y+l,2,8,BODY)
        c.rect(6,31+y+r,2,2,PAL["skin_c"]); c.rect(22,31+y+l,2,2,PAL["skin_c"])
        if facing=="down":
            if outfit==0:
                for (dx,dy) in [(10,24),(13,26),(16,24),(19,27),(11,29),(17,30),(20,24),(14,31)]:
                    c.px(dx,dy+y,PAL["dot"])
            elif outfit in (1,2):
                for (dx,dy) in [(10,24),(15,26),(19,24),(11,29),(17,30)]:
                    c.px(dx,dy+y,"#4a90b8"); c.px(dx,dy+1+y,"#4a90b8")
            elif outfit==3:  # tiny crabs: one-red silhouette (2px body + claw nubs), placed OFF the satchel strap diagonal
                for (dx,dy) in [(16,24),(10,28),(18,29),(13,31)]:
                    c.px(dx,dy+y,"#c85a3a"); c.px(dx+1,dy+y,"#c85a3a")
                    c.px(dx-1,dy-1+y,"#c85a3a"); c.px(dx+2,dy-1+y,"#c85a3a")
            elif outfit==4:  # coffee cups: bright cream 2x2 mug + coffee-dark top
                for (dx,dy) in [(16,24),(10,28),(18,30)]:
                    c.px(dx,dy+y,"#cfe0ea"); c.px(dx+1,dy+y,"#cfe0ea")
                    c.px(dx,dy+1+y,"#cfe0ea"); c.px(dx+1,dy+1+y,"#cfe0ea")
                    c.px(dx,dy-1+y,"#33241b"); c.px(dx+1,dy-1+y,"#33241b")
                    c.px(dx+2,dy+y,"#cfe0ea")  # handle nub
            else:  # open tomes: 3x3 — two 1x2 pale pages either side of a dark gutter, dark cover below.
                #  PRINT RULE: both colors palette-NATIVE to Castle (glasses lens + beard). NOTE the
                #  authored hex is NOT what lands in the PNG — shade()/outline() recolour it and the
                #  16-colour shared quantize merges the result (alt4's cups do the same). What matters
                #  is that the merged result stays VISUALLY distinct from the garment; verified by eye.
                #  Pages are 2px tall (not 1) so the motif reads as a book rather than a speck.
                #  Positions kept OFF the satchel-strap diagonal (strap x = 9+(row-22) on the down
                #  view) — checked for EVERY row the motif spans, not just its top-left corner.
                for (dx,dy) in [(16,24),(10,28),(14,30)]:
                    for ddy in (0,1):                                     # left + right pages
                        c.px(dx,dy+ddy+y,"#cfe0ea"); c.px(dx+2,dy+ddy+y,"#cfe0ea")
                        c.px(dx+1,dy+ddy+y,"#33241b")                     # gutter/spine
                    for ddx in (0,1,2):
                        c.px(dx+ddx,dy+2+y,"#33241b")                     # cover
            for i in range(11): c.px(9+i,22+i+y,PAL["satchel"])
            c.rect(12,22+y,6,1,PAL["dark"])
            castle_head_front(c,bob)
        else: # up — back view: hair covers head, strap across back
            if outfit==1:
                for (dx,dy) in [(11,25),(16,28),(19,24)]:
                    c.px(dx,dy+y,"#4a90b8"); c.px(dx,dy+1+y,"#4a90b8")
            elif outfit==2:
                for (dx,dy) in [(11,26),(17,25),(14,30)]:
                    c.px(dx,dy+y,"#e8882a"); c.px(dx+1,dy+y,"#e8882a"); c.px(dx,dy-1+y,"#4e8438")
            elif outfit==3:  # tiny crabs: one-red silhouette, off the back-strap diagonal
                for (dx,dy) in [(16,25),(10,28),(14,31)]:
                    c.px(dx,dy+y,"#c85a3a"); c.px(dx+1,dy+y,"#c85a3a")
                    c.px(dx-1,dy-1+y,"#c85a3a"); c.px(dx+2,dy-1+y,"#c85a3a")
            elif outfit==4:  # coffee cups
                for (dx,dy) in [(16,25),(10,28)]:
                    c.px(dx,dy+y,"#cfe0ea"); c.px(dx+1,dy+y,"#cfe0ea")
                    c.px(dx,dy+1+y,"#cfe0ea"); c.px(dx+1,dy+1+y,"#cfe0ea")
                    c.px(dx,dy-1+y,"#33241b"); c.px(dx+1,dy-1+y,"#33241b")
            elif outfit==5:  # open tomes — back-strap runs the OTHER diagonal here (x = 42-row), so
                             # the down-view positions are NOT reusable; recomputed per spanned row.
                for (dx,dy) in [(10,24),(18,25),(16,29)]:
                    for ddy in (0,1):
                        c.px(dx,dy+ddy+y,"#cfe0ea"); c.px(dx+2,dy+ddy+y,"#cfe0ea")
                        c.px(dx+1,dy+ddy+y,"#33241b")
                    for ddx in (0,1,2):
                        c.px(dx+ddx,dy+2+y,"#33241b")
            c.rect(13,20+y,4,2,PAL["skin_c"])
            c.rect(9,8+y,12,12,PAL["skin_c"])
            c.rect(9,4+y,12,13,PAL["hair_c"]); c.rect(10,3+y,10,2,PAL["hair_c"])
            c.rect(9,15+y,12,3,PAL["beard_c"])  # beard peeking at jaw sides
            for i in range(11): c.px(20-i,22+i+y,PAL["satchel"])
    else: # side (facing right; flip for left)
        # legs swing fore/aft
        lg = {0:(-3,3),1:(0,0),2:(3,-3),3:(0,0)}[frame]
        c.rect(12+lg[0],33+y,4,5,PAL["olive"]); c.rect(14+lg[1],33+y,4,5,PAL["dark"] if False else PAL["olive"])
        c.rect(12+lg[0],37+y,5,2,PAL["dark"]); c.rect(14+lg[1],37+y,5,2,PAL["dark"])
        # torso (narrower) + satchel bag at hip
        BODY = PAL["navy"] if outfit==0 else ("#a8cce0" if outfit==1 else ("#e8e0d0" if outfit==2 else ("#5a7a9a" if outfit==3 else ("#705a78" if outfit==4 else "#5c3340"))))
        c.rect(10,22+y,10,11,BODY)
        c.rect(8,26+y,3,5,PAL["satchel"])  # bag
        c.rect(12,22+y,1,6,PAL["satchel"]) # strap edge
        # swinging arm
        arm = {0:3,1:0,2:-3,3:0}[frame]
        c.rect(13+arm//2,23+y,3,8,BODY); c.rect(13+arm//2,31+y,3,2,PAL["skin_c"])
        # head profile
        c.rect(11,8+y,10,12,PAL["skin_c"])
        c.rect(10,4+y,11,5,PAL["hair_c"]); c.rect(9,6+y,3,6,PAL["hair_c"])  # back of head
        c.rect(12,3+y,5,1,PAL["hair_c"])
        c.rect(15,14+y,7,6,PAL["beard_c"]); c.rect(20,12+y,2,3,PAL["beard_c"])  # jaw beard w/ front bump
        c.rect(16,11+y,4,2,"#cfe0ea"); c.px(18,12+y,PAL["dark"]); c.rect(16,10+y,4,1,PAL["dark"])
    return c

def pickles_head_front(c, bob):
    y=bob
    c.rect(13,20+y,4,2,PAL["skin_p"])
    c.rect(10,9+y,10,11,PAL["skin_p"])
    c.rect(9,4+y,12,5,PAL["hair_p"]); c.rect(10,3+y,10,2,PAL["hair_p"])
    c.curve([(9,7+y),(6,13+y),(7,20+y),(6,27+y)], PAL["hair_p"], width=3)
    c.curve([(21,7+y),(24,13+y),(23,20+y),(24,27+y)], PAL["hair_p"], width=3)
    for (x,yy) in [(6,12),(6,17),(5,22),(6,27),(24,12),(24,17),(25,22),(24,27)]:
        c.disc(x,yy+y,1.6,1.6,PAL["hair_p"])
    c.rect(9,9+y,1,3,PAL["hair_p"]); c.rect(20,9+y,1,3,PAL["hair_p"])
    c.px(11,9+y,PAL["hair_p"]); c.px(18,9+y,PAL["hair_p"])
    c.rect(11,11+y,3,3,"#f6e6da"); c.rect(16,11+y,3,3,"#f6e6da")
    c.px(12,12+y,PAL["dark"]); c.px(17,12+y,PAL["dark"])
    c.rect(11,10+y,3,1,FR_P); c.rect(16,10+y,3,1,FR_P)
    c.px(10,10+y,FR_P); c.px(19,10+y,FR_P); c.px(10,11+y,FR_P); c.px(19,11+y,FR_P)
    c.rect(14,12+y,2,1,FR_P)
    c.rect(14,17+y,2,1,"#c03a50")
    c.rect(12,20+y,6,1,PAL["dark"]); c.px(14,21+y,PAL["gold"]); c.px(15,21+y,PAL["gold"])

def pickles(c, facing, frame, outfit=0):
    l,r,bob = walk_off(frame); y=bob
    # outfit 5 dress = mid PLUM. Constraints that ruled out the obvious picks: the Troubles print is
    # black + white, so a dark dress swallows the mask and a cream one swallows the blaze (the alt3
    # "grey on grey" mistake, in both directions); a warm rust/amber collides with her copper hair
    # #b06438; and slate blue (tried first) read as a near-duplicate of alt4's indigo #3a3c6e — two
    # consecutive unlocks must not both be "the blue one". Plum is the only unused hue that clears
    # all three. Hem follows the established pattern: a lighter tint of the dress.
    DRESS = PAL["wine"] if outfit==0 else ("#a8c878" if outfit==1 else ("#e0d0b0" if outfit==2 else ("#2e5a54" if outfit==3 else ("#3a3c6e" if outfit==4 else "#8a5a8a"))))
    HEM   = PAL["pink"] if outfit==0 else ("#3a682a" if outfit==1 else ("#8a5a30" if outfit==2 else ("#6aa89a" if outfit==3 else ("#7a7cb0" if outfit==4 else "#bc94bc"))))
    if facing in ("down","up"):
        c.rect(11,34+y+l,3,4-l,PAL["skin_p"]); c.rect(16,34+y+r,3,4-r,PAL["skin_p"])
        c.rect(10,37+y+l,4,2,PAL["dark"]); c.rect(16,37+y+r,4,2,PAL["dark"])
        c.rect(9,22+y,12,7,DRESS)
        # skirt sways opposite step
        sway = {0:-1,1:0,2:1,3:0}[frame]
        c.trap(9+sway,21,29+y,35+y,12,16,DRESS)
        if outfit==1:
            for (dx,dy) in [(11,24),(16,23),(13,27),(18,26),(10,30),(15,31),(19,30),(12,33)]:
                c.px(dx,dy+y,"#3a682a"); c.px(dx,dy+1+y,"#4e8438")
        elif outfit==2:  # tiny pugs: fawn face + dark mask/ears
            for (dx,dy) in [(11,24),(16,23),(13,28),(18,27),(11,31),(16,32)]:
                c.px(dx,dy+y,"#c8a070"); c.px(dx+1,dy+y,"#c8a070")
                c.px(dx,dy+1+y,"#3a2a20"); c.px(dx+1,dy+1+y,"#3a2a20")
        elif outfit==3:  # Struggles faces: grey mask on top, white blaze/muzzle below, one yellow-green eye fleck
            for (dx,dy) in [(11,24),(16,23),(13,28),(18,27),(11,31),(16,32)]:
                c.px(dx,dy+y,"#8a8a92"); c.px(dx+1,dy+y,"#8a8a92")
                c.px(dx,dy+1+y,"#f0f0ec"); c.px(dx+1,dy+1+y,"#f0f0ec")
            c.px(13,28+y,"#c8d84a")
        elif outfit==4:  # Choji lucky-cat: white 2x2 face + gold koban coin beside
            for (dx,dy) in [(11,24),(16,23),(13,28),(18,27),(11,31)]:
                c.px(dx,dy+y,"#f6e6da"); c.px(dx+1,dy+y,"#f6e6da")
                c.px(dx,dy+1+y,"#f6e6da"); c.px(dx+1,dy+1+y,"#f6e6da")
                c.px(dx+2,dy+y,"#ffd166")
        elif outfit==5:  # Troubles faces: black GSD mask over a white chest blaze, one tan flopped ear.
                         # dark #26202e + lens #f6e6da + frame-tan #b8824a are ALL already in Pickles'
                         # own palette, so the shared quantize keeps them (PRINT RULE).
            for (dx,dy) in [(11,24),(16,23),(13,28),(18,27),(11,31),(16,32)]:
                c.px(dx,dy+y,"#26202e"); c.px(dx+1,dy+y,"#26202e")        # black mask + ears
                c.px(dx,dy+1+y,"#f6e6da"); c.px(dx+1,dy+1+y,"#f6e6da")    # white blaze/muzzle
                c.px(dx+1,dy-1+y,"#b8824a")                               # one ear tipped/flopped tan
        c.rect(7,23+y+r,2,8,DRESS); c.rect(21,23+y+l,2,8,DRESS)
        c.rect(7,31+y+r,2,2,PAL["skin_p"]); c.rect(21,31+y+l,2,2,PAL["skin_p"])
        c.rect(12+sway,34+y,6,1,HEM)
        if facing=="down":
            c.px(13,23+y,PAL["skin_p"]); c.px(16,23+y,PAL["skin_p"])
            pickles_head_front(c,bob)
        else: # back: full curl curtain
            c.rect(13,20+y,4,2,PAL["skin_p"])
            c.rect(10,9+y,10,11,PAL["skin_p"])
            c.rect(9,3+y,12,6,PAL["hair_p"])
            c.rect(8,8+y,14,14,PAL["hair_p"])
            for (x,yy) in [(8,22),(11,23),(14,24),(17,23),(21,22)]:
                c.disc(x,yy+y,1.7,1.7,PAL["hair_p"])
    else: # side (facing right)
        lg = {0:(-3,3),1:(0,0),2:(3,-3),3:(0,0)}[frame]
        c.rect(12+lg[0],34+y,3,4,PAL["skin_p"]); c.rect(15+lg[1],34+y,3,4,PAL["skin_p"])
        c.rect(11+lg[0],37+y,4,2,PAL["dark"]); c.rect(14+lg[1],37+y,4,2,PAL["dark"])
        c.rect(11,22+y,9,7,DRESS)
        sway = {0:1,1:0,2:-1,3:0}[frame]
        c.trap(11,20,29+y,35+y,9,13+sway,DRESS)
        if outfit==1:
            for (dx,dy) in [(13,24),(17,27),(12,30),(16,32)]:
                c.px(dx,dy+y,"#3a682a"); c.px(dx,dy+1+y,"#4e8438")
        elif outfit==2:
            for (dx,dy) in [(13,24),(17,28),(13,31)]:
                c.px(dx,dy+y,"#c8a070"); c.px(dx+1,dy+y,"#c8a070")
                c.px(dx,dy+1+y,"#3a2a20"); c.px(dx+1,dy+1+y,"#3a2a20")
        elif outfit==3:
            for (dx,dy) in [(13,24),(17,28),(13,31)]:
                c.px(dx,dy+y,"#8a8a92"); c.px(dx+1,dy+y,"#8a8a92")
                c.px(dx,dy+1+y,"#f0f0ec"); c.px(dx+1,dy+1+y,"#f0f0ec")
        elif outfit==5:  # side print — outfits 1-3 all carry one; alt4 omitting it looks like an
                         # oversight rather than a decision, so pair #6 keeps the side view populated.
            for (dx,dy) in [(13,24),(17,28),(13,31)]:
                c.px(dx,dy+y,"#26202e"); c.px(dx+1,dy+y,"#26202e")
                c.px(dx,dy+1+y,"#f6e6da"); c.px(dx+1,dy+1+y,"#f6e6da")
        c.rect(12,34+y,7,1,HEM)
        arm = {0:3,1:0,2:-3,3:0}[frame]
        c.rect(13+arm//2,23+y,3,7,DRESS); c.rect(13+arm//2,30+y,3,2,PAL["skin_p"])
        # head profile + curl mass behind
        c.rect(12,9+y,9,11,PAL["skin_p"])
        c.rect(10,4+y,11,5,PAL["hair_p"]); c.rect(12,3+y,5,1,PAL["hair_p"])
        c.curve([(10,7+y),(8,14+y),(9,21+y),(8,27+y)], PAL["hair_p"], width=4)
        for (x,yy) in [(8,12),(7,17),(9,22),(8,27)]:
            c.disc(x,yy+y,1.7,1.7,PAL["hair_p"])
        c.rect(16,11+y,4,3,"#f6e6da"); c.px(18,12+y,PAL["dark"]); c.rect(16,10+y,4,1,FR_P); c.px(20,10+y,FR_P)
        c.px(20,16+y,"#c03a50")
        c.rect(14,20+y,5,1,PAL["dark"]); c.px(16,21+y,PAL["gold"])
    return c

def quantize(grid, max_colors=16):
    from collections import Counter
    counts = Counter(cc for row in grid for cc in row if cc)
    while len(counts) > max_colors:
        rare = min(counts, key=lambda cc: counts[cc])
        rest = [cc for cc in counts if cc != rare]
        rr,gg,bb = hx(rare)
        near = min(rest, key=lambda cc: sum((a-b)**2 for a,b in zip(hx(cc),(rr,gg,bb))))
        for row in grid:
            for i,cc in enumerate(row):
                if cc == rare: row[i] = near
        counts = Counter(cc for row in grid for cc in row if cc)
    return grid

def build_raw(fn, facing, frame):
    c = C(); fn(c, facing, frame)
    return outline(shade(c))

def shared_quantize(grids, max_colors=16):
    # ONE merge map across all frames — prevents frame-to-frame palette flicker
    from collections import Counter
    counts = Counter(cc for g in grids for row in g for cc in row if cc)
    mapping = {}
    def resolve(c):
        while c in mapping: c = mapping[c]
        return c
    while len(counts) > max_colors:
        rare = min(counts, key=lambda cc: counts[cc])
        rest = [cc for cc in counts if cc != rare]
        rr,gg,bb = hx(rare)
        near = min(rest, key=lambda cc: sum((a-b)**2 for a,b in zip(hx(cc),(rr,gg,bb))))
        mapping[rare] = near
        counts[near] += counts.pop(rare)
    for g in grids:
        for row in g:
            for i,cc in enumerate(row):
                if cc: row[i] = resolve(cc)
    return grids

import json
sheet = {}
FRAME_KEYS = [f"{fc}{f}" for fc in ("down","up","side") for f in range(4)]
def build_raw2(fn, fc, f, outfit):
    c = C(); fn(c, fc, f, outfit=outfit)
    return outline(shade(c))
for name, fn, outfit in [("castle", castle, 0), ("castle_alt", castle, 1), ("castle_alt2", castle, 2), ("castle_alt3", castle, 3), ("castle_alt4", castle, 4), ("castle_alt5", castle, 5), ("pickles", pickles, 0), ("pickles_alt", pickles, 1), ("pickles_alt2", pickles, 2), ("pickles_alt3", pickles, 3), ("pickles_alt4", pickles, 4), ("pickles_alt5", pickles, 5)]:
    grids = [build_raw2(fn, fc, f, outfit) for fc in ("down","up","side") for f in range(4)]
    grids = shared_quantize(grids, 16)
    sheet[name] = {}
    for key, g in zip(FRAME_KEYS, grids):
        sheet[name][key] = grid_to_datauri(g)
json.dump(sheet, open("walk_sprites.json","w"))
print("frames:", {k: len(v) for k,v in sheet.items()})

# animated GIF previews (contact frames held longer: 0,0,1,2,2,3)
import base64, io
for name in ("castle","pickles"):
    for facing in ("down","side","up"):
        frames = []
        for f in [0,0,1,2,2,3]:
            fimg = Image.open(io.BytesIO(base64.b64decode(sheet[name][f"{facing}{f}"].split(',')[1]))).convert("RGBA")
            img = Image.new("RGBA",(W,H),(26,22,38,255))
            img.paste(fimg,(0,0),fimg)
            frames.append(img.resize((W*8,H*8), Image.NEAREST).convert("P"))
        frames[0].save(f"walk_{name}_{facing}.gif", save_all=True, append_images=frames[1:], duration=110, loop=0)
print("gifs saved")
