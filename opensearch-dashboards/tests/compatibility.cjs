'use strict';
const assert = require('assert');
const path = require('path');
const original = path.resolve(process.argv[2]);
const fixtures = path.resolve(process.argv[3]);
const old = require(path.join(original,'decode-uri-component-0.2.2/package'));
const fixed = require(path.join(fixtures,'decode-uri-component-0.2.2/node_modules/decode-uri-component'));
let seed=1, comparisons=0, malformedDifferences=0;
const examples=[];
const random = max => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%max;};
const characters=['a','+','%','é','中','😀',' ','\u0000','/','&','='];
for(let i=0;i<10000;i++) {
  let text='';for(let j=0;j<12;j++) text+=characters[random(characters.length)];
  const encoded=encodeURIComponent(text);
  assert.strictEqual(fixed(encoded),old(encoded));comparisons++;
}
// Differential report for malformed UTF-8; legacy replacement-order artifacts
// are deliberately not compatibility requirements for the security fallback.
const parts=['%ab','%C2','%A9','%C3','%E2','%82','%AC','%F0','%9F','%98','%80','%FE','%FF%FF%FF','%20','%41','+','a','%','%00','$&'];
for(let i=0;i<10000;i++) {
  let input='';for(let j=0;j<6;j++) input+=parts[random(parts.length)];
  const before=old(input),after=fixed(input);
  assert.strictEqual(typeof after,'string');
  if(before!==after){malformedDifferences++;if(examples.length<4)examples.push({input,before,after});}
  comparisons++;
}
for(const name of ['lodash','nanoid']) {
 const version=name==='lodash'?'4.17.21':'3.3.2';
 const a=require(path.join(original,`${name}-${version}/package`));
 const b=require(path.join(fixtures,`${name}-${version}/node_modules/${name}`));
 assert.deepStrictEqual(Object.keys(a).sort(),Object.keys(b).sort());
}
// The upstream security algorithm does not reparse decoded '%' in malformed input.
assert.strictEqual(old('%FF%FF%FF%25'),'%FF%FF%FF');
assert.strictEqual(fixed('%FF%FF%FF%25'),'%FF%FF%FF%');
console.log(`PASS 10000 valid-URI equivalence cases; exported API names unchanged`);
console.log(JSON.stringify({comparisons,malformedCases:10000,malformedDifferences,examples}));
console.log('Documented security fallback change: malformed %FF%FF%FF%25 preserves the final % instead of losing it.');
