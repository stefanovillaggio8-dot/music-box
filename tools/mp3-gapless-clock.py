"""SHA-bound offline MP3 priming/padding evidence; never rewrite audio."""
import hashlib,json,subprocess

def mp3_clock(file,source_sha):
    raw=file.read_bytes()
    if hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()!=source_sha:
        raise ValueError('MP3 clock source identity changed')
    d=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_streams','-of','json',str(file)]))
    streams=d['streams']
    if len(streams)!=1 or streams[0]['codec_name']!='mp3':raise ValueError('MP3 clock codec')
    rate=int(streams[0]['sample_rate']);packets=d['packets'];side=[s for p in packets for s in p.get('side_data_list',[]) if s.get('side_data_type')=='Skip Samples']
    priming=sum(s.get('skip_samples',0) for s in side);padding=sum(s.get('discard_padding',0) for s in side)
    frames=round(sum(float(p['duration_time']) for p in packets)*rate)
    if rate not in (44100,48000) or not 0<=priming<=rate*.1 or not 0<=padding<=rate*.1 or frames-priming-padding<rate*26:
        raise ValueError('Unbounded MP3 gapless metadata')
    return {'method':'original-mp3-gapless-metadata-v1','sourceSha':source_sha,'sampleRate':rate,'rawFrames':frames,
        'decodedFrames':frames-priming-padding,'primingFrames':priming,'paddingFrames':padding}
