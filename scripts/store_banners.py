"""App Store header (3840x1646) and search-result (1920x1280) images for the
Auaha apps, from each app's screenshots, icon and site colours.

    python3 scripts/store_banners.py [out_dir]

Needs Pillow and Inter.ttf (Google Fonts variable Inter) next to this script.
Paths are relative to ~/Development. Protein Grid has its own generator in
proteingrid/tool/store_screenshots/banners.py.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
DEV = os.path.dirname(os.path.dirname(HERE))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'store-banners')
INTER = os.path.join(HERE, 'Inter.ttf')


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def font(size, weight='Bold'):
    f = ImageFont.truetype(INTER, size)
    f.set_variation_by_name(weight)
    return f


def shot(path, crop=None):
    im = Image.open(os.path.join(DEV, path)).convert('RGB')
    return im.crop(crop) if crop else im


# Per app: colours (from each auaha.app page), copy, icon and screenshots.
APPS = {
    'contactphotos': dict(
        bg='#0a0f1e', accent='#38bdf8', accent2='#818cf8', text='#f1f5f9', muted='#94a3b8',
        name='Contact Photos',
        headline=["Know who's", 'texting you.'],
        sub=['Turn business texts into contacts', 'with their real logos.'],
        search=["Know who's", 'texting you.'],
        icon='auaha_web/icons/contactphotos.png',
        shots=[
            ('auaha_web/contactphotos/message_list.png', None),
            ('auaha_web/contactphotos/image_search.png', None),
            ('auaha_web/contactphotos/create_contact.png', None),
        ],
    ),
    'shoein': dict(
        bg='#1a1613', accent='#e08521', accent2='#fbbf24', text='#f7f4ef', muted='#b9ab98',
        name="Shoein'",
        headline=['Run your farrier', 'business from', 'the truck.'],
        sub=['Clients, horses, schedule, route', 'and invoices in one app.'],
        search=['The app built', 'for farriers.'],
        icon='auaha_web/icons/shoein.png',
        shots=[
            ('shoein/assets/store/apple/01.png', (125, 432, 1165, 2565)),
            ('shoein/assets/store/apple/04.png', (125, 432, 1165, 2565)),
            ('shoein/assets/store/apple/03.png', (125, 432, 1165, 2565)),
        ],
    ),
    'prior': dict(
        bg='#020d18', accent='#0ea5e9', accent2='#38bdf8', text='#f1f5f9', muted='#94a3b8',
        name='Prior',
        headline=['Water rights,', 'on the map.'],
        sub=['Utah · Colorado · Idaho.', 'Search an address or tap a parcel.'],
        search=['Water rights,', 'on the map.'],
        icon='auaha_web/icons/prior.png',
        shots=[
            ('auaha_web/prior/screenshots/map.png', None),
            ('auaha_web/prior/screenshots/water_rights.png', None),
            ('auaha_web/prior/screenshots/address.png', None),
        ],
    ),
    'threshold': dict(
        bg='#0a0f1e', accent='#6366f1', accent2='#a78bfa', text='#f1f5f9', muted='#94a3b8',
        name='Threshold',
        headline=['Buyer agreements,', 'signed at the door.'],
        sub=['Fill, sign and send on your phone', 'in under two minutes.'],
        search=['Buyer agreements,', 'signed at the door.'],
        icon='auaha_web/icons/threshold.png',
        shots=[
            ('auaha_web/threshold/screenshots/agreements.png', None),
            ('auaha_web/threshold/screenshots/signatures.png', None),
            ('auaha_web/threshold/screenshots/compensation.png', None),
        ],
    ),
    'functionalparenting': dict(
        bg='#0a0f2c', accent='#b1cdd9', accent2='#e3dfb7', text='#f4f5f8', muted='#a7b0cc',
        name='Functional Parenting',
        headline=['Calmer moments.', 'Stronger', 'relationships.'],
        sub=['Daily tips, scripts and tools', 'for the moments that matter.'],
        search=['Calmer moments.', 'Stronger relationships.'],
        icon='auaha_web/icons/functionalparenting.png',
        shots=[
            ('auaha_web/functionalparenting/screenshots/today.png', None),
            ('auaha_web/functionalparenting/screenshots/tools.png', None),
            # learn.png's title overlaps the status bar in this capture, so
            # FP shows two phones.
        ],
    ),
}


def background(w, h, bg, accent, glow_box):
    im = Image.new('RGB', (w, h), bg)
    glow = Image.new('RGB', (w, h), (0, 0, 0))
    ImageDraw.Draw(glow).ellipse(glow_box, fill=accent)
    glow = glow.filter(ImageFilter.GaussianBlur(w // 10))
    return Image.blend(im, glow, 0.22)


def rounded(img, radius):
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, *img.size], radius, fill=255)
    out = Image.new('RGBA', img.size)
    out.paste(img, (0, 0), mask)
    return out


def phone(im, s, cx, top, width, edge, tilt=0):
    h = int(s.height * width / s.width)
    r = int(width * 0.09)
    screen = rounded(s.resize((width, h), Image.LANCZOS), r)
    pad = max(10, width // 45)
    frame = Image.new('RGBA', (width + pad * 2, h + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle(
        [0, 0, frame.width - 1, frame.height - 1], r + pad,
        fill=(12, 12, 14, 255), outline=edge + (255,), width=max(3, width // 160),
    )
    frame.paste(screen, (pad, pad), screen)
    if tilt:
        frame = frame.rotate(tilt, resample=Image.BICUBIC, expand=True)
    x = cx - frame.width // 2
    shadow = Image.new('RGBA', im.size, (0, 0, 0, 0))
    sh = Image.new('RGBA', frame.size, (0, 0, 0, 170))
    sh.putalpha(frame.split()[3].point(lambda a: 170 if a else 0))
    shadow.paste(sh, (x + width // 30, top + width // 18), sh)
    shadow = shadow.filter(ImageFilter.GaussianBlur(width // 14))
    im.paste(shadow, (0, 0), shadow)
    im.paste(frame, (x, top), frame)


def paste_icon(im, path, x, y, size):
    icon = Image.open(os.path.join(DEV, path)).convert('RGBA').resize((size, size), Image.LANCZOS)
    icon = rounded(icon, int(size * 0.225))
    im.paste(icon, (x, y), icon)


def fit(d, text, size, weight, max_w):
    """The largest font at or under [size] that fits [text] in [max_w]."""
    while size > 20 and d.textlength(text, font=font(size, weight)) > max_w:
        size -= 4
    return font(size, weight)


def make(key, a):
    bg, accent, accent2 = hexc(a['bg']), hexc(a['accent']), hexc(a['accent2'])
    text, muted = hexc(a['text']), hexc(a['muted'])
    shots = [shot(p, c) for p, c in a['shots']]
    os.makedirs(OUT, exist_ok=True)

    # Header 3840x1646: icon + name, headline, sub on the left; phones right.
    W, H = 3840, 1646
    im = background(W, H, bg, accent, [W * 0.42, -H * 0.3, W * 1.1, H * 1.3])
    d = ImageDraw.Draw(im)
    paste_icon(im, a['icon'], 300, 250, 170)
    d.text((500, 335), a['name'], font=font(84, 'SemiBold'), fill=text, anchor='lm')
    lines = a['headline']
    size = 150 if len(lines) <= 2 else 132
    y = 560
    for line in lines:
        d.text((300, y), line, font=fit(d, line, size, 'ExtraBold', 1700), fill=text, anchor='lm')
        y += int(size * 1.12)
    y += 40
    for line in a['sub']:
        d.text((304, y), line, font=font(66, 'Medium'), fill=muted, anchor='lm')
        y += 86
    d.rounded_rectangle([300, 270 + 170 + 36, 420, 270 + 170 + 48], 6, fill=accent)
    if len(shots) >= 3:
        phone(im, shots[1], 2440, 300, 560, accent, tilt=5)
        phone(im, shots[2], 3480, 300, 560, accent, tilt=-5)
        phone(im, shots[0], 2960, 170, 620, accent2)
    else:
        phone(im, shots[1], 3330, 260, 580, accent, tilt=-4)
        phone(im, shots[0], 2650, 170, 620, accent2, tilt=3)
    im.save(os.path.join(OUT, f'{key}_header_3840x1646.png'), optimize=True)

    # Search result 1920x1280: icon, headline, sub; one phone.
    W, H = 1920, 1280
    im = background(W, H, bg, accent, [W * 0.4, -H * 0.2, W * 1.1, H * 1.2])
    d = ImageDraw.Draw(im)
    paste_icon(im, a['icon'], 130, 150, 130)
    d.text((290, 215), a['name'], font=font(56, 'SemiBold'), fill=text, anchor='lm')
    y = 440
    for line in a['search']:
        d.text((130, y), line, font=fit(d, line, 96, 'ExtraBold', 1000), fill=text, anchor='lm')
        y += 110
    y += 30
    for line in a['sub']:
        d.text((134, y), line, font=fit(d, line, 46, 'Medium', 1000), fill=muted, anchor='lm')
        y += 62
    d.rounded_rectangle([130, 330, 230, 340], 5, fill=accent)
    phone(im, shots[0], 1560, 90, 500, accent)
    im.save(os.path.join(OUT, f'{key}_search_1920x1280.png'), optimize=True)


for key, app in APPS.items():
    make(key, app)
    print('made', key)
