export function speechView(input){
 const out=input.slice(),sr=16000;
 const filter=(frequency,high,reverse)=>{
  const w=2*Math.PI*frequency/sr,c=Math.cos(w),alpha=Math.sin(w)/(2*Math.SQRT1_2),a0=1+alpha;
  const b0=(high?(1+c):(1-c))/2/a0,b1=(high?-(1+c):(1-c))/a0,b2=b0,a1=-2*c/a0,a2=(1-alpha)/a0;
  let x1=0,x2=0,y1=0,y2=0;
  for(let n=0;n<out.length;n++){const i=reverse?out.length-1-n:n,x=out[i],y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;out[i]=y;x2=x1;x1=x;y2=y1;y1=y;}
 };
 for(const reverse of [false,true]){filter(120,true,reverse);filter(6000,false,reverse);}
 let peak=0;for(const x of out)peak=Math.max(peak,Math.abs(x));if(peak>.999)for(let i=0;i<out.length;i++)out[i]*=.999/peak;
 return out;
}
