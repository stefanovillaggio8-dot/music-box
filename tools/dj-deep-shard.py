#!/usr/bin/env python3
"""Analyze a deterministic shard of real published MP3s in GitHub Actions."""
import argparse, importlib.util, json, os, pathlib, tempfile, urllib.parse, datetime as dt
p=pathlib.Path(__file__).with_name("dj-deep-index.py")
spec=importlib.util.spec_from_file_location("musicbox_deep",p)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
a=argparse.ArgumentParser()
a.add_argument("--shard",type=int,required=True)
a.add_argument("--parts",type=int,default=12)
a.add_argument("--output",type=pathlib.Path,required=True)
opts=a.parse_args()
if opts.parts<1 or opts.parts>30 or opts.shard<0 or opts.shard>=opts.parts:
 raise SystemExit("invalid shard")
sources=m.catalog()
items=sorted(sources.items())
group=[x for i,x in enumerate(items) if i%opts.parts==opts.shard]
result={"version":m.VERSION,"shard":opts.shard,"parts":opts.parts,"sourceCount":len(sources),
        "entries":{}}
now=dt.datetime.now(dt.timezone.utc).isoformat()
good=failed=0
for key,item in group:
 url=f'https://raw.githubusercontent.com/{item["repo"]}/{item["branch"]}/'+urllib.parse.quote(item["path"])
 temp=None
 try:
  data=m.fetch(url,timeout=90)
  if len(data)<8192 or len(data)>24000000:raise ValueError("Invalid file size")
  with tempfile.NamedTemporaryFile(suffix=".mp3",delete=False) as f:
   temp=f.name;f.write(data)
  measured=m.analyze(temp)
  result["entries"][key]={"sha":item["sha"],"status":"ok","checkedAt":now,**measured}
  good+=1
 except Exception as err:
  result["entries"][key]={"sha":item["sha"],"status":"failed","checkedAt":now,
                          "reason":str(err)[:160]}
  failed+=1
 finally:
  if temp and os.path.exists(temp):os.unlink(temp)
opts.output.parent.mkdir(parents=True,exist_ok=True)
opts.output.write_text(json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
print(json.dumps({"shard":opts.shard,"of":opts.parts,"analyzed":good,
                  "errors":failed,"totalInShard":len(group)}),flush=True)
