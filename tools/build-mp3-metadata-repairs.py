#!/usr/bin/env python3
"""Offline metadata-only MP3 candidates; never change original audio frames.

A candidate is exported only if ffmpeg decodes byte-identical float PCM at
44.1 AND 48 kHz. Browser validation is still required before runtime use.
"""
import argparse, base64, hashlib, json, pathlib, subprocess

def audio_offset(data):
    if data[:3] != b'ID3':
        return 0
    if len(data) < 10 or any(v & 128 for v in data[6:10]):
        raise ValueError('Invalid ID3 size')
    return 10+sum(v << shift for v, shift in zip(data[6:10], (21, 14, 7, 0)))+(10 if data[5] & 16 else 0)

def frame_size(data, offset):
    word = int.from_bytes(data[offset:offset+4], 'big')
    version, layer, rate = (word >> 19) & 3, (word >> 17) & 3, (word >> 10) & 3
    if word >> 21 != 2047 or version == 1 or layer != 1 or rate == 3:
        raise ValueError('Unsupported MPEG Layer III header')
    rates = [44100, 48000, 32000]
    sr = rates[rate] // (1 if version == 3 else 2 if version == 2 else 4)
    table = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0] if version == 3 else [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0]
    bitrate = table[(word >> 12) & 15]
    if not bitrate:
        raise ValueError('Unsupported free bitrate')
    return (144000 if version == 3 else 72000)*bitrate//sr+((word >> 9) & 1)

def decoded(file, sr):
    process = subprocess.Popen(['ffmpeg','-nostdin','-v','error','-threads','2','-i',str(file),'-ac','2','-ar',str(sr),'-f','f32le','pipe:1'], stdout=subprocess.PIPE)
    digest, size = hashlib.sha256(), 0
    while True:
        chunk = process.stdout.read(1024*1024)
        if not chunk:
            break
        digest.update(chunk)
        size += len(chunk)
    if process.wait():
        raise ValueError('Original decode failed')
    return {'sha256':digest.hexdigest(), 'bytes':size}

def candidate(source, entry, work):
    raw = source.read_bytes()
    if hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest() != entry['sha']:
        raise ValueError('Original source changed')
    offset = audio_offset(raw)
    size = frame_size(raw, offset)
    if b'Info' in raw[offset:offset+size] or b'Xing' in raw[offset:offset+size]:
        return None
    remux = work/(entry['sha']+'-remux.mp3')
    subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(source),'-map','0:a:0','-c:a','copy','-id3v2_version','3','-write_xing','1',str(remux)],check=True)
    wrapped = remux.read_bytes();at = audio_offset(wrapped);length = frame_size(wrapped, at)
    if wrapped[at+length:] != raw[offset:]:
        raise ValueError('Remux changed original frame payload')
    prefix = bytearray(wrapped[at:at+length]);info = prefix.find(b'Info')
    if info < 0:
        info = prefix.find(b'Xing')
    if info < 0:
        raise ValueError('Missing complete frame-count header')
    flags = int.from_bytes(prefix[info+4:info+8], 'big');cursor = info+8
    for bit, count in [(1,4),(2,4),(4,100),(8,4)]:
        if flags & bit:
            cursor += count
    if cursor+36 > len(prefix):
        raise ValueError('Truncated encoder extension')
    # The original has no declared gapless trim. A synthetic Lavf tag would
    # invent a 529-sample skip; keep that extension explicitly absent.
    prefix[cursor:cursor+36] = b'\0'*36
    fixed = raw[:offset]+prefix+raw[offset:];target = work/(entry['sha']+'-candidate.mp3');target.write_bytes(fixed)
    pcm = {}
    for sr in [44100,48000]:
        before, after = decoded(source,sr), decoded(target,sr)
        if before != after:
            raise ValueError('Metadata candidate changes decoded PCM')
        pcm[str(sr)] = before
    return {'method':'mp3-frame-count-prefix-identical-pcm-v1','sourceSha':entry['sha'],
        'sourceSha256':hashlib.sha256(raw).hexdigest(),'sourceBytes':len(raw),'duration':entry['duration'],
        'insertAt':offset,'prefixBase64':base64.b64encode(prefix).decode(),'wrappedSha256':hashlib.sha256(fixed).hexdigest(),
        'wrappedBytes':len(fixed),'pcmIdentity':pcm,'browserVerified':False}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for key in ['index','keys','cache','work','output']:
        parser.add_argument('--'+key,type=pathlib.Path,required=True)
    args=parser.parse_args();index=json.loads(args.index.read_text(encoding='utf-8-sig'))['entries'];keys=json.loads(args.keys.read_text(encoding='utf-8-sig'))
    args.work.mkdir(parents=True,exist_ok=True);entries={};errors=[]
    for key in keys:
        try:
            record=candidate(args.cache/(index[key]['sha']+'.mp3'),index[key],args.work)
            if record:
                entries[key]=record
            print(json.dumps({'key':key,'candidate':record is not None}),flush=True)
        except (ValueError,OSError,subprocess.SubprocessError) as error:
            errors.append({'key':key,'error':str(error)})
    args.output.write_bytes((json.dumps({'version':1,'entries':entries,'errors':errors},indent=2)+'\n').encode('utf8'))
    if errors:
        raise SystemExit(1)
if __name__=='__main__':
    main()
