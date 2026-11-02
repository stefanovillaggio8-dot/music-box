#!/usr/bin/env python3
"""Merge independently verified DJ metadata; no MP3 or PCM is committed."""
import argparse,datetime as dt,json,pathlib
p=argparse.ArgumentParser()
p.add_argument("--directory",required=True,type=pathlib.Path)
args=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
target=root/"dj-deep-analysis.json"
index=json.loads(target.read_text(encoding="utf8")) if target.exists() else {}
if index.get("version")!=1:index={"version":1,"entries":{}}
entries=index.setdefault("entries",{})
parts=list(sorted(args.directory.glob("dj-shard-*.json")))
if len(parts)!=12:raise SystemExit("expected 12 shard files, got "+str(len(parts)))
sources=set();source_count=set();shard_ids=set()
for file in parts:
 data=json.loads(file.read_text(encoding="utf8"))
 if data.get("version")!=1 or data.get("parts")!=12:raise SystemExit("bad shard "+file.name)
 shard=data["shard"]
 if shard in shard_ids:raise SystemExit("duplicate shard "+str(shard))
 shard_ids.add(shard)
 source_count.add(data["sourceCount"])
 for key,value in data["entries"].items():
  if key in sources:raise SystemExit("duplicate track "+key)
  sources.add(key)
  old=entries.get(key)
  # Preserve a successful previous analysis if a transient CDN failure
  # causes this run to fail for the exact same audio revision.
  if old and old.get("sha")==value.get("sha") and old.get("status")=="ok" and value["status"]!="ok":continue
  entries[key]=value
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
