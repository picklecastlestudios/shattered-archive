# Generic procedural pixel-art sprite engine — extracted from the AI Blackbelt
# Challenge project and stripped of any game-specific character data. This is a
# STARTING POINT to copy into a new project's own generator script, not a
# library to import (each project ends up with its own CFG dict and its own
# builder functions for its own cast — keep them alongside the game they serve).
#
# What this file gives you for free, regardless of the new game's theme:
#   - a 30x40 pixel-grid canvas (C) with px/rect/disc/trap primitives
#   - hueshift(): rotates hue toward a target on a light/shadow ramp so ANY
#     base color you pick gets a consistent, good-looking 4-tone shading ramp
#     (highlight/base/shadow/deep) without hand-picking each tone
#   - shade(): walks the grid and applies top-left-light shading automatically
#   - outline(): auto-generates a dark silhouette outline from the filled grid
#   - a build(cfg, frame, key) dispatch pattern + JSON export, matched by the
#     splice convention below (see "Wiring into the game" in SKILL.md)
#
# What you MUST customize per project:
#   - the actual builder functions (the pug/bear/human-with-hats equivalents)
#   - the CFG dict mapping character keys -> build params
#   - canvas size/frame count if the new game's art scale differs
#
# Extension pattern for a "head=='X'" style variant (how Agent Cipher, the
# secret-agent sensei, was added to an existing human() builder without a new
# creature function): add one more `elif head=="yourkey":` branch that only
# draws the parts that differ (hat/hair/eyes/mouth), reusing the same body/
# torso/limb code every other variant shares. Do this whenever a new character
# is a reskin of an existing body plan; only write a whole new creature()-style
# function when the body plan itself is structurally different (e.g. quadruped
# vs biped).

import json
from PIL import Image, ImageDraw
import colorsys

W, H = 30, 40          # canvas size — bump for a higher-detail art scale
OUT = "#141019"        # outline color; pick something near-black in your palette

def hx(c):
    c = c.lstrip("#")
    if len(c) == 3: c = "".join(ch*2 for ch in c)
    return tuple(int(c[i:i+2], 16) for i in (0, 2, 4))

def sc(c, f):
    r, g, b = hx(c)
    if f >= 0: r, g, b = r+(255-r)*f, g+(255-g)*f, b+(255-b)*f
    else:      r, g, b = r*(1+f), g*(1+f), b*(1+f)
    return "#%02x%02x%02x" % (int(r), int(g), int(b))

def _to_hsl(h):
    h = h.lstrip("#")
    if len(h) == 3: h = "".join(c*2 for c in h)
    r, g, b = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    hh, l, ss = colorsys.rgb_to_hls(r, g, b)
    return hh*360, ss, l

def _from_hsl(hh, ss, l):
    r, g, b = colorsys.hls_to_rgb((hh % 360)/360, max(0, min(1, l)), max(0, min(1, ss)))
    return "#%02x%02x%02x" % (int(r*255), int(g*255), int(b*255))

def hueshift(c, dL, tH, dS, cap=16):
    """Shift color c toward hue tH by up to `cap` degrees (scaled by how
    saturated c already is — grays/whites barely rotate, saturated colors
    rotate fully), and nudge lightness/saturation by dL/dS. Use this instead
    of hand-picking highlight/shadow tones for every new base color."""
    h, s, l = _to_hsl(c)
    scale = max(0.0, min(1.0, s*1.6))
    d = ((tH-h+540) % 360) - 180
    d = max(-cap, min(cap, d))*scale
    return _from_hsl(h+d, s+dS*scale, l+dL)

class C:
    """Pixel-grid canvas. Build a character/object by drawing shapes with
    px/rect/disc/trap, then run shade() + outline() on the result."""
    def __init__(s): s.g = [[None]*W for _ in range(H)]
    def px(s, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H: s.g[y][x] = c
    def rect(s, x, y, w, h, c):
        for yy in range(int(y), int(y+h)):
            for xx in range(int(x), int(x+w)): s.px(xx, yy, c)
    def disc(s, cx, cy, rx, ry, c):
        for yy in range(int(cy-ry), int(cy+ry+1)):
            for xx in range(int(cx-rx), int(cx+rx+1)):
                if ((xx-cx)/rx)**2 + ((yy-cy)/ry)**2 <= 1.02: s.px(xx, yy, c)
    def trap(s, x0, x1, y0, y1, wtop, wbot, c):
        """Vertical trapezoid centered on (x0+x1)/2, width interpolating
        wtop->wbot top to bottom. Good for tapered ears, limbs, tails."""
        cx = (x0+x1)/2
        for yy in range(int(y0), int(y1)):
            t = (yy-y0)/max(1, (y1-y0)); w = wtop+(wbot-wtop)*t
            s.rect(cx-w/2, yy, w, 1, c)
    def poly(s, points, c):
        """Filled arbitrary polygon from a list of (x,y) points — for organic/
        asymmetric silhouettes that rect/disc/trap can't express (a cape, a
        wing, an irregular cloak edge). Anti-aliasing is intentionally OFF —
        this rasterizes to the hard pixel grid, matching every other
        primitive. Use sparingly relative to rect/disc/trap: most of a
        sprite should still read as simple geometric masses, per
        references/console-authenticity.md; poly is for the one or two
        silhouette features that genuinely need an irregular edge."""
        tmp = Image.new("L", (W, H), 0)
        ImageDraw.Draw(tmp).polygon(points, fill=1)
        px = tmp.load()
        for yy in range(H):
            for xx in range(W):
                if px[xx, yy]: s.px(xx, yy, c)
    def curve(s, points, c, width=1):
        """Smooth curve through 3+ control points (quadratic-Bezier chain,
        densely sampled then rasterized to the hard grid), for organic
        limb/armor/silhouette edges rect/disc/trap can't express — this is
        the GBA-tier primitive most likely to matter (see Step 0's console
        table in SKILL.md). width = stroke thickness in px."""
        tmp = Image.new("L", (W, H), 0)
        draw = ImageDraw.Draw(tmp)
        sampled = _bezier_chain(points, steps=max(20, W*2))
        if width <= 1:
            draw.line(sampled, fill=1)
        else:
            draw.line(sampled, fill=1, width=width)
        px = tmp.load()
        for yy in range(H):
            for xx in range(W):
                if px[xx, yy]: s.px(xx, yy, c)
    def dither(s, x, y, w, h, c1, c2, ratio=0.5, pattern="checker"):
        """Fill a rectangular region with an alternating two-color pattern
        that reads as a third, intermediate tone from normal viewing
        distance — the real technique SNES/GBA-era art used to extend
        perceived color depth without adding to the hard palette-ceiling
        count (see references/console-authenticity.md's dithering section).
        Only use at 32x32 canvas and above — it reads as noise at very
        small sizes. pattern: 'checker' (even 50/50 alternation) or
        'ordered' (density controlled by `ratio`, for a softer gradient
        edge between two tones)."""
        for yy in range(int(y), int(y+h)):
            for xx in range(int(x), int(x+w)):
                if pattern == "checker":
                    use_c1 = (xx+yy) % 2 == 0
                else:
                    use_c1 = ((xx*13 + yy*7) % 100) / 100 < ratio
                s.px(xx, yy, c1 if use_c1 else c2)

def _bezier_chain(points, steps=40):
    """Quadratic-Bezier interpolation through a list of 3+ points, treating
    each interior point as a control point between its neighbors' midpoints
    — a simple, dependency-free smooth-curve approximation (no scipy/numpy
    needed). Falls back to returning the raw points if fewer than 3 given."""
    if len(points) < 3:
        return points
    pts = [points[0]] + list(points) + [points[-1]]
    out = []
    for i in range(1, len(pts)-2):
        p0 = ((pts[i-1][0]+pts[i][0])/2, (pts[i-1][1]+pts[i][1])/2)
        p1 = pts[i]
        p2 = ((pts[i][0]+pts[i+1][0])/2, (pts[i][1]+pts[i+1][1])/2)
        for j in range(steps+1):
            t = j/steps
            x = (1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t**2*p2[0]
            y = (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t**2*p2[1]
            out.append((x, y))
    return out

def shade(cn):
    """Top-left-light auto-shader: for every filled pixel, look at its
    grid neighbors to decide whether it's a highlight edge (top/left exposed),
    a shadow edge (bottom/right exposed), a deep corner, or a contact-shadow
    pixel (different material directly above it), and recolor accordingly
    using hueshift-derived tones. Run this once per finished silhouette."""
    grid = cn.g
    def tones(c):
        return (hueshift(c, 0.13, 48, -0.04, 14), c,
                hueshift(c, -0.10, 300, 0.05, 16), hueshift(c, -0.20, 268, 0.08, 20))
    tcache = {}
    def T(c):
        if c not in tcache: tcache[c] = tones(c)
        return tcache[c]
    out = [row[:] for row in grid]
    for y in range(H):
        for x in range(W):
            c = grid[y][x]
            if c is None or c == OUT: continue
            hi, base, sh, deep = T(c)
            up    = grid[y-1][x] if y > 0 else None
            down  = grid[y+1][x] if y < H-1 else None
            left  = grid[y][x-1] if x > 0 else None
            right = grid[y][x+1] if x < W-1 else None
            if up is None or left is None:
                out[y][x] = hi
            elif down is None or right is None:
                out[y][x] = deep if (down is None and right is None) else sh
            elif up is not None and up != c and up != OUT:
                out[y][x] = sh
    return out

def outline(grid):
    """Auto-generate a 1px outline: any empty pixel adjacent to a filled one
    becomes OUT. Run this AFTER shade()."""
    f = [row[:] for row in grid]
    for y in range(H):
        for x in range(W):
            if grid[y][x] is not None: continue
            neighbors = [(x+1,y),(x-1,y),(x,y+1),(x,y-1)]
            if any(0 <= nx < W and 0 <= ny < H and grid[ny][nx] is not None
                   for nx, ny in neighbors):
                f[y][x] = OUT
    return f

def flip_grid(grid):
    """Horizontal mirror of a finished grid — build one facing direction and
    flip in code for the other rather than hand-drawing both (see
    references/animation-guide.md's 'Mirroring' section). Only hand-diverge
    a flipped pose if the design has an asymmetric feature that must stay on
    the correct side."""
    return [list(reversed(row)) for row in grid]

def grid_to_png(grid, path, scale=8):
    """Render a finished grid to a PNG (for visual review before shipping —
    always look at every new sprite/frame rendered, don't ship on code review
    alone)."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = img.load()
    for y in range(H):
        for x in range(W):
            c = grid[y][x]
            if c: px[x, y] = hx(c) + (255,)
    img = img.resize((W*scale, H*scale), Image.NEAREST)
    img.save(path)

def grid_to_datauri(grid):
    """Encode a finished grid as a base64 PNG data URI — this is the format
    spliced into the game's SPRITES JSON blob (see SKILL.md's splice
    convention)."""
    import io, base64
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = img.load()
    for y in range(H):
        for x in range(W):
            c = grid[y][x]
            if c: px[x, y] = hx(c) + (255,)
    buf = io.BytesIO(); img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

# --- Example scaffold: copy this pattern for a new game's own cast ---------
#
# CFG = {
#     "hero":   {"kind": "biped", "params": {...}},
#     "critter":{"kind": "quadruped", "params": {...}},
# }
#
# def build_biped(params, frame):
#     c = C()
#     # ... draw torso/head/limbs into c using c.rect/c.disc/c.trap ...
#     grid = outline(shade(c))   # shade() takes the C instance, not c.g
#     return grid
#
# def build(key, frame):
#     cfg = CFG[key]
#     grid = {"biped": build_biped, "quadruped": build_quadruped}[cfg["kind"]](cfg["params"], frame)
#     return grid_to_datauri(grid)
#
# sprites = {key: {frame: build(key, frame) for frame in ("idle0","idle1","attack")}
#            for key in CFG}
# json.dump(sprites, open("sprites.json", "w"))
