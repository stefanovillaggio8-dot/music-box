#!/usr/bin/env python3
"""Reconcile incremental deep-audio results with the current remote DJ index.
Only metadata is merged; no MP3s are touched.
"""
import json,pathlib,sys,datetime as dt
if len(sys.argv)!=3:
    raise SystemExit("usage: dj-deep-reconcile.py BATCH_JSON TARGET_JSON")
incoming=json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf8"))
target=pathlib.Path(sys.argv[2])
remote=json.loads(target.read_text(encoding="utf8")) if target.exists() else {}
if incoming.get("version")!=2:
    raise SystemExit("unexpected incoming analysis version")
if remote.get("version")!=2:
    remote={"version":2,"entries":{}}
records=remote.setdefault("entries",{})
changed=0
for key,entry in incoming.get("entries",{}).items():
    old=records.get(key)
    # Keep a successful analysis of the same file over a transient failure.
    if old and old.get("sha")==entry.get("sha") and old.get("status")=="ok" and entry.get("status")!="ok":
        continue
    # Do not overwrite an updated/replaced audio file with stale metadata
    # from an older runner.
    if old and old.get("checkedAt","")>entry.get("checkedAt",""):
        continue
    if old!=entry:
        records[key]=entry
        changed+=1
remote["sourceCount"]=max(int(remote.get("sourceCount") or 0),int(incoming.get("sourceCount") or 0))
remote["analyzed"]=sum(r.get("status")=="ok" for r in records.values())
remote["remaining"]=max(0,remote["sourceCount"]-remote["analyzed"])
remote["updatedAt"]=dt.datetime.now(dt.timezone.utc).isoformat()
target.write_text(json.dumps(remote,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
print(json.dumps({"merged":changed,"analyzed":remote["analyzed"],
                  "sourceCount":remote["sourceCount"],"remaining":remote["remaining"]}))
