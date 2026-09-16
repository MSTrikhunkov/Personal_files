'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
const root = path.resolve(process.argv[2]);
let failures = 0, checks = 0;
async function test(name, fn) {
  checks++;
  try { await fn(); console.log('PASS', name); }
  catch (e) { failures++; console.log('FAIL', name, e.message); }
}
function child(code, timeout = 1500) {
  const r = spawnSync(process.execPath, ['-e', code], { timeout, encoding: 'utf8' });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 0, r.stderr);
}
(async () => {
  for (const ver of ['3.13.1', '3.14.1', '4.1.0']) {
    const pkg = path.join(root, `js-yaml-${ver}/node_modules/js-yaml`);
    for (const rel of [ver[0] === '3' ? 'lib/js-yaml/type/omap.js' : 'lib/type/omap.js', 'dist/js-yaml.js', 'dist/js-yaml.min.js', ...(ver[0] === '4' ? ['dist/js-yaml.mjs'] : [])]) {
      await test(`yaml ${ver} ${rel} linear uniqueness + semantics`, () => {
        const source = fs.readFileSync(path.join(pkg, rel), 'utf8');
        if (rel.startsWith('lib/')) {
          const resolver = require(path.join(pkg, rel)).resolve;
          assert(resolver([{one: 1}, {two: 2}]));
          assert(!resolver([{one: 1}, {one: 2}]));
          assert(resolver(null)); assert(resolver([]));
          assert(!resolver([{}])); assert(!resolver([{a: 1, b: 2}]));
          assert(resolver([JSON.parse('{"__proto__":1}'), {constructor: 2}]));
          const original = Array.prototype.indexOf;
          let calls = 0;
          Array.prototype.indexOf = function (...args) { calls++; return original.apply(this,args); };
          try { assert(resolver(Array.from({length: 3000}, (_, i) => ({['k'+i]: i})))); }
          finally { Array.prototype.indexOf = original; }
          assert.strictEqual(calls, 0, 'linear search per key is still used');
        } else {
          // Exercise the browser distributions without loading argparse/esprima.
          const sandbox = { module: {exports:{}}, exports: {} };
          sandbox.exports = sandbox.module.exports;
          let indexCalls = 0;
          vm.createContext(sandbox);
          vm.runInContext('var oldIndexOf = Array.prototype.indexOf; Array.prototype.indexOf = function () { return oldIndexOf.apply(this, arguments); };', sandbox);
          if (rel.endsWith('.mjs')) return; // ESM is exercised separately below.
          vm.runInContext(source, sandbox);
          const yaml = sandbox.module.exports;
          assert.deepStrictEqual(JSON.parse(JSON.stringify(yaml.load('!!omap\n- a: 1\n- b: 2'))), [{a:1},{b:2}]);
          assert.throws(() => yaml.load('!!omap\n- a: 1\n- a: 2'));
          vm.runInContext('var indexCalls = 0; Array.prototype.indexOf = function () { indexCalls++; return oldIndexOf.apply(this, arguments); };', sandbox);
          yaml.load('!!omap\n' + Array.from({length: 1000},(_,i)=>`- k${i}: ${i}`).join('\n'));
          indexCalls = vm.runInContext('indexCalls', sandbox);
          assert(indexCalls < 100, `quadratic key scan: ${indexCalls} indexOf calls`);
        }
      });
    }
    if (ver[0] === '4') await test('yaml ESM omap', async () => {
      const yaml = await import(pathToFileURL(path.join(pkg,'dist/js-yaml.mjs')));
      assert.deepStrictEqual(yaml.load('!!omap\n- a: 1'), [{a:1}]);
      assert.throws(()=>yaml.load('!!omap\n- a: 1\n- a: 2'));
    });
  }
  for (const rel of ['lodash.js', 'lodash.min.js', 'unset.js', 'fp/unset.js']) {
    await test('lodash prototype protection ' + rel, () => child(`
      const assert=require('assert'); const mod=require(${JSON.stringify(path.join(root,'lodash-4.17.21/node_modules/lodash',rel))});
      const unset = typeof mod.unset === 'function' ? mod.unset : ${JSON.stringify(rel)}.startsWith('fp/') ? (o,p)=>mod(p,o) : mod;
      for (const p of ['__proto__.securitySentinel', 'constructor.prototype.securitySentinel', [['__proto__'],'securitySentinel'], ['nested','__proto__','securitySentinel']]) {
        Object.prototype.securitySentinel=123; unset({nested:{}},p);
        assert.strictEqual(Object.prototype.securitySentinel,123); delete Object.prototype.securitySentinel;
      }
      const obj={a:{b:1,c:2}}; const ret=unset(obj,'a.b');
      if (!${JSON.stringify(rel)}.startsWith('fp/')) assert.deepStrictEqual(obj,{a:{c:2}});
    `));
  }
  await test('lodash omit and ordinary paths', () => {
    const _=require(path.join(root,'lodash-4.17.21/node_modules/lodash'));
    Object.prototype.securitySentinel=1;
    try { _.omit({},'__proto__.securitySentinel'); assert.strictEqual(Object.prototype.securitySentinel,1); }
    finally { delete Object.prototype.securitySentinel; }
    assert.deepStrictEqual(_.omit({a:1,b:2},'a'),{b:2});
    const symbol=Symbol(); const o={[symbol]:2}; assert(_.unset(o,[symbol])); assert(!(symbol in o));
    assert(_.unset({}, 'missing.deep'));
  });
  await test('lodash-es protection', async () => {
    // lodash-es publishes ES module syntax without type:module; test a temporary ESM copy.
    const os=require('os'); const dir=fs.mkdtempSync(path.join(os.tmpdir(),'osd-lodash-es-'));
    try {
      fs.cpSync(path.join(root,'lodash-es-4.17.21/node_modules/lodash-es'),dir,{recursive:true});
      fs.writeFileSync(path.join(dir,'package.json'),'{"type":"module"}');
      const {default:unset}=await import(pathToFileURL(path.join(dir,'unset.js')));
      Object.prototype.securitySentinel=1;
      try { unset({}, '__proto__.securitySentinel'); assert.strictEqual(Object.prototype.securitySentinel,1); }
      finally { delete Object.prototype.securitySentinel; }
    } finally { fs.rmSync(dir,{recursive:true,force:true}); }
  });
  for (const ver of ['3.3.2','3.3.3']) {
    const pkg=path.join(root,`nanoid-${ver}/node_modules/nanoid`);
    for (const rel of ['index.cjs','index.js','index.browser.js','index.browser.cjs']) {
      if (!fs.existsSync(path.join(pkg,rel))) continue;
      await test(`nanoid ${ver} zero size ${rel}`, () => child(`
        (async()=>{ const assert=require('assert');global.crypto=require('crypto').webcrypto;
        const n=await import(${JSON.stringify(pathToFileURL(path.join(pkg,rel)).href)});
        assert.strictEqual(n.customAlphabet('ab',0)(),'');
        assert.strictEqual(n.customAlphabet('ab',8)(0),'');
        assert.strictEqual(n.customRandom('ab',0,()=>{throw Error('must not request randomness')})(),'');
        assert.strictEqual(n.customAlphabet('ab',0)(8).length,8);
        assert.strictEqual(n.nanoid().length,21); assert.strictEqual(n.customAlphabet('ab',8)().length,8);
        })().catch(e=>{console.error(e);process.exit(1)});
      `));
    }
    for (const rel of ['non-secure/index.cjs','non-secure/index.js']) await test(`nanoid ${ver} negative ${rel}`, () => child(`
      (async()=>{ const assert=require('assert');const n=await import(${JSON.stringify(pathToFileURL(path.join(pkg,rel)).href)});
      assert.strictEqual(n.nanoid(-1),'');assert.strictEqual(n.customAlphabet('ab',-1)(),'');
      assert.strictEqual(n.nanoid(10).length,10);assert.strictEqual(n.nanoid(0),''); })().catch(e=>{console.error(e);process.exit(1)});
    `));
    for (const rel of ['async/index.cjs','async/index.js','async/index.browser.js','async/index.browser.cjs']) {
      await test(`nanoid ${ver} async zero ${rel}`, () => child(`
        (async()=>{const assert=require('assert');global.crypto=require('crypto').webcrypto;
        const n=await import(${JSON.stringify(pathToFileURL(path.join(pkg,rel)).href)});
        assert.strictEqual(await n.customAlphabet('ab',0)(),'');
        assert.strictEqual(await n.customAlphabet('ab',8)(0),'');
        assert.strictEqual((await n.customAlphabet('ab',0)(8)).length,8);
        assert.strictEqual((await n.nanoid()).length,21);
        })().catch(e=>{console.error(e);process.exit(1)});
      `));
    }
    await test(`nanoid ${ver} pool validation`, () => child(`
      const assert=require('assert'),n=require(${JSON.stringify(pkg)});n.nanoid();
      for(const size of [-1,-2147483648,NaN,Infinity,1.5,2147483648]) assert.throws(()=>n.nanoid(size));
      assert.strictEqual(n.nanoid(2048).length,2048);
      assert.strictEqual(n.nanoid('10').length,10);
      assert.notStrictEqual(n.nanoid(),n.nanoid());
    `));
  }
  const decode=path.join(root,'decode-uri-component-0.2.2/node_modules/decode-uri-component');
  await test('decode CommonJS and compatibility',()=>{
    const d=require(decode);
    for(const [input,expected] of [['a+b','a b'],['%2B','+'],['%C3%A9','é'],['%F0%9F%98%80','😀'],['%ab','%ab'],['%','%'],['%FE%FF','��'],['%C2','�'],['%25C2','%C2'],['%C2%B5','µ']]) assert.strictEqual(d(input),expected,input);
    assert.throws(()=>d(null),TypeError);
  });
  await test('decode malformed 1400 tokens bounded time',()=>child(`
    const assert=require('assert');const d=require(${JSON.stringify(decode)});const s='%ab'.repeat(1400);assert.strictEqual(d(s),s);
  `,2000));
  await test('decode total replacement work is linear for distinct runs',()=>{
    const d=require(decode);
    const input='%ff '+Array.from({length:1000},(_,i)=>String(i).padStart(5,'0').split('').map(c=>'%'+c.charCodeAt(0).toString(16)).join('')).join(' ');
    const saved=String.prototype.replace;let scanned=0;
    String.prototype.replace=function(...args){scanned+=this.length;return saved.apply(this,args);};
    let result;
    try {result=d(input);} finally {String.prototype.replace=saved;}
    assert(result.startsWith('%ff 00000 00001'));
    assert(scanned < 12*input.length, `repeated input rescans: ${scanned} chars for ${input.length} input chars`);
  });
  console.log(JSON.stringify({checks,failures,node:process.version}));
  process.exitCode=failures?1:0;
})();
