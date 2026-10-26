/* SHA-256 en JavaScript pur (fonctionne aussi hors contexte sécurisé, ex. file://) */
export function sha256(str){const enc=new TextEncoder().encode(str),K=[],H=[];let p=2,n=0;const isP=x=>{for(let i=2;i*i<=x;i++)if(x%i===0)return false;return true};
 while(n<64){if(isP(p)){K[n]=(Math.cbrt(p)%1*4294967296)|0;if(n<8)H[n]=(Math.sqrt(p)%1*4294967296)|0;n++}p++}
 const l=enc.length,w=[],bl=l*8;const m=new Uint8Array(((l+9+63)>>6)<<6);m.set(enc);m[l]=128;const dv=new DataView(m.buffer);dv.setUint32(m.length-4,bl>>>0);dv.setUint32(m.length-8,Math.floor(bl/4294967296));
 const rr=(x,r)=>(x>>>r)|(x<<(32-r));for(let o=0;o<m.length;o+=64){for(let i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);for(let i=16;i<64;i++){const s0=rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3),s1=rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0}
  let[a,b,c,d,e,f,g,hh]=H;for(let i=0;i<64;i++){const S1=rr(e,6)^rr(e,11)^rr(e,25),ch=(e&f)^(~e&g),t1=(hh+S1+ch+K[i]+w[i])|0,S0=rr(a,2)^rr(a,13)^rr(a,22),mj=(a&b)^(a&c)^(b&c),t2=(S0+mj)|0;hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0}
  H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+hh)|0}
 return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')}
