// Export generated isolated artwork without inventing pixels or changing the original asset library.
import {readFile,writeFile} from 'node:fs/promises';
import {sharp,hash} from '../rig/body-eight-lib.mjs';
const root='docs/design/maps/shaman-village-01',pub='apps/client/public/assets/umbral';
const manifest=JSON.parse(await readFile(pub+'/manifest.json','utf8'));
const receipt={tool:'built-in imagegen',referenceSha256:hash(await readFile(root+'/reference.png')),assets:[]};
for(const [id,width]of [['sacred-totem',180],['thatched-hut',140],['thatched-lodge',180],['ritual-gate',140],['tropical-tree',140]]){
 const source=await readFile(`${root}/raw/${id}.png`);
 const trimmed=await sharp(source).trim({threshold:8}).toBuffer();
 const m=await sharp(trimmed).metadata();
 const out=await sharp(trimmed).resize(width,Math.round(m.height*width/m.width),{kernel:'nearest'}).png().toBuffer();
 const info=await sharp(out).metadata();
 const asset={image:`village-01/${id}.png`,width:info.width,height:info.height,anchor:{x:Math.floor(info.width/2),y:info.height-2},source:`docs/design/maps/shaman-village-01/raw/${id}.png`};
 await writeFile(`${pub}/${asset.image}`,out);manifest.objects['village-'+id]=asset;
 receipt.assets.push({id:'village-'+id,...asset,sourceSha256:hash(source),outputSha256:hash(out),sampling:'nearest',visualApproval:false});
}
await writeFile(pub+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile(root+'/asset-receipt.json',JSON.stringify(receipt,null,2)+'\n');
console.log('Exported five village assets with measured anchors; original asset records retained.');
