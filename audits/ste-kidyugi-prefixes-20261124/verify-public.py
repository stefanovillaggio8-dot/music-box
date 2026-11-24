"""Read-only exact public deployment verification; never publishes or changes cache."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, re, subprocess, sys, urllib.request
sha, output = sys.argv[1:]
assert re.fullmatch('[0-9a-f]{40}',sha)
output=Path(output);assert not output.exists(),'Preserve prior evidence'
files=['versione.json','index.html','app.js','mix-intelligente.js','sw.js','dj-deep-analysis.json','immersive.js','immersive-animation.js','immersive-scenes.js','word-karaoke.js','audio-composite-mix.js','audio-stretch.js','style.css','immersive-textures.webp']
def check(file):
    expected=subprocess.check_output(['git','show',sha+':'+file])
    url='https://stefanovillaggio8-dot.github.io/music-box/'+file+'?verified-release='+sha
    try:
        request=urllib.request.Request(url,headers={'Cache-Control':'no-cache'})
        with urllib.request.urlopen(request,timeout=40) as response:actual=response.read()
        digest=lambda b:hashlib.sha256(b).hexdigest()
        return file,{'bytes':len(actual),'expectedSha256':digest(expected),'publicSha256':digest(actual),'matches':actual==expected}
    except Exception as e:return file,{'matches':False,'error':str(e)}
with ThreadPoolExecutor(max_workers=4) as pool:assets=dict(pool.map(check,files))
report={'releaseVersion':'6.744','releasePR':94,'releaseMerge':sha,'assets':assets,'allMatch':all(r['matches'] for r in assets.values()),'physicalIPhone':False,'userDataWrites':False}
output.write_bytes((json.dumps(report,indent=2)+'\n').encode())
print(json.dumps({'allMatch':report['allMatch'],'assets':len(assets),'failures':[k for k,v in assets.items() if not v['matches']]}))
sys.exit(0 if report['allMatch'] else 1)
