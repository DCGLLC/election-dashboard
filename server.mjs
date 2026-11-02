import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {getSources} from './sources.mjs';
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'};
http.createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(path==='/api/sources'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(await getSources()));return;}const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};if(!files[path]){res.writeHead(404);res.end('Not found');return;}try{const file=files[path];res.writeHead(200,{'Content-Type':types[file.slice(file.lastIndexOf('.'))],'X-Content-Type-Options':'nosniff'});res.end(await readFile(new URL('./public/'+file,import.meta.url)));}catch{res.writeHead(500);res.end('Unable to load page');}}).listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('Valley Vote: http://127.0.0.1:3000'));
