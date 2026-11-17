#!/usr/bin/env python3
"""Forensic original-vs-native windows; never installs a clock offset or certifies a mix."""
import argparse,hashlib,json,pathlib,subprocess
import numpy as np

def coherence(a,b):
    a=a.astype(np.float64);b=b.astype(np.float64)
    xx=float(np.sum(a*a));yy=float(np.sum(b*b));xy=float(np.sum(a*b))
    return {'correlation':xy/(xx*yy)**.5 if min(xx,yy)>1e-12 else None,
            'relativeRms':float(np.sqrt(np.sum((a-b)**2)/max(yy,1e-12)))}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for key in ['captures','original','output']:p.add_argument('--'+key,type=pathlib.Path,required=True)
    args=p.parse_args();raw=args.original.read_bytes();sha=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
    captures=[(f,json.loads(f.read_text(encoding='utf-8'))) for f in sorted(args.captures.rglob('capture.json'))]
    if not captures:raise ValueError('No actual native captures')
    for f,c in captures:
        if c.get('method')!='actual-native-source-window-v1' or c.get('sourceSha')!=sha or c.get('originalSha256')!=hashlib.sha256(raw).hexdigest():raise ValueError('Original/capture identity mismatch')
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_entries','stream=sample_rate','-of','json',str(args.original)]))
    source_rate=int(info['streams'][0]['sample_rate'])
    if source_rate not in [32000,44100,48000]:raise ValueError('Unstudied original MP3 rate')
    result={'method':'nominal-original-vs-actual-native-window-v1','sourceSha':sha,'originalSampleRate':source_rate,'decoderApi':'AudioContext.decodeAudioData','forensicOnly':True,'playbackCertified':False,
            'correctionApplied':False,'references':{},'captures':[]}
    for rate in [44100,48000]:
        pcm=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-threads','2','-i',str(args.original),'-ac','2','-ar',str(rate),'-f','f32le','pipe:1'])
        ref=np.frombuffer(pcm,dtype='<f4').reshape(-1,2);result['references'][str(rate)]={'frames':len(ref),'sha256':hashlib.sha256(pcm).hexdigest()}
        # An explicitly labelled fixed-delay HYPOTHESIS, never a search or a
        # value exported to runtime/certification. The original rate is read from the container.
        hypothesis=round(529*rate/source_rate)
        for file,c in captures:
            row=next(w for w in c['windows'] if w['sampleRate']==rate);data=(file.parent/row['file']).read_bytes()
            if hashlib.sha256(data).hexdigest()!=row['sha256'] or len(data)!=row['frames']*8 or row['startFrame']+row['frames']!=row['decodedSourceFrames']:raise ValueError('Native window bounds or bytes changed')
            native=np.frombuffer(data,dtype='<f4').reshape(-1,2);count=round(.5*rate);windows=[]
            for seconds in [.5,5,10]:
                lo=round(seconds*rate);at=row['startFrame']+lo
                if lo+count>len(native) or at+count+hypothesis>len(ref):raise ValueError('Incomplete independent comparison')
                a=native[lo:lo+count]
                windows.append({'secondsIntoCapturedWindow':seconds,'frames':count,'nominal':coherence(a,ref[at:at+count]),
                                'fixedCodecDelayHypothesisOnly':{'referenceOffsetFrames':hypothesis,**coherence(a,ref[at+hypothesis:at+hypothesis+count])}})
            result['captures'].append({'nativePlatform':c['nativePlatform'],'browser':c['browser'],'sampleRate':rate,
                                      'nativeWindowSha256':row['sha256'],'decodedSourceFrames':row['decodedSourceFrames'],'windows':windows})
    args.output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
    print(json.dumps([{'platform':c['nativePlatform'],'browser':c['browser'],'rate':c['sampleRate'],
                      'nominalCorrelations':[round(w['nominal']['correlation'],6) for w in c['windows']],
                      'hypothesisCorrelations':[round(w['fixedCodecDelayHypothesisOnly']['correlation'],6) for w in c['windows']]} for c in result['captures']]))
if __name__=='__main__':main()
