import {cp,mkdir,writeFile,readFile} from 'node:fs/promises';
import {build} from 'esbuild';
await import('./build-browser.mjs');
await mkdir('release/pages',{recursive:true});
await cp('public','release/pages',{recursive:true});
await build({entryPoints:['worker.mjs'],bundle:true,platform:'browser',format:'esm',target:'es2022',conditions:['workerd','worker','browser'],outfile:'release/pages/_worker.js',minify:true,legalComments:'linked'});
await writeFile('release/pages/_routes.json',JSON.stringify({version:1,include:['/api/*'],exclude:[]},null,2)+'\n');
// Pages' CLI requires a standard-named config in its current project directory.
const config=JSON.parse(await readFile('wrangler.jsonc','utf8'));
config.pages_build_output_dir='.';
await writeFile('release/pages/wrangler.jsonc',JSON.stringify(config,null,2)+'\n');
