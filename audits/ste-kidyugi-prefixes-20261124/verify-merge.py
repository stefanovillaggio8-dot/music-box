"""Assert preservation against the TRUE first merge parent, not an old base."""
from pathlib import Path
import hashlib,json,re,subprocess,sys
sha,output=sys.argv[1:];assert re.fullmatch('[0-9a-f]{40}',sha)
output=Path(output);assert not output.exists()
parent=subprocess.check_output(['git','rev-parse',sha+'^1'],text=True).strip()
read=lambda ref,file:subprocess.check_output(['git','show',ref+':'+file])
protected=['word-karaoke.js','immersive.js','immersive-animation.js','immersive-scenes.js','immersive-textures.webp','style.css','audio-lyrics-align.js','audio-lyrics-worker.js','karaoke-acoustic-proof.js','playlist.json','stato.json','online-imports.json','audio-composite-mix.js','audio-stretch.js','audio-stretch-core.mjs','native-mp3-metadata.js','native-mp3-metadata.json','dj-lyric-boundaries.json','karaoke-index.json']
hashes={}
for file in protected:
    a,b=read(parent,file),read(sha,file);assert a==b,file;hashes[file]=hashlib.sha256(b).hexdigest()
assert read(parent,'app.js').replace(b'const APP_VERSION = "6.743";',b'const APP_VERSION = "6.744";')==read(sha,'app.js')
assert read(parent,'mix-intelligente.js').replace(b'musicBoxVersion:"6.743"',b'musicBoxVersion:"6.744"')==read(sha,'mix-intelligente.js')
a=json.loads(read(parent,'dj-deep-analysis.json'));b=json.loads(read(sha,'dj-deep-analysis.json'))
assert a.keys()==b.keys()
for k in a:
    if k!='entries':assert a[k]==b[k],k
assert a['entries'].keys()==b['entries'].keys()
for key in a['entries']:
    if key!='audio/songs/track-27.mp3':assert a['entries'][key]==b['entries'][key],key
old,new=a['entries']['audio/songs/track-27.mp3'],b['entries']['audio/songs/track-27.mp3']
assert {k:v for k,v in old.items() if k!='structuralBeatPlans'}=={k:v for k,v in new.items() if k!='structuralBeatPlans'}
for k,v in old['structuralBeatPlans'].items():assert new['structuralBeatPlans'][k]==v
added=set(new['structuralBeatPlans'])-set(old['structuralBeatPlans']);assert len(added)==4
for target in added:
    c=new['structuralBeatPlans'][target]['cue'];assert c['nativeCleanTail'] and not c['measuredFullBeat'] and not c['metricalRhythmic']
    assert c['entry']==0 and c['tempo']==1 and c['gain']==1
report={'releaseMerge':sha,'actualRollbackParent':parent,'unchangedSha256':hashes,'applicationAudioLogicUnchanged':True,'newCleanDirectedPlans':4,'otherRecordingEntriesUnchanged':len(a['entries'])-1,'userDataWrites':False,'physicalIPhone':False}
output.write_bytes((json.dumps(report,indent=2)+'\n').encode());print(json.dumps({'protectedFiles':len(hashes),'unchangedOtherEntries':len(a['entries'])-1,'newCleanPlans':4}))
