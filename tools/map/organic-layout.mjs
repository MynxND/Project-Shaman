/** Round authored corners with bounded quadratic arcs; endpoints and world scale stay fixed. */
export function roundPolyline(points,radius=2,closed=false){
 const out=[];
 for(let i=0;i<points.length;i++){
  const b=points[i];if(!closed&&(i===0||i===points.length-1)){out.push([...b]);continue;}
  const a=points[(i+points.length-1)%points.length],c=points[(i+1)%points.length],ab=Math.hypot(a[0]-b[0],a[1]-b[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]);
  if(!ab||!bc){out.push([...b]);continue;}
  const d=Math.min(radius,ab/3,bc/3),p=b.map((v,j)=>v+(a[j]-v)*d/ab),q=b.map((v,j)=>v+(c[j]-v)*d/bc);
  for(let k=0;k<=6;k++){const t=k/6;out.push(b.map((v,j)=>(1-t)**2*p[j]+2*t*(1-t)*v+t*t*q[j]));}
 }
 return out;
}
export function softenPaths(map){for(const p of map.terrain.paint)if(p.shape==='path')p.points=roundPolyline(p.points,p.terrain==='water'?3:1.5);}
