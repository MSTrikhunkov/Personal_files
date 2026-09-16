'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
const {apply}=require(path.resolve(process.argv[2],'scripts/security_backports/apply.cjs'));
const fixtures=path.resolve(process.argv[3]);
const original=path.resolve(process.argv[4]);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'osd-backport-'));
try {
  const dst=path.join(tmp,'packages/workspace/node_modules/parent/node_modules/nanoid');
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.cpSync(path.join(original,'nanoid-3.3.2/package'),dst,{recursive:true});
  const decoy=path.join(tmp,'packages/workspace/node_modules/parent/test-fixture/package.json');
  fs.mkdirSync(path.dirname(decoy),{recursive:true});
  fs.writeFileSync(decoy,'{"name":"lodash","version":"0.0.0"}');
  // Simulate hard-linked Yarn cache contents, plus a workspace symlink cycle.
  fs.unlinkSync(path.join(dst,'index.cjs'));
  fs.linkSync(path.join(original,'nanoid-3.3.2/package/index.cjs'),path.join(dst,'index.cjs'));
  fs.symlinkSync(tmp,path.join(tmp,'packages/workspace/cycle'));
  const cache=fs.readFileSync(path.join(original,'nanoid-3.3.2/package/index.cjs'),'utf8');
  assert.throws(()=>apply(tmp,{check:true}),/still need/);
  assert(apply(tmp).files>0);
  assert.strictEqual(fs.readFileSync(path.join(original,'nanoid-3.3.2/package/index.cjs'),'utf8'),cache);
  assert.strictEqual(apply(tmp).files,0);
  assert.strictEqual(apply(tmp,{check:true}).files,0);
  // Preflight failure must leave all valid files untouched.
  fs.cpSync(path.join(original,'nanoid-3.3.2/package'),dst,{recursive:true});
  fs.appendFileSync(path.join(dst,'index.js'),'\n// modified\n');
  assert.throws(()=>apply(tmp),/Unexpected content/);
  assert.strictEqual(fs.readFileSync(path.join(dst,'index.cjs'),'utf8'),cache);
  fs.writeFileSync(path.join(dst,'package.json'),'{"name":"nanoid","version":"0.0.0"}');
  assert.throws(()=>apply(tmp),/Unsupported/);
  apply(fixtures,{check:true});
  console.log('PASS ignores non-package fixture manifests; nested packages, cycle, hard-link cache safety, idempotence, check mode, preflight, unknown version');
} finally {fs.rmSync(tmp,{recursive:true,force:true});}
