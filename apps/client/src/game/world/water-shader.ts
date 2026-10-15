// Sampling the existing illustrated water texture with native-pixel quantization, never random noise.
// Shore coverage is immutable and stays independent of the moving artwork beneath it.
export const WATER_FRAGMENT=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform vec2 resolution;
uniform vec2 uNative;
uniform float uElapsed;
uniform float uMode;
uniform float uRipple;
uniform float uShore;
uniform float uFall;
uniform vec2 uFlow;
uniform vec3 uTint;
uniform vec4 uRates;
uniform vec4 uRipple0;
uniform vec4 uRipple1;
uniform vec4 uRipple2;
uniform vec4 uRipple3;
varying vec2 outTexCoord;
float ring(vec2 p,vec4 site,float t){
 float phase=fract(t/site.z+site.w);
 float radius=phase*25.0;
 float d=length((p-site.xy)*vec2(1.0,1.65));
 return (1.0-step(1.2,abs(d-radius)))*(1.0-phase)*step(.08,phase);
}
void main(){
 vec2 uv=vec2(outTexCoord.x,1.0-outTexCoord.y);
 vec4 mask=texture2D(iChannel0,uv);
 if(mask.r<.5){gl_FragColor=vec4(0.0);return;}
 vec2 p=floor(uv*uNative)+.5;
 float encoded=floor(mask.b*255.0+.5);
 float code=floor(encoded/16.0),mode=uMode<0.0?floor(code/4.0):uMode;
 float narrow=step(8.0,mod(encoded,16.0));
 float direction=mod(code,4.0);
 vec2 flow=direction<.5?vec2(0.,1.):direction<1.5?vec2(1.,0.):direction<2.5?vec2(0.,-1.):vec2(-1.,0.);
 if(length(uFlow)>.1)flow=uFlow;
 float t=uElapsed;
 float shore=mod(floor(mask.g*255.0+.5),16.0)/15.0;
 float interaction=floor(floor(mask.g*255.0+.5)/16.0)/15.0;
 float tick=floor(t*8.0)/8.0;
 vec2 drift=flow*tick*uRates.x*(1.0+narrow*.35);
 if(mode>.5&&mode<1.5)drift=vec2(sin(t*uRates.y)*1.4,cos(t*uRates.y*.64)*1.1);
 if(mode>1.5&&mode<2.5)drift=vec2(sin(t*uRates.z),sin(t*uRates.z*.684))*.8;
 if(mode>2.5)drift=vec2(0.,tick*uRates.w);
 vec2 bend=vec2(sin(p.y*.09-t*.9),cos(p.x*.055+t*.65))*uRipple*(1.0+interaction*.6);
 vec2 sampleA=fract((p-floor(drift+bend))/16.);
 vec2 sampleB=fract((p+floor(drift*.37+vec2(5.,3.)))/16.);
 vec3 art=mix(texture2D(iChannel1,sampleA).rgb,texture2D(iChannel1,sampleB).rgb,.26);
 float detail=clamp((dot(art,vec3(.2,.5,.3))-.40)*8.0,0.0,1.0);
 float wave=sin(p.x*.055+p.y*.11-t*(mode>1.5?.3:.9));
 float crest=step(.965,wave)*uRipple;
 vec3 tint=mode>1.5&&mode<2.5?uTint*vec3(.65,.80,.72):uTint;
 vec3 color=tint*(.65+detail*.95)+vec3(.045,.075,.065)*crest;
 float rings=ring(p,uRipple0,t)+ring(p,uRipple1,t)+ring(p,uRipple2,t)+ring(p,uRipple3,t);
 color+=vec3(.19,.29,.26)*min(1.,rings)*uRipple;
 float foam=step(.65,sin(p.x*.13+p.y*.17-t*.7))*shore*uShore*.09;
 color+=vec3(.32,.40,.34)*foam;
 // Docks, reeds and rock shoulders use the same clock with a restrained local shimmer.
 color+=vec3(.08,.15,.12)*interaction*uRipple*(.5+.5*sin(p.x*.3+p.y*.2-t*1.2));
 if(uFall>.5){
  float phase=fract(tick*uRates.w/64.0),phaseB=fract(phase+.5);
  float weight=1.0-abs(phase*2.0-1.0);
  vec2 fuv=vec2(uv.x,fract(uv.y*.65-phase)*.65+.12);
  vec2 fuvB=vec2(uv.x,fract(uv.y*.65-phaseB)*.65+.12);
  vec3 fallArt=mix(texture2D(iChannel1,fuvB).rgb,texture2D(iChannel1,fuv).rgb,weight);
  color=mix(fallArt,color,.12);
  if(uv.y>.88)color=mix(color,texture2D(iChannel1,uv).rgb,.8);
 }
 else {
  vec2 reflectionUV=uv+floor(vec2(sin(t+p.y*.06),0.))/uNative;
  vec4 reflection=texture2D(iChannel2,reflectionUV);
  color=mix(color,reflection.rgb/max(reflection.a,.001),reflection.a*.12);
 }
 gl_FragColor=vec4(clamp(color,0.,1.),1.0);
}`;
