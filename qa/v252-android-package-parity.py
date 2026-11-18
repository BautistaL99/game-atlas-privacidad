#!/usr/bin/env python3
"""Compare every byte in staged app/www, test APK and store-bound release AAB."""
import hashlib,json,sys,zipfile
from pathlib import Path
if len(sys.argv)!=5:
 raise SystemExit('usage: verify.py <app_dir> <www_dir> <apk> <aab>')
source,staged,apk_file,aab_file=map(Path,sys.argv[1:])
def sha(b):return hashlib.sha256(b).hexdigest()
files={p.relative_to(source).as_posix():p.read_bytes() for p in source.rglob('*') if p.is_file()}
files_staged={p.relative_to(staged).as_posix():p.read_bytes() for p in staged.rglob('*') if p.is_file()}
assert files.keys()==files_staged.keys(),f'Staging source file sets differ {set(files)^set(files_staged)}'
for p,data in files.items():
 assert files_staged[p]==data, f'Android staged asset differs from source: {p}'
with zipfile.ZipFile(apk_file) as apk,zipfile.ZipFile(aab_file) as aab:
 apk_files={n.removeprefix('assets/public/'):n for n in apk.namelist() if n.startswith('assets/public/') and not n.endswith('/')}
 aab_files={n.removeprefix('base/assets/public/'):n for n in aab.namelist() if n.startswith('base/assets/public/') and not n.endswith('/')}
 # Capacitor injects two Cordova compatibility bridge files while building.
 # They are NOT authored assets, and must be identical in both output formats.
 allowed_generated={'cordova.js','cordova_plugins.js'}
 src_names=set(files)
 apk_names=set(apk_files)
 aab_names=set(aab_files)
 assert src_names <= apk_names, f'APK missing source assets: {src_names-apk_names}'
 assert src_names <= aab_names, f'AAB missing source assets: {src_names-aab_names}'
 generated_apk=apk_names-src_names
 generated_aab=aab_names-src_names
 assert generated_apk==generated_aab, f'Extra generated assets differ between APK/AAB: {generated_apk ^ generated_aab}'
 assert generated_apk <= allowed_generated, f'Unexpected packaged assets: {generated_apk-allowed_generated}'
 for name in generated_apk:
  assert apk.read(apk_files[name])==aab.read(aab_files[name]), f'Generated bridge code differs: {name}'
 for name,expected in files.items():
  assert apk.read(apk_files[name])==expected,f'APK file bytes mismatch: {name}'
  assert aab.read(aab_files[name])==expected,f'AAB file bytes mismatch: {name}'
 media=[n for n in files if n.lower().endswith(('.png','.webp','.jpg','.jpeg','.svg','.gif'))]
 assert len(media)>=10, f'Unexpectedly few map/graphics assets: {len(media)}'
 info={"release":"Game Atlas V252", "parity_verified":True,"source_files":len(files),"media_files":len(media),"capacitor_generated_files":sorted(generated_apk),"all_apk_aab_assets_equal":True,"js_sha256":sha(files['app-v137.js']),"index_sha256":sha(files['index.html']),"map_image_sha256":sha(files['assets/leonida-yanis-v17.webp']),"monetization_sha256":sha(files['monetization-v250.js']),"apk_sha256":sha(apk_file.read_bytes()),"aab_sha256":sha(aab_file.read_bytes()),"signed_aab":False}
 print(json.dumps(info,indent=2,ensure_ascii=False))
