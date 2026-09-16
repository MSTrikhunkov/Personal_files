'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os'),vm=require('vm');
const root=path.resolve(process.argv[2]),original=path.resolve(process.argv[3]);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'osd-production-hook-'));
const dest=path.join(tmp,'node_modules/nanoid');
const input=fs.readFileSync(path.join(root,'src/dev/build/tasks/install_dependencies_task.ts'),'utf8');
// Execute the actual task body with only the package-manager boundary mocked.
const js=input.replace(/^import .*;\n/gm,'').replace('export const InstallDependencies: Task =','const InstallDependencies =')+'\nmodule.exports=InstallDependencies;';
let installed=false;
const sandbox={module:{exports:{}},require,Project:{fromPath:async p=>{
 assert.strictEqual(p,tmp);
 return {installDependencies:async ({extraArgs})=>{
   assert(extraArgs.includes('--frozen-lockfile'));assert(extraArgs.includes('--production'));
   fs.mkdirSync(path.dirname(dest),{recursive:true});
   fs.cpSync(path.join(original,'nanoid-3.3.2/package'),dest,{recursive:true});installed=true;
 }};
}}};
(async()=>{
 try {
   vm.runInNewContext(js,sandbox);
   await sandbox.module.exports.run({resolveFromRepo:p=>path.join(root,p)},null,{resolvePath:()=>tmp});
   assert(installed);
   const n=require(dest);
   assert.strictEqual(n.customAlphabet('ab',0)(),'');
   assert.throws(()=>n.random(-1));
   require(path.join(root,'scripts/security_backports/apply.cjs')).apply(tmp,{check:true});
   console.log('PASS real production task patches freshly installed dependencies after install');
 } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
})().catch(e=>{console.error(e);process.exitCode=1;});
