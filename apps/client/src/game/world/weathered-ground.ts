// Hand-cut native-pixel brushes: broken turf lips, packed snow clumps and chipped paving.
// These select existing painted materials; they never synthesize texture colors or gameplay geometry.
const BRUSHES = [
 ['...##....','..####...','########.','.########','..#####..','...###...','...#.....'],
 ['....##...','...####..','.#######.','########.','..###.##.','...##....','....#....'],
 ['..##.....','.#####...','..#######','########.','###.###..','....##...','.....#...'],
 ['.....#...','...####..','..#######','.#######.','####.##..','.###.....','..#......'],
 ['...##....','.#####...','########.','..#######','...#####.','..##..#..','...#.....'],
];

/** Visual dry-ground edges only. Follow connected contours instead of placing texture details on a grid.
 * Strokes have unequal spacing and hand-cut silhouettes; untouched center strips keep routes readable.
 * Water cells and any change beyond 18 world pixels from a material boundary are excluded. */
export function weatherGroundEdges(source:Uint8Array,width:number,height:number){
 if(source.length!==width*height||width%2||height%2)throw new Error('Invalid ground mask');
 const w=width/2,h=height/2,n=w*h,base=new Uint8Array(n),border=new Uint8Array(n),seen=new Uint8Array(n),result=source.slice();
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)base[y*w+x]=source[(y*2+1)*width+x*2+1]!;
 const adjacent=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]as const;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const k=y*w+x,a=base[k]!;if(a===3)continue;for(const[dx,dy]of adjacent){const b=base[k+dy*w+dx]!;if(b!==a&&b!==3){border[k]=1;break;}}}
 let stroke=0;
 for(let start=0;start<n;start++){
  if(!border[start]||seen[start])continue;
  const stack=[start];seen[start]=1;let lastX=-100,lastY=-100;
  while(stack.length){const k=stack.pop()!,x=k%w,y=Math.floor(k/w);
   for(const[dx,dy]of adjacent){const xx=x+dx,yy=y+dy,q=yy*w+xx;if(xx>=0&&yy>=0&&xx<w&&yy<h&&border[q]&&!seen[q]){seen[q]=1;stack.push(q);}}
   if(Math.hypot(x-lastX,y-lastY)<[7,11,8,14,9][stroke%5]!)continue;
   const a=base[k]!,b=adjacent.map(([dx,dy])=>base[(y+dy)*w+x+dx]).find(v=>v!==undefined&&v!==a&&v!==3);if(b===undefined)continue;
   const low=Math.min(a,b),high=Math.max(a,b),ink=stroke%4===1?high:low,brush=BRUSHES[stroke%BRUSHES.length]!;
   lastX=x;lastY=y;stroke++;
   for(let by=0;by<brush.length;by++)for(let bx=0;bx<brush[by]!.length;bx++){
    if(brush[by]![bx]!== '#')continue;
    const xx=x+bx-4,yy=y+by-3;if(xx<0||yy<0||xx>=w||yy>=h)continue;
    const original=base[yy*w+xx];if(original!==a&&original!==b)continue;
    for(let py=0;py<2;py++)for(let px=0;px<2;px++){const q=(yy*2+py)*width+xx*2+px;if(source[q]!==3)result[q]=ink;}
   }
  }
 }
 return result;
}
