import {build} from 'esbuild';
await build({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:process.cwd(),sourcefile:'supabase-browser.js'},bundle:true,platform:'browser',format:'esm',minify:true,target:'es2022',outfile:'public/vendor/supabase.js',legalComments:'linked'});
