"""Generate two original, differentiated news cover illustrations from existing
Game Atlas-owned SVG art. NEVER download or rehost Rockstar images.
Runs once in GitHub Actions, writes SHA-256-named PNGs for the signed V266 reader.
"""
from pathlib import Path
from io import BytesIO
import hashlib
import json
import math
from PIL import Image, ImageDraw, ImageFont
import cairosvg

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "app/assets/original"
DEST = ROOT / "updates/assets"
WIDTH, HEIGHT = 960, 540

def font(size, bold=True):
    candidates = (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"
        if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    )
    for file in candidates:
        if Path(file).is_file():
            return ImageFont.truetype(file, size)
    raise RuntimeError("No installed audit-safe font found")

def scene(svg_name):
    data = cairosvg.svg2png(
        bytestring=(SOURCE / svg_name).read_bytes(),
        output_width=1420,
        output_height=545
    )
    original = Image.open(BytesIO(data)).convert("RGB")
    return original.crop(((original.width-WIDTH)//2, 0, (original.width+WIDTH)//2, HEIGHT))

def make(kind):
    if kind not in ("album", "launch"):
        raise ValueError("Restricted to two existing verified official announcements")
    svg = "atlas-neon-coast-v219.svg" if kind == "album" else "atlas-marina-road-v219.svg"
    background = scene(svg)
    fade = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(fade)
    for x in range(WIDTH):
        alpha = max(25, (245-int(x/WIDTH*120)) if kind == "album" else (205-int(x/WIDTH*175)))
        draw.line(((x, 0), (x, HEIGHT)), fill=(3, 9, 26, alpha))
    image = Image.alpha_composite(background.convert("RGBA"), fade)
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    canvas = ImageDraw.Draw(layer)
    if kind == "album":
        cx, cy, radius = 735, 260, 196
        canvas.ellipse((cx-radius,cy-radius,cx+radius,cy+radius),
                       fill=(8,14,29,244),outline=(88,227,217,245),width=5)
        for groove in (180,169,157,145,133,121,109):
            canvas.arc((cx-groove,cy-groove,cx+groove,cy+groove),
                       20,340,fill=(95,134,170,110),width=2)
        canvas.ellipse((cx-76,cy-76,cx+76,cy+76),
                       fill=(95,41,108,255),outline=(253,166,195,220),width=5)
        canvas.ellipse((cx-7,cy-7,cx+7,cy+7),fill=(8,15,30,255))
        for i in range(65):
            xx = 545+i*4
            amplitude = 13+49*abs(math.sin(i*.34)*math.sin(i*.11+.1))
            canvas.rounded_rectangle((xx,465-amplitude/2,xx+2,465+amplitude/2),
                                     radius=1,fill=(90,237,209,160))
        title, caption = "MÚSICA Y GTA VI", "EL ÁLBUM · NOTICIA OFICIAL"
    else:
        canvas.rounded_rectangle((622,94,872,355),radius=32,
                                  outline=(116,229,206,210),width=5)
        canvas.rounded_rectangle((641,113,853,336),radius=22,fill=(11,38,54,120))
        canvas.text((657,138),"VI",font=font(125),fill=(241,254,244,210))
        title, caption = "GTA VI", "LANZAMIENTO · NOTICIA OFICIAL"
    image = Image.alpha_composite(image,layer)
    overlay = Image.new("RGBA",(WIDTH,HEIGHT),(0,0,0,0))
    canvas = ImageDraw.Draw(overlay)
    canvas.rounded_rectangle((43,38,240,78),radius=18,
                              fill=(3,32,47,220),outline=(76,221,210,190),width=2)
    canvas.text((59,48),"GAME ATLAS",font=font(20),fill=(166,244,233,255))
    canvas.text((47,188),title,font=font(52),fill=(253,253,254,255),
                stroke_width=1,stroke_fill=(9,21,36,180))
    canvas.rounded_rectangle((47,274,480,326),radius=12,fill=(11,46,61,208))
    canvas.text((61,287),caption,font=font(17),fill=(145,250,229,255))
    canvas.text((48,501),"ILUSTRACIÓN EDITORIAL · NO ES UNA FOTO DE ROCKSTAR",
                font=font(13,False),fill=(225,234,240,210))
    image = Image.alpha_composite(image,overlay).convert("RGB")
    output = BytesIO()
    image.save(output,format="PNG",optimize=True)
    data=output.getvalue()
    if not (2000<len(data)<500000) or not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise RuntimeError("Invalid or oversized original illustration")
    digest=hashlib.sha256(data).hexdigest()
    DEST.mkdir(parents=True,exist_ok=True)
    target=DEST/(digest+".png")
    target.write_bytes(data)
    return {"sha256":digest,"path":"updates/assets/"+digest+".png","bytes":len(data)}

if __name__ == "__main__":
    output={kind:make(kind) for kind in ("album","launch")}
    (ROOT/"automation/v266-news-illustrations-generated.json").write_text(
        json.dumps(output,sort_keys=True,indent=2)+"\n",encoding="utf-8"
    )
    print("ATLAS_OFFICIAL_NEWS_ART",json.dumps(output,sort_keys=True))
