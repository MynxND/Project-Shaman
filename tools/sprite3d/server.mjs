// Read-only offline review server. Existing Pose Studio remains available on 8790.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root = resolve(import.meta.dirname, '../..');
const config = JSON.parse(await readFile(resolve(import.meta.dirname,'config.json')));
const output = resolve(root,config.output);
const types = {'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp'};
createServer(async(req,res) => {
  try {
    const url = new URL(req.url,'http://127.0.0.1');
    let base, file;
    if (url.pathname === '/') {base=import.meta.dirname;file=resolve(base,'preview.html');}
    else if (url.pathname === '/playback.mjs') {base=import.meta.dirname;file=resolve(base,'playback.mjs');}
    else if (url.pathname === '/reference.png') {base=root;file=resolve(root,config.reference);}
    else {base=output;file=resolve(output,'.'+decodeURIComponent(url.pathname));}
    if (!file.startsWith(base+sep) || !types[extname(file)]) throw new Error('Unavailable');
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)],'Cache-Control':'no-store'});res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(8792,'127.0.0.1',()=>console.log('3D sprite review http://127.0.0.1:8792'));
