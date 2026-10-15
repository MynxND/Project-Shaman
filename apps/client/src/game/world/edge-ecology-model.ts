import{isBlocked,pointInRect,terrainHeight,type MapDefinition}from'@shaman/shared';
import{rasterNativeTerrain}from'./native-terrain';
export interface EdgePlant{x:number;y:number;kind:'pebble'|'grass'|'sapling';variant:number}
/** Decorative contour reaches only. No mutation, grid placement, gameplay randomness or colliders. */
export function planEdgeEcology(map:MapDefinition){
 const S=4,r=rasterNativeTerrain(map,S),w=r.width,h=r.height,seen=new Uint8Array(w*h),border=new Uint8Array(w*h),items:EdgePlant[]=[],rejected:Record<string,number>={};
 const at=(x:number,y:number)=>x<0||y<0||x>=w||y>=h?false:!!r.water[y*w+x];
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)if(!at(x,y)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>at(x+dx!,y+dy!)))border[y*w+x]=1;
 const exclude=(x:number,y:number,kind:EdgePlant['kind'])=>{
  if(isBlocked(map,x,y)||[[-.35,0],[.35,0],[0,-.35],[0,.35]].some(([dx,dy])=>isBlocked(map,x+dx!,y+dy!)))return'support';
  if((kind==='sapling'&&!(map.id==='umbral-capital'&&x>9&&x<21&&y>7&&y<19)&&(map.safeZones??[]).some(s=>pointInRect({x,y},{x:s.x-1,y:s.y-1,w:s.w+2,h:s.h+2})))||(map.npcs??[]).some(n=>Math.hypot(n.x-x,n.y-y)<3)||(map.portals??[]).some(p=>Math.hypot(p.arrival.x-x,p.arrival.y-y)<4||pointInRect({x,y},{x:p.area.x-2,y:p.area.y-2,w:p.area.w+4,h:p.area.h+4})))return'service';
  if(map.objects.some(o=>o.footprint&&x>o.x-o.footprint.w/2-1&&x<o.x+o.footprint.w/2+1&&y>o.y-o.footprint.h-1&&y<o.y+1))return'footprint';
  if(map.elevation&&(map.elevation.transitions.some(t=>pointInRect({x,y},{x:t.x-1,y:t.y-1,w:t.w+2,h:t.h+2}))||[[-.6,0],[.6,0],[0,-.6],[0,.6]].some(([dx,dy])=>Math.abs(terrainHeight(map,x+dx!,y+dy!)-terrainHeight(map,x,y))>.05)))return'elevation';
  for(const p of map.terrain?.paint??[])if((p.terrain==='road'||p.terrain==='dirt')&&p.shape==='path')for(let i=1;i<p.points.length;i++){const a=p.points[i-1]!,b=p.points[i]!,dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)<p.r+.85)return'route';}
  return'';
 };
 const add=(x:number,y:number,kind:EdgePlant['kind'],variant:number)=>{const reason=exclude(x,y,kind);if(reason){rejected[reason]=(rejected[reason]??0)+1;return;}if(items.some(p=>Math.hypot(p.x-x,p.y-y)<.7))return;items.push({x,y,kind,variant});};
 let reach=0;
 for(let i=0;i<border.length&&items.length<150;i++){if(!border[i]||seen[i])continue;const stack=[i];seen[i]=1;let lx=-100,ly=-100;
  while(stack.length&&items.length<150){const k=stack.pop()!,x=k%w,y=Math.floor(k/w);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const xx=x+dx!,yy=y+dy!,q=yy*w+xx;if(xx>0&&yy>0&&xx<w-1&&yy<h-1&&border[q]&&!seen[q]){seen[q]=1;stack.push(q);}}
   if(Math.hypot(x-lx,y-ly)<[16,23,19,27][reach%4]!)continue;lx=x;ly=y;const xx=(x+.5)/S,yy=(y+.5)/S;
   // Landward offset selected from the actual local bank normal, then a small authored cluster.
   const nx=Number(at(x-1,y))-Number(at(x+1,y)),ny=Number(at(x,y-1))-Number(at(x,y+1)),len=Math.hypot(nx,ny)||1,bx=xx+nx/len*.75,by=yy+ny/len*.75;
   const cluster=[[.65,.4,-.85,.75],[-.7,.3,.8,-.65],[.3,-.8,-.9,-.4],[.9,-.1,-.6,.85]][reach%4]!;add(bx,by,'pebble',reach);add(bx+cluster[0]!,by+cluster[1]!,'grass',reach);if(reach%3===0)add(bx+cluster[2]!,by+cluster[3]!,'sapling',reach);reach++;
  }
 }
 return{items,rejected};
}
