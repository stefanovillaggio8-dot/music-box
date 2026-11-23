"""Rejected candidate-only probe; never imported by the player or compiler.

Replay existing original posteriors for bounded current Ste targets. Missing
detector events may advance a metrical coordinate twice, but no PCM attack
or model beat is inserted. This does not recover a usable four-bar entrance.
"""
import argparse,hashlib,json,pathlib,subprocess,tempfile

ROOT=pathlib.Path(__file__).resolve().parents[2]
MODEL='8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331'

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for key in ('cases','edges','output'):p.add_argument('--'+key,required=True)
    args=p.parse_args();output=pathlib.Path(args.output)
    if output.exists():raise ValueError('Preserve existing evidence; choose a new output')
    with tempfile.TemporaryDirectory(prefix='musicbox-ste-phase-') as tmp:
        proof=pathlib.Path(tmp)/'scope.json'
        subprocess.run(['node','tools/ste-research-scope.cjs','--cases='+str(pathlib.Path(args.cases).resolve()),'--output='+str(proof)],cwd=ROOT,check=True,capture_output=True)
        valid=json.loads(proof.read_bytes())
    code=(ROOT/'tools/dj-structure-core.py').read_text()
    original={};exec(compile(code,'dj-structure-core.py','exec'),original)
    needle='values=np.clip(np.array([at(down_p,t,.02) for t in beats[lo:hi]]),.001,.999)'
    replacement='''gaps_local=np.diff(beats[lo:hi]);ref=float(np.median(gaps_local))
        slots=np.rint(gaps_local/ref).astype(int)
        valid=(slots>=1)&(slots<=2)&(np.abs(gaps_local/np.maximum(slots,1)-ref)<=ref*.2)
        left=index-lo;right=left
        while left>0 and valid[left-1]:left-=1
        while right+1<hi-lo and valid[right]:right+=1
        lo+=left;hi=lo+right-left+1
        if hi-lo<16:continue
        slots=np.rint(np.diff(beats[lo:hi])/ref).astype(int)
        positions=np.r_[0,np.cumsum(slots)];positions-=positions[index-lo]
        values=np.clip(np.array([at(down_p,t,.02) for t in beats[lo:hi]]),.001,.999)'''
    phase='(np.arange(lo,hi)-index-phase)%meter==0'
    if code.count(needle)!=1 or code.count(phase)!=1:raise ValueError('Owning source changed; do not silently adapt the experiment')
    candidate={};exec(compile(code.replace(needle,replacement).replace(phase,'(positions-phase)%meter==0'),'rejected-gap-probe','exec'),candidate)
    evidence=json.loads(pathlib.Path(args.edges).read_bytes())['entries'];rows=[]
    for key,sha in sorted({(c['to'],c['targetSha']) for c in valid['cases']}):
        e=evidence[key]
        if e['sha']!=sha or e['modelSha256']!=MODEL or e.get('analysisView','original')!='original':raise ValueError('Unbound original model evidence')
        r=e['intro']
        if r['frameStart']!=0 or r['frameStep']!=.02:raise ValueError('Only cached original introductions supported')
        inputs=(r['beats'],[],r['beatPosterior'],r['downbeatPosterior'],r['pcm']['onset'])
        old=original['measured_bars'](*inputs,sparse_candidates=True)
        new=candidate['measured_bars'](*inputs,sparse_candidates=True)
        rows.append({'key':key,'sha':sha,'before':old,'candidate':new})
    result={'method':'rejected-gap-aware-meter-coordinate-probe','newCertifiedPairs':0,'membershipEvidence':valid['scope']['membershipEvidence'],
            'coreSha256':hashlib.sha256(code.encode()).hexdigest(),'audioDecoded':0,'modelInferences':0,'rows':rows}
    output.parent.mkdir(parents=True,exist_ok=True);output.write_bytes((json.dumps(result,indent=2)+'\n').encode('utf8'))
    print(json.dumps([{'key':r['key'],'beforeBars':len(r['before']),'candidateBars':len(r['candidate'])} for r in rows]))

if __name__=='__main__':main()
