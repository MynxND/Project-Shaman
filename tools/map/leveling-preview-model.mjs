// The isolated review and its checks share terrain/collision geometry.
// These definitions are not registered in the authoritative gameplay MAPS.
export const UNIT=32, SPEED=4;
export function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p.y)!==(b[1]>p.y)&&p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export const inRect=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
export function distanceToLine(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],q=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a[0]-q*dx,p.y-a[1]-q*dy);}
export function paintContains(p,t){return t.shape==='rect'?inRect(p,t):t.shape==='circle'?Math.hypot(p.x-t.x,p.y-t.y)<=t.r:t.shape==='polygon'?inside(p,t.points):t.points.slice(1).some((b,i)=>distanceToLine(p,t.points[i],b)<=t.r);}
export function materialAt(map,x,y){let material=map.terrain.base;for(const t of map.terrain.paint)if(paintContains({x,y},t))material=t.terrain;return material;}
export function blocked(map,x,y){if(x<.5||y<.5||x>map.width-.5||y>map.height-.5)return true;const p={x,y};if(map.waterCollision&&materialAt(map,x,y)==='water')return true;
 if((map.blockers??[]).some(r=>inRect(p,r))||(map.npcs??[]).some(n=>inRect(p,{x:n.x-.4,y:n.y-.5,w:.8,h:.5})))return true;
 return map.objects.some(o=>o.footprint&&inRect(p,{x:o.x-o.footprint.w/2,y:o.y-o.footprint.h,w:o.footprint.w,h:o.footprint.h}));}
export function fogAllowed(map,zone,x,y){const p={x,y};if(!inRect(p,zone))return false;if((map.safeZones??[]).some(r=>inRect(p,r)))return false;
 if(map.graph.nodes.some(n=>Math.hypot(x-n.x,y-n.y)<2))return false;
 if(map.graph.edges.some(e=>e.points.slice(1).some((b,i)=>distanceToLine(p,e.points[i],b)<e.width/2+.5)))return false;
 if(map.locations.some(l=>Math.hypot(x-l.entrance.x,y-l.entrance.y)<2))return false;return true;}
// Half-unit grid finds real route lengths around footprints. The authored graph
// selects destinations; this search does not place buildings or compose maps.
export function findRoute(map,from,to){const w=map.width*2+1,h=map.height*2+1,a=[Math.round(from.x*2),Math.round(from.y*2)],b=[Math.round(to.x*2),Math.round(to.y*2)],start=a[1]*w+a[0],goal=b[1]*w+b[0],previous=new Int32Array(w*h).fill(-1),queue=[start];previous[start]=start;
 if(blocked(map,...a.map(v=>v/2))||blocked(map,...b.map(v=>v/2)))return null;
 for(let n=0;n<queue.length;n++){const current=queue[n];if(current===goal)break;const x=current%w,y=Math.floor(current/w);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ny*w+nx;if(nx<0||ny<0||nx>=w||ny>=h||previous[k]!==-1||[.25,.5,.75,1].some(t=>blocked(map,(x+dx*t)/2,(y+dy*t)/2)))continue;previous[k]=current;queue.push(k);}}
 if(previous[goal]===-1)return null;const path=[];for(let k=goal;;k=previous[k]){path.push([k%w/2,Math.floor(k/w)/2]);if(k===start)break;}path.reverse();const simplified=[path[0]];for(let i=1;i<path.length-1;i++){const a=path[i-1],b=path[i],c=path[i+1];if(b[0]-a[0]!==c[0]-b[0]||b[1]-a[1]!==c[1]-b[1])simplified.push(b);}if(path.length>1)simplified.push(path.at(-1));return{points:simplified,length:(path.length-1)*.5,seconds:(path.length-1)*.5/SPEED};}
