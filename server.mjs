import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {getSources} from './sources.mjs';
import {getResults} from './results.mjs';
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'};
const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/catalog.js':'catalog.js','/cameron.js':'cameron.js','/race-view.js':'race-view.js','/news-view.js':'news-view.js','/account.js':'account.js','/watchlist.js':'watchlist.js','/account-config.js':'account-config.js','/vendor/supabase.js':'vendor/supabase.js'};
const port=Number(process.env.PORT||3000);
http.createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  try {
    if(path==='/api/sources'||path==='/api/results'){
      if(req.method!=='GET'){res.writeHead(405,{Allow:'GET'});res.end('Method not allowed');return;}
      const data=path==='/api/results'?await getResults():await getSources();
      res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
      res.end(JSON.stringify(data));return;
    }
    const file=files[path];if(!file){res.writeHead(404);res.end('Not found');return;}
    const body=await readFile(new URL('./public/'+file,import.meta.url));
    res.writeHead(200,{'Content-Type':types[file.slice(file.lastIndexOf('.'))],'X-Content-Type-Options':'nosniff'});res.end(body);
  }catch{res.writeHead(500);res.end('Unable to load dashboard');}
}).listen(port,'127.0.0.1',()=>console.log('Valley Vote: http://127.0.0.1:'+port));
