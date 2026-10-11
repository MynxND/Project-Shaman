import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const root = new URL('../../', import.meta.url);
export const stage = new URL('docs/design/character-v3/proportion-front-01/', root);
export const runtime = new URL('apps/client/public/assets/character-v3/proportion-front-01/', root);
const require = createRequire(new URL('apps/client/package.json', root));
export const sharp = createRequire(require.resolve('next'))('sharp');
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const palette = {
  outline: '#754c45', deep: '#996556', shadow: '#ba8067', shade: '#d79877',
  skin: '#eeb18c', light: '#f7c5a0', glow: '#ffdab6', blush: '#e5a08a', soft: '#dfac8b',
  ink: '#483c3f', iris: '#77584b', irisLight: '#b68a66', white: '#fff0d2',
  clothDark: '#303039', clothShade: '#45434d', cloth: '#5b5760', clothLight: '#767078',
};
export const variants = [
  { id: 'A', target: 3, top: 23, shoulder: 57, chest: 62, waist: 74, hip: 82, crotch: 89, knee: 98, elbow: 69, wrist: 76, hand: 80 },
  { id: 'B', target: 3.25, top: 15, shoulder: 49, chest: 55, waist: 69, hip: 80, crotch: 87, knee: 96, elbow: 63, wrist: 72, hand: 76 },
  { id: 'C', target: 3.5, top: 8, shoulder: 42, chest: 48, waist: 65, hip: 78, crotch: 85, knee: 94, elbow: 57, wrist: 68, hand: 72 },
];
export const headRows = [
  [57,66],[54,69],[52,71],[51,72],[50,73],[49,74],[48,75],[48,75],
  [47,76],[47,76],[47,76],[47,76],[47,76],[47,76],[46,77],[45,78],
  [45,78],[45,78],[45,78],[45,78],[46,77],[47,76],[48,75],[48,75],
  [49,74],[50,73],[52,71],[54,69],[56,67],[59,64],
];

export function painter(buffer, offsetY = 0) {
  const pixel = (column, row, color, clipped = false) => {
    row += offsetY;
    assert.ok(column >= 0 && column < 128 && row >= 0 && row < 128, 'Native pixel inside canvas');
    const index = (row * 128 + column) * 4;
    if (clipped && !buffer[index + 3]) return;
    const rgba = color.startsWith('#') ? color : palette[color];
    assert.ok(rgba, `Known color ${color}`);
    buffer[index] = parseInt(rgba.slice(1,3),16);
    buffer[index + 1] = parseInt(rgba.slice(3,5),16);
    buffer[index + 2] = parseInt(rgba.slice(5,7),16);
    buffer[index + 3] = 255;
  };
  const span = (row, left, right, color, clipped = false) => {
    for (let column = left; column <= right; column++) pixel(column,row,color,clipped);
  };
  const polygon = (points, color, clipped = false) => {
    const first = Math.min(...points.map(point => point[1]));
    const last = Math.max(...points.map(point => point[1]));
    for (let row = first; row <= last; row++) {
      const crossings = [];
      for (let edge = 0; edge < points.length; edge++) {
        const [leftX,leftY] = points[edge];
        const [rightX,rightY] = points[(edge + 1) % points.length];
        if ((leftY <= row + 0.5 && rightY > row + 0.5) || (rightY <= row + 0.5 && leftY > row + 0.5)) {
          crossings.push(leftX + (row + 0.5 - leftY) * (rightX - leftX) / (rightY - leftY));
        }
      }
      crossings.sort((left,right) => left - right);
      for (let edge = 0; edge + 1 < crossings.length; edge += 2) span(row,Math.ceil(crossings[edge]),Math.floor(crossings[edge + 1]),color,clipped);
    }
  };
  return { pixel, span, polygon };
}

export function authorHead() {
  const pixels = Buffer.alloc(128 * 128 * 4);
  const { pixel, span, polygon } = painter(pixels);
  headRows.forEach(([left,right],row) => {
    span(row,left,right,'outline');
    if (right - left > 2) span(row,left + 1,right - 1,'skin');
  });
  polygon([[57,1],[65,1],[71,4],[72,10],[70,14],[52,14],[49,11],[50,6]],'light',true);
  polygon([[55,2],[64,2],[68,4],[66,7],[53,8],[51,6]],'glow',true);
  polygon([[73,5],[76,9],[76,15],[74,20],[73,23],[69,26],[64,28],[64,29],[71,27],[75,23],[77,20],[77,12]],'shadow',true);
  polygon([[72,9],[75,11],[75,17],[72,17]],'shade',true);
  polygon([[50,13],[54,14],[55,23],[58,26],[65,27],[67,26],[71,24],[72,19],[73,21],[70,26],[64,29],[59,28],[53,25],[49,21]],'light',true);
  span(16,46,48,'shade'); span(17,46,47,'light'); span(18,46,48,'shadow'); span(19,47,48,'shade');
  span(16,75,77,'deep'); span(17,75,76,'skin'); span(18,75,76,'shadow'); span(19,75,76,'shade');
  span(12,51,55,'deep'); span(13,55,58,'shadow');
  span(12,68,71,'deep'); span(13,65,68,'shadow');
  span(15,50,55,'ink'); span(16,50,57,'ink');
  span(17,51,57,'white'); span(18,51,57,'white'); span(19,51,57,'white'); span(20,52,57,'white'); span(21,53,56,'shade');
  span(15,68,72,'ink'); span(16,65,72,'ink');
  span(17,65,71,'white'); span(18,65,71,'white'); span(19,65,71,'white'); span(20,65,70,'white'); span(21,66,69,'shade');
  for (const irisLeft of [53,66]) {
    span(17,irisLeft,irisLeft + 3,'iris'); span(18,irisLeft,irisLeft + 3,'iris');
    span(19,irisLeft,irisLeft + 3,'iris'); span(20,irisLeft,irisLeft + 3,'irisLight');
    span(21,irisLeft + 1,irisLeft + 2,'irisLight');
    pixel(irisLeft + 1,18,'ink'); pixel(irisLeft + 1,19,'ink');
    pixel(irisLeft,17,'white'); pixel(irisLeft + 1,17,'white');
  }
  span(22,50,53,'blush'); span(22,70,73,'blush');
  pixel(61,21,'shade'); pixel(61,22,'glow'); span(23,61,62,'shadow');
  span(25,59,63,'shadow'); span(26,60,63,'light'); span(27,59,64,'glow');
  return pixels;
}

export function bodyClusters(variant) {
  const { top, shoulder, chest, waist, hip, crotch, knee, elbow, wrist, hand } = variant;
  return [
    ['outline',[[49,crotch-5],[59,crotch-4],[59,knee-1],[56,106],[56,110],[52,113],[44,113],[43,111],[46,107],[47,knee],[47,hip]]],
    ['skin',[[50,crotch-4],[58,crotch-4],[58,knee],[54,107],[55,110],[51,112],[45,112],[44,111],[48,106],[49,knee]]],
    ['light',[[50,crotch],[54,crotch],[54,knee+1],[51,106],[48,109],[46,110],[49,104]]],
    ['shade',[[57,crotch],[59,crotch],[57,knee+1],[55,106],[54,109],[52,110],[52,106],[54,knee]]],
    ['outline',[[64,crotch-4],[74,crotch-5],[76,knee],[77,106],[80,110],[80,113],[70,113],[67,111],[67,106],[64,knee-1]]],
    ['skin',[[65,crotch-4],[73,crotch-4],[74,knee],[75,106],[78,110],[78,112],[71,112],[68,110],[69,106],[66,knee]]],
    ['light',[[66,crotch],[70,crotch],[71,knee],[72,107],[73,110],[70,110],[69,106],[67,knee]]],
    ['shade',[[72,crotch],[74,crotch],[76,knee],[77,106],[79,110],[78,112],[75,111],[74,106],[73,knee]]],
    ['outline',[[58,top+27],[66,top+27],[66,shoulder-3],[74,shoulder-1],[78,shoulder+2],[78,chest+3],[75,waist-3],[75,hip],[70,hip+3],[52,hip+3],[47,hip],[48,waist-3],[45,chest+2],[45,shoulder+2],[49,shoulder-1],[57,shoulder-3]]],
    ['skin',[[58,top+28],[65,top+28],[65,shoulder-2],[72,shoulder],[76,shoulder+2],[76,chest+2],[73,waist-3],[74,hip],[68,hip+2],[54,hip+2],[49,hip],[50,waist-3],[47,chest+2],[47,shoulder+2],[51,shoulder],[58,shoulder-2]]],
    ['light',[[49,shoulder+2],[56,shoulder],[60,shoulder+2],[69,shoulder+3],[70,chest+5],[68,waist-2],[68,waist],[53,waist],[51,chest+4]]],
    ['glow',[[50,shoulder+2],[56,shoulder],[59,shoulder+2],[56,chest],[50,chest]]],
    ['shade',[[70,shoulder+1],[76,shoulder+3],[75,chest+4],[73,waist-2],[74,hip],[69,hip+2],[68,waist],[70,chest+3]]],
    ['shadow',[[58,top+29],[65,top+29],[65,shoulder-2],[63,shoulder],[59,shoulder-1]]],
    ['outline',[[46,shoulder],[50,shoulder+2],[48,chest+4],[45,elbow],[44,wrist],[46,hand-1],[45,hand+4],[41,hand+5],[38,hand+3],[38,hand-1],[40,wrist-1],[41,elbow-2],[42,chest+1],[43,shoulder+3]]],
    ['skin',[[46,shoulder+1],[49,shoulder+3],[46,chest+5],[44,elbow],[43,wrist],[45,hand],[44,hand+3],[41,hand+4],[39,hand+2],[39,hand],[42,wrist],[42,elbow],[43,chest+1],[44,shoulder+3]]],
    ['light',[[45,shoulder+3],[47,shoulder+3],[44,elbow],[43,wrist-1],[41,wrist],[42,elbow],[43,chest+2]]],
    ['shade',[[47,chest+3],[48,chest+3],[45,elbow],[44,wrist],[45,hand],[44,hand+3],[43,hand+3],[42,wrist],[44,elbow]]],
    ['outline',[[74,shoulder+2],[78,shoulder],[81,shoulder+3],[82,chest+1],[82,elbow-2],[84,wrist-1],[86,hand-1],[86,hand+3],[83,hand+5],[79,hand+4],[78,hand-1],[80,wrist],[79,elbow],[76,chest+4]]],
    ['skin',[[75,shoulder+3],[78,shoulder+1],[80,shoulder+3],[81,chest+1],[81,elbow],[83,wrist],[85,hand],[85,hand+2],[83,hand+4],[80,hand+3],[79,hand],[82,wrist],[80,elbow],[77,chest+5]]],
    ['light',[[76,shoulder+3],[78,shoulder+2],[79,chest+2],[80,elbow],[82,wrist],[81,wrist],[79,elbow],[77,chest+4]]],
    ['shade',[[80,shoulder+3],[81,chest+2],[82,elbow],[84,wrist],[85,hand],[84,hand+3],[83,hand+3],[82,wrist],[81,elbow],[80,chest+3]]],
    ['clothDark',[[49,waist],[74,waist],[76,hip+3],[74,crotch+1],[64,crotch+1],[62,crotch-3],[59,crotch+1],[48,crotch+1],[47,hip+3]]],
    ['cloth',[[50,waist+2],[72,waist+2],[74,hip+3],[73,crotch-1],[65,crotch-1],[62,crotch-5],[58,crotch-1],[49,crotch-1],[49,hip+3]]],
    ['clothShade',[[66,waist+2],[73,waist+2],[74,hip+3],[72,crotch-1],[66,crotch-1],[63,crotch-5]]],
    ['clothLight',[[51,waist+3],[59,waist+3],[57,hip+1],[51,hip+3]]],
    ['clothShade',[[50,waist],[73,waist],[73,waist+2],[50,waist+2]]],
  ];
}

export function author(variant) {
  const pixels = Buffer.alloc(128 * 128 * 4);
  const { polygon, span, pixel } = painter(pixels);
  const clusters = bodyClusters(variant);
  for (const [color,points] of clusters) polygon(points,color);
  polygon([[52,variant.chest+1],[58,variant.chest+2],[64,variant.chest+2],[68,variant.chest],[68,variant.chest+4],[63,variant.chest+6],[55,variant.chest+5]],'light',true);
  span(variant.shoulder+3,54,57,'soft',true);
  span(variant.shoulder+4,66,69,'soft',true);
  span(variant.elbow,42,44,'soft',true);
  span(variant.elbow,79,81,'shade',true);
  span(variant.knee,50,53,'glow',true);
  span(variant.knee+1,50,53,'light',true);
  span(variant.knee,68,70,'light',true);
  span(variant.knee+1,68,71,'skin',true);
  span(110,46,51,'light'); span(111,45,52,'shade');
  span(110,70,76,'skin'); span(111,71,78,'shade');
  for (const column of [47,49,51]) pixel(column,112,'shadow');
  for (const column of [72,74,76]) pixel(column,112,'shadow');
  span(variant.hand,40,42,'light'); pixel(43,variant.hand,'shadow');
  span(variant.hand,81,83,'skin'); pixel(80,variant.hand,'shadow');
  pixel(40,variant.hand+2,'shade'); pixel(42,variant.hand+3,'shadow');
  pixel(84,variant.hand+2,'shadow'); pixel(82,variant.hand+3,'shade');
  const head = authorHead();
  for (let row = 0; row < 30; row++) {
    for (let column = 0; column < 128; column++) {
      const index = (row * 128 + column) * 4;
      if (head[index + 3]) head.copy(pixels,((row + variant.top) * 128 + column) * 4,index,index + 4);
    }
  }
  return { pixels, clusters };
}

export function measure(pixels) {
  const rows = [];
  let visible = 0;
  const colors = new Set();
  for (let row = 0; row < 128; row++) {
    let left = 128;
    let right = -1;
    for (let column = 0; column < 128; column++) {
      const index = (row * 128 + column) * 4;
      if (!pixels[index + 3]) { assert.equal(pixels.readUInt32BE(index),0); continue; }
      assert.equal(pixels[index + 3],255);
      visible++;
      colors.add(pixels.subarray(index,index+3).toString('hex'));
      left = Math.min(left,column); right = Math.max(right,column);
    }
    if (right >= 0) rows.push({ row,left,right,width:right-left+1 });
  }
  return { visible, paletteCount: colors.size, bounds: { minX: Math.min(...rows.map(row=>row.left)), maxX: Math.max(...rows.map(row=>row.right)), minY: rows[0].row, maxY: rows.at(-1).row }, rows };
}

export function replicate(pixels,width,height,factor) {
  const result = Buffer.alloc(width * height * factor * factor * 4);
  for (let row = 0; row < height * factor; row++) {
    for (let column = 0; column < width * factor; column++) {
      const source = (Math.floor(row/factor)*width+Math.floor(column/factor))*4;
      pixels.copy(result,(row*width*factor+column)*4,source,source+4);
    }
  }
  return result;
}

export const saveJson = async (url,value) => writeFile(url,JSON.stringify(value,null,2)+'\n');
export const savePng = async (url,pixels,width=128,height=128) => sharp(pixels,{raw:{width,height,channels:4}}).png().toFile(fileURLToPath(url));
export async function inventory(relative) {
  const records = {};
  async function visit(url,prefix) {
    for (const entry of await readdir(url,{withFileTypes:true})) {
      const child = `${prefix}${entry.name}`;
      if (entry.isDirectory()) await visit(new URL(`${entry.name}/`,url),`${child}/`);
      else records[child] = hash(await readFile(new URL(entry.name,url)));
    }
  }
  await visit(new URL(relative,root),relative);
  return records;
}

export async function buildProbe() {
  await mkdir(stage,{recursive:true});
  const frozenPath = new URL('v2-frozen.json',stage);
  const frozen = {...await inventory('docs/design/character-v2/'),...await inventory('apps/client/public/assets/character-v2/')};
  try { assert.deepEqual(JSON.parse(await readFile(frozenPath,'utf8')),frozen); }
  catch (error) { if (error.code !== 'ENOENT') throw error; await saveJson(frozenPath,frozen); }
  const variant = variants[0];
  const { pixels,clusters } = author(variant);
  const measurement = measure(pixels);
  assert.equal(measurement.bounds.minY,23);
  assert.equal(measurement.bounds.maxY,112);
  assert.equal(measurement.bounds.maxY-measurement.bounds.minY+1,90);
  assert.ok(measurement.visible>2000);
  assert.ok(measurement.bounds.minX>0 && measurement.bounds.maxX<127);
  await savePng(new URL('A.png',stage),pixels);
  await savePng(new URL('A-4x.png',stage),replicate(pixels,128,128,4),512,512);
  await saveJson(new URL('A-probe.json',stage),{variant,measurement,clusters,headRows,palette,method:'original manual integer clusters; no source-image sampling',visualApproved:false});
  const decoded = await sharp(await readFile(new URL('A.png',stage))).ensureAlpha().raw().toBuffer();
  assert.equal(Buffer.compare(decoded,pixels),0);
  console.log(`V3 A PROBE PASS: native128; head30x34; height90; baseline112; visible${measurement.visible}; palette${measurement.paletteCount}; original authored pixels, no V2 writes.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.includes('--probe'), 'Use --probe for the first A geometry check');
  await buildProbe();
}