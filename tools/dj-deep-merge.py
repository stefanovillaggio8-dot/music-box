#!/usr/bin/env python3
"""Merge independently verified DJ metadata; no MP3 or PCM is committed."""
import argparse,datetime as dt,json,pathlib
from dj_metadata_merge import merge_basic_entry
p=argparse.ArgumentParser()
p.add_argument("--directory",required=True,type=pathlib.Path)
p.add_argument("--target",type=pathlib.Path,help="Explicit metadata target for isolated validation")
args=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
target=args.target or root/"dj-deep-analysis.json"
index=json.loads(target.read_text(encoding="utf8")) if target.exists() else {}
if index.get("version")!=2:index={"version":2,"entries":{}}
entries=index.setdefault("entries",{})
parts=list(sorted(args.directory.glob("dj-shard-*.json")))
if len(parts)!=12:raise SystemExit("expected 12 shard files, got "+str(len(parts)))
sources=set();source_count=set();shard_ids=set()
for file in parts:
 data=json.loads(file.read_text(encoding="utf8"))
 if data.get("version")!=2 or data.get("parts")!=12:raise SystemExit("bad shard "+file.name)
 shard=data["shard"]
 if shard in shard_ids:raise SystemExit("duplicate shard "+str(shard))
 shard_ids.add(shard)
 source_count.add(data["sourceCount"])
 for key,value in data["entries"].items():
  if key in sources:raise SystemExit("duplicate track "+key)
  sources.add(key)
  old=entries.get(key)
  entries[key]=merge_basic_entry(old,value)
if len(source_count)!=1:raise SystemExit("song catalogue changed during parallel run; use incremental reconciliation")
total=source_count.pop()
if len(sources)!=total:raise SystemExit("shard catalogue incomplete: "+str(len(sources))+" != "+str(total))
index["sourceCount"]=total
index["analyzed"]=sum(v.get("status")=="ok" for k,v in entries.items() if k in sources)
index["remaining"]=total-index["analyzed"]
index["updatedAt"]=dt.datetime.now(dt.timezone.utc).isoformat()
target.write_text(json.dumps(index,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
print(json.dumps({"sourceCount":total,"analyzed":index["analyzed"],
                  "unverified":index["remaining"],"shards":len(parts)}))
