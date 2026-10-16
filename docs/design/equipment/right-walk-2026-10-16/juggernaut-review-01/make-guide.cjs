const fs=require('fs'),sharp=require('sharp');
const nearFeet=[[74,112],[67,112],[59,112],[52,112],[50,112],[58,106],[66,103],[72,107]],farFeet=[...nearFeet.slice(4),...nearFeet.slice(0,4)],hands=[51,55,62,69,73,69,62,55];
function knee(foot){const ax=62,ay=86,dx=foot[0]-ax,dy=foot[1]-ay,d=Math.hypot(dx,dy),h=Math.sqrt(Math.max(0,15*15-d*d/4));return [(ax+foot[0])/2+h*dy/d,(ay+foot[1])/2-h*dx/d]}
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 512 256"><rect width="512" height="256" fill="#203338"/>';
const phases=[];for(let n=0;n<8;n++){const x=n%4*128,y=Math.floor(n/4)*128,nf=nearFeet[n],ff=farFeet[n],nk=knee(nf),fk=knee(ff),nx=hands[n],fx=hands[(n+4)%8];phases.push({nearFoot:nf,farFoot:ff,nearWrist:[nx,86],farWrist:[fx,86]});svg+=`<g transform="translate(${x} ${y})"><path d="M8 115H120" stroke="#9c956a"/><path d="M62 48V86" stroke="#ddd" stroke-width="12"/>`;
for(const [foot,k,w,color]of [[ff,fk,fx,'#e57183'],[nf,nk,nx,'#4cdef7']])svg+=`<path d="M62 86L${k[0]} ${k[1]}L${foot[0]} ${foot[1]}h7 M62 59Q${w+3} 72 ${w} 86" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round"/><circle cx="${w}" cy="86" r="3" fill="${color}"/>`;
svg+='</g>'}svg+='</svg>';sharp(Buffer.from(svg)).png().toFile(__dirname+'/motion-guide.png');fs.writeFileSync(__dirname+'/motion-phases.json',JSON.stringify(phases,null,2));
