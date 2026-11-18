#!/usr/bin/env python3
"""Build a visual-only V18 map candidate from CC BY 4.0 GTADB tile files.
Never writes a signed manifest or modifies the deployed Game Atlas map.
The tile grid is not equivalent to the V17 percentage coordinate frame.
"""
import concurrent.futures
import hashlib
import io
import json
import pathlib
import urllib.request
from PIL import Image

MIN_X,MAX_X,MIN_Y,MAX_Y=5,24,5,25
OUTPUT=pathlib.Path("dist/map-v18-candidate")
OUTPUT.mkdir(parents=True,exist_ok=True)
BASE="https://raw.githubusercontent.com/rolux/gtadb.org/main"
SOURCE=f"{BASE}/maps/tiles/6/yanis%2C18/3/"
def tile(xy):
 x,y=xy
 url=f"{SOURCE}3%2C{x}%2C{y}.jpg"
 request=urllib.request.Request(url,headers={"User-Agent":"GameAtlas-MapCandidate-Review/1.0"})
 with urllib.request.urlopen(request,timeout=22) as response:
  raw=response.read()
 if len(raw)>150000 or len(raw)<100:
  raise ValueError(f"unexpected tile byte count {x},{y}: {len(raw)}")
 img=Image.open(io.BytesIO(raw))
 img.load()
 if img.mode not in ("RGB","RGBA"):
  img=img.convert("RGB")
 return x,y,img.copy(),len(raw)
pairs=[(x,y) for x in range(MIN_X,MAX_X+1) for y in range(MIN_Y,MAX_Y+1)]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 rows=list(pool.map(tile,pairs))
size={(im.width,im.height) for _,_,im,_ in rows}
if len(size)!=1:
 raise ValueError("Tile dimensions inconsistent")
w,h=size.pop()
if not(128<=w<=512 and 128<=h<=512):
 raise ValueError("Unexpected source tile dimensions")
canvas=Image.new("RGB",((MAX_X-MIN_X+1)*w,(MAX_Y-MIN_Y+1)*h),(15,19,26))
for x,y,img,_ in rows:
 canvas.paste(img,((x-MIN_X)*w,(y-MIN_Y)*h))
fname=OUTPUT/"gtadb-yanis-v18-CANDIDATE-NOT-DEPLOYED.webp"
canvas.save(fname,"WEBP",quality=83,method=6)
digest=hashlib.sha256(fname.read_bytes()).hexdigest()
assert len(rows)==420
meta={
 "status":"CANDIDATE_ONLY_NOT_APPROVED_OR_SIGNED",
 "source":"https://github.com/rolux/gtadb.org",
 "license":"CC BY 4.0 for GTADB map tiles and contributed data, subject to other rights",
 "sourceTiles":"maps/tiles/6/yanis,18/3/",
 "attribution":"GTA VI Map Tiles (CC BY 4.0) — https://map.gtadb.org",
 "image":fname.name,"sha256":digest,
 "size":[canvas.width,canvas.height],
 "grid":{"tileCount":len(rows),"x":[MIN_X,MAX_X],"y":[MIN_Y,MAX_Y],"tilePixelSize":[w,h]},
 "warning":"DO NOT upload as a remote map. Calibrate V18 coordinates and test personal markers, saved routes, map sheet interaction and all 3 platforms first."
}
(OUTPUT/"candidate-metadata.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(OUTPUT/"ATTRIBUTION.txt").write_text("GTA VI Map Tiles (CC BY 4.0) — https://map.gtadb.org\nhttps://github.com/rolux/gtadb.org/blob/main/LICENSE-DATA\nSource mosaics are fan reconstructions, not confirmed in-game coordinates.\n",encoding="utf-8")
print(json.dumps(meta,ensure_ascii=False,indent=2))
