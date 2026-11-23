#!/usr/bin/env python3
"""Read-only diagnostic for the two actual Dimmi che c'e recordings.
Two independent Whisper model sizes, conservative exact-phrase matches.
The output is candidate timing evidence, not ground truth or a release.
"""
import hashlib, json, re, subprocess, sys, unicodedata
from pathlib import Path
from faster_whisper import WhisperModel

EXPECTED = {"64": "abbbbb004ea643ec9bde064f84cf95f1895a8417",
            "74": "042ee1ed88c72616f7c074a92210037322b810e1"}
def git_blob(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
def norm(text):
    return "".join(c for c in unicodedata.normalize("NFKD", text.casefold())
                   if c.isalnum() and not unicodedata.combining(c))
def tokenize(text):
    return [n for x in re.findall(r"[^\W_]+(?:['’][^\W_]+)*",text,flags=re.UNICODE)
            if (n := norm(x))]
def read_rows():
    data=json.loads(Path("lyrics.json").read_text(encoding="utf8"))["b-track-74"]
    rows=[]
    for line in data["synced"].splitlines():
        m=re.match(r"^\[(\d+):(\d+)(?:[.:](\d+))?\]\s*(.*)$",line)
        if m:
            t=int(m[1])*60+int(m[2])+float("0."+(m[3] or "0"))
            rows.append((t, tokenize(m[4])))
    assert len(rows)>=3 and all(a[0]<=b[0] for a,b in zip(rows,rows[1:]))
    return rows
def words(model, audio):
    segments, _ = model.transcribe(str(audio), language="it", task="transcribe",
        beam_size=5, word_timestamps=True, condition_on_previous_text=False,
        vad_filter=False, temperature=0.0)
    result=[]
    for seg in segments:
        for w in seg.words or []:
            k=tokenize(w.word)
            if len(k)==1 and w.start is not None and w.end is not None:
                result.append((k[0],float(w.start),float(w.end),float(w.probability)))
    return result
def match(rows, obs, i):
    t, tokens=rows[i]
    if len(tokens)<4 or len(set(tokens))<3:
        return None
    next_t=rows[i+1][0] if i+1<len(rows) else t+30
    hits=[]
    for j in range(len(obs)-len(tokens)+1):
        start=obs[j][1]
        if abs(start-t)>4: continue
        span=obs[j:j+len(tokens)]
        if [x[0] for x in span]!=tokens: continue
        if span[-1][2]>next_t+2 or any(x[3]<.5 for x in span): continue
        if any(y[1]<x[1] or y[1]-x[2]>1.4 for x,y in zip(span,span[1:])): continue
        hits.append(start)
    return hits[0] if len(hits)==1 else None
def main():
    rows=read_rows()
    source=Path(sys.argv[1]); out=Path(sys.argv[2])
    models=[WhisperModel(name,device="cpu",compute_type="int8",cpu_threads=2)
            for name in ("base","small")]
    report={"method":"exact full phrase, >=4 tokens, two ASR models agree <=180ms",
            "limitations":"ASR consensus is approximate; no independent human or acoustic ground truth.",
            "tracks":{}}
    for tid, sha in EXPECTED.items():
        audio=source/"songs"/f"track-{tid}.mp3"
        data=audio.read_bytes()
        if git_blob(data)!=sha: raise ValueError(f"Audio identity changed for {tid}")
        pcm=subprocess.check_output(["ffmpeg","-v","error","-i",str(audio),"-map","0:a:0",
            "-f","s16le","-acodec","pcm_s16le","-"])
        obs=[words(m,audio) for m in models]
        results=[]
        for i,(t,tokens) in enumerate(rows):
            a,b=(match(rows,o,i) for o in obs)
            if a is None or b is None or abs(a-b)>.18: continue
            proposed=round((a+b)/2,3)
            results.append({"row":i,"original":t,"candidate":proposed,
                "delta":round(proposed-t,3),"agreement":round(abs(a-b),3)})
        if any(a["candidate"]>=b["candidate"] for a,b in zip(results,results[1:])):
            raise ValueError("Nonmonotonic evidence")
        report["tracks"][tid]={"gitBlob":sha,"audioSha256":hashlib.sha256(data).hexdigest(),
            "decodedPcmSha256":hashlib.sha256(pcm).hexdigest(),
            "totalPhrases":sum(bool(t) for _,t in rows),
            "candidateCount":len(results),"candidates":results}
    report["sameDecodedPcm"]=report["tracks"]["64"]["decodedPcmSha256"]==report["tracks"]["74"]["decodedPcmSha256"]
    out.write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({k:{"candidateCount":v["candidateCount"],"totalPhrases":v["totalPhrases"]}
                      for k,v in report["tracks"].items()}))
    print("Same decoded PCM:",report["sameDecodedPcm"])
if __name__=="__main__":
    main()
