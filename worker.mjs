import {getSources} from './sources.mjs';
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if(path === '/api/sources') {
      if(request.method !== 'GET') return new Response('Method not allowed',{status:405,headers:{Allow:'GET'}});
      const cache = caches.default;
      const key = new Request(new URL('/api/sources',request.url),{method:'GET'});
      const hit = await cache.match(key);
      if(hit) return hit;
      const results=await getSources();
      const response=Response.json(results,{headers:{'Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'}});
      if(results.some(s=>s.status==='available')) await cache.put(key,response.clone());
      return response;
    }
    return env.ASSETS.fetch(request);
  }
};
