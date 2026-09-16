'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const pkg=path.resolve(process.argv[2]);
const original=process.argv[3]&&path.resolve(process.argv[3]);
let checks=0,failures=0;
function test(name,fn){checks++;try{fn();console.log('PASS',name);}catch(e){failures++;console.log('FAIL',name,e.message);}}
const utils=require(path.join(pkg,'lib/utils.js'));
const qs=require(path.join(pkg,'dist/qs.js'));
for(const value of ['x',1,true,{},[],{isBuffer:true},false,0,null,undefined]) {
 test('utils rejects non-callable '+JSON.stringify(value),()=>{
  assert.strictEqual(utils.isBuffer({constructor:{isBuffer:value}}),false);
 });
}
const cases=[['x','a%5Bconstructor%5D%5BisBuffer%5D=x'],[true,'a%5Bconstructor%5D%5BisBuffer%5D=true'],[{b:'c'},'a%5Bconstructor%5D%5BisBuffer%5D%5Bb%5D=c'],[['b'],'a%5Bconstructor%5D%5BisBuffer%5D%5B0%5D=b']];
for(const [value,expected] of cases)test('stringify '+JSON.stringify(value),()=>assert.strictEqual(qs.stringify({a:{constructor:{isBuffer:value}}}),expected));
for(const options of [{plainObjects:true},{allowPrototypes:true}])test('roundtrip '+JSON.stringify(options),()=>{
 const input='x%5Bconstructor%5D%5BisBuffer%5D=y';assert.strictEqual(qs.stringify(qs.parse(input,options)),input);
});
test('default parse keeps existing prototype filtering',()=>assert.strictEqual(qs.stringify(qs.parse('x[constructor][isBuffer]=y')),''));
test('native Buffer',()=>{
 assert.strictEqual(utils.isBuffer(Buffer.from('abc')),true);
 assert.strictEqual(qs.stringify({a:Buffer.from('a b')}),'a=a%20b');
 assert.strictEqual(utils.isBuffer({constructor:Buffer}),false);
});
test('duck-typed buffer and receiver preserved',()=>{
 const object={constructor:{isBuffer:function(arg){assert.strictEqual(this,object.constructor);assert.strictEqual(arg,object);return true;}},toString:()=> 'buffer value'};
 assert.strictEqual(utils.isBuffer(object),true);assert.strictEqual(qs.stringify({a:object}),'a=buffer%20value');
});
test('primitives/null-prototype objects',()=>{
 for(const x of [undefined,null,false,1,'x',()=>{}])assert.strictEqual(utils.isBuffer(x),false);
 assert.strictEqual(utils.isBuffer(Object.assign(Object.create(null),{constructor:{isBuffer:'x'}})),false);
});
test('browser UMD without Node globals',()=>{
 const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(pkg,'dist/qs.js'),'utf8'),sandbox);
 assert.strictEqual(sandbox.Qs.stringify({a:{constructor:{isBuffer:'x'}}}),cases[0][1]);
 assert.strictEqual(sandbox.Qs.stringify({a:['x','y']}),'a%5B0%5D=x&a%5B1%5D=y');
});
if(original)test('3000 ordinary serialization comparisons and API exports',()=>{
 const before=require(path.join(original,'dist/qs.js'));
 assert.deepStrictEqual(Object.keys(qs),Object.keys(before));
 const options=[{}, {arrayFormat:'brackets'}, {arrayFormat:'repeat'}, {arrayFormat:'comma'}, {encode:false}, {allowDots:true}, {skipNulls:true}, {strictNullHandling:true}, {format:'RFC1738'}, {sort:(a,b)=>a.localeCompare(b)}];
 for(let i=0;i<3000;i++){
  const obj={a:'кириллица &='+i,b:[i,null,'x y'],nested:{x:i%2===0,y:null},empty:'',date:new Date(1700000000000+i),buffer:Buffer.from('b'+i)};
  const option=options[i%options.length];assert.strictEqual(qs.stringify(obj,option),before.stringify(obj,option));
 }
});
console.log(JSON.stringify({checks,failures,node:process.version}));process.exitCode=failures?1:0;
