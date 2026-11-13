#!/usr/bin/env python3
"""Download a fixed manual-reference benchmark; no lyrics/audio in Git.

Original annotations: JamendoLyrics, individually licensed recordings.
Model inference never receives reference word timestamps.
"""
import argparse,hashlib,json,pathlib,urllib.parse,urllib.request
REVISION='de188c963fd4539bc769b3feb83582e5a9595e36'
METADATA_SHA256='a214dbc7ca88fee4e41effa559502777365f5798e28ef585812e8413330be73b'
SELECTED={'Wordsmith_-_The_Statement':'rap-dense','JASON_MILLER_-_CROWD_PLEASER':'rap-dense',
 'Slingshot_Miracle_-_Whistler':'singing-sparse','Quentin_Hannappe_-_Keep_On':'singing-sparse',
 'Explosive_Ear_Candy_-_Like_The_Sun':'singing-fast'}
BASE='https://huggingface.co/datasets/jamendolyrics/jamendolyrics/resolve/'+REVISION+'/'
def get(name,limit):
    with urllib.request.urlopen(BASE+urllib.parse.quote(name,safe='/'),timeout=120) as response:content=response.read(limit+1)
    if len(content)>limit:raise ValueError('Reference download exceeds limit')
    return content
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',required=True);args=parser.parse_args()
    output=pathlib.Path(args.output);output.mkdir(parents=True,exist_ok=True)
    content=get('metadata.jsonl',16*1024*1024)
    if hashlib.sha256(content).hexdigest()!=METADATA_SHA256:raise ValueError('Manual reference annotations changed')
    records=[]
    for line in content.decode('utf8').splitlines():
        row=json.loads(line)
        if row['name'] not in SELECTED:continue
        row['benchmarkRole']=SELECTED[row['name']];target=output/(row['name']+'.mp3')
        if not target.exists():target.write_bytes(get(row['file_name'],32*1024*1024))
        row['audioSha256']=hashlib.sha256(target.read_bytes()).hexdigest();records.append(row)
    if len(records)!=len(SELECTED):raise ValueError('Missing manual references')
    (output/'references.json').write_text(json.dumps(records,ensure_ascii=False)+'\n',encoding='utf8')
    print(json.dumps({'recordings':len(records),'annotationRevision':REVISION,'roles':SELECTED}))
if __name__=='__main__':main()
