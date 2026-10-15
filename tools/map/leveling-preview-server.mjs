// Local review only. Strict file roots; no authoring mutations or gameplay room.
import{createServer}from'node:http';import{readFile}from'node:fs/promises';import{resolve,extname,sep}from'node:path';import{createRequire}from'node:module';
const root=resolve('docs/design/maps/leveling-first-four'),pub=resolve('apps/client/public'),tool=resolve('tools/map');
const require=createRequire(resolve('apps/client/package.json'));const phaser=resolve(require.resolve('phaser'),'../../dist/phaser.min.js');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.md':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{try{const url=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);let file;
 if(url==='/')file=resolve(tool,'leveling-preview.html');else if(url==='/preview.js')file=resolve(tool,'leveling-preview.js');else if(url==='/model.mjs')file=resolve(tool,'leveling-preview-model.mjs');else if(url==='/phaser.js')file=phaser;
 else if(url==='/maps.json'||url==='/validation.json')file=resolve(root,url.slice(1));else if(/^\/new-monsters\/[a-z-]+\.png$/.test(url))file=resolve(root,'monsters',url.split('/').at(-1).replace('.png',''),'seed.png');
 else if(url.startsWith('/assets/')){file=resolve(pub,'.'+url);if(!file.startsWith(pub+sep))throw Error('path');}else throw Error('route');
 const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}}).listen(8793,'127.0.0.1',()=>console.log('Four-map preview http://127.0.0.1:8793/'));
