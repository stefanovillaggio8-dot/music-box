"""Read-only original spectral support for component-derived attacks.

Unmixers can invent cancelling transients. A component event is a hypothesis;
the ORIGINAL stereo spectrum must independently rise in the same bins.
These fixed study thresholds never replace playback certification.
"""
import numpy as np
from scipy.signal import stft

def magnitude(stereo,rate):
    x=np.asarray(stereo,dtype=np.float64)
    if x.ndim!=2 or x.shape[1]!=2 or not np.isfinite(x).all():raise ValueError('Finite original stereo required')
    matrices=[]
    for ch in range(2):
        f,t,z=stft(x[:,ch],fs=rate,nperseg=1024,noverlap=896,boundary='zeros',padded=True)
        matrices.append(np.abs(z))
    return f,t,np.sqrt((matrices[0]**2+matrices[1]**2)/2)

def support(original,component,rate,times):
    if np.asarray(original).shape!=np.asarray(component).shape:raise ValueError('No fitting offsets or changing component length')
    f,t,a=magnitude(original,rate);ff,tt,b=magnitude(component,rate)
    assert np.array_equal(t,tt) and np.array_equal(f,ff)
    band=(f>=35)&(f<=min(9000,rate*.45));a=a[band];b=b[band]
    da=np.maximum(0,a[:,2:]-np.mean(np.stack([a[:,:-2],a[:,1:-1]]),axis=0))
    db=np.maximum(0,b[:,2:]-np.mean(np.stack([b[:,:-2],b[:,1:-1]]),axis=0))
    at=t[2:];rows=[]
    for wanted in times:
        candidates=np.flatnonzero(np.abs(at-wanted)<=.06)
        if not len(candidates):continue
        j=int(candidates[np.argmax(np.linalg.norm(db[:,candidates],axis=0))])
        x,y=da[:,j],db[:,j];nx,ny=np.linalg.norm(x),np.linalg.norm(y)
        cosine=float(np.dot(x,y)/(nx*ny)) if nx>1e-12 and ny>1e-12 else 0.
        bins=y>=float(np.max(y))*.1
        original_support=float(np.sum(x[bins])/max(1e-12,np.sum(y[bins])))
        lo=max(0,round((at[j]-.04)*rate));hi=min(len(original),round((at[j]+.04)*rate))
        rms=float(np.sqrt(np.mean(np.asarray(original[lo:hi],np.float64)**2))) if hi>lo else 0.
        rows.append({'modelAt':float(wanted),'componentObservedAt':float(at[j]),'cosine':cosine,'originalFluxSupport':original_support,'originalRms':rms,
                     'originalSupported':bool(cosine>=.65 and original_support>=.50 and rms>=.001),'notACertificate':True})
    return rows

def reconstruction(original,stems):
    original=np.asarray(original,np.float64);summed=np.sum(np.asarray(stems,np.float64),axis=0)
    if original.shape!=summed.shape:raise ValueError('Unchanged source time axis required')
    error=summed-original;den=max(1e-12,float(np.sqrt(np.mean(original**2))))
    return {'relativeRmsError':float(np.sqrt(np.mean(error**2))/den),'maximumAbsoluteError':float(np.max(np.abs(error))),
            'reconstructionIsNotSourceIsolationProof':True}
