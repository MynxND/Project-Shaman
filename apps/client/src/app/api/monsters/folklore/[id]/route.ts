import {readFile}from'node:fs/promises';
import {resolve}from'node:path';
import roster from'../../../../../../public/assets/monsters/folklore-01/roster.json';
/** Local art-review sources only. User input never becomes an arbitrary filesystem path. */
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const{id}=await params;if(!roster.monsters.some(m=>m.id===id))return new Response('Unknown specimen',{status:404});
 try{const bytes=await readFile(resolve(process.cwd(),'../../docs/design/monsters/folklore-01/raw',id,'source.png'));return new Response(bytes,{headers:{'Content-Type':'image/png','Cache-Control':'no-store'}});}catch{return new Response('Source is not available in this deployment',{status:404});}
}
