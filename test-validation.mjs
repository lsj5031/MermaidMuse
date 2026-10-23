import assert from 'node:assert/strict';
import { parse, render, PeleError } from 'pele';

const invalid = 'sequenceDiagram\nparticipant Buyer\ninvalid syntax here';
assert.throws(() => parse(invalid), PeleError);
assert.throws(() => render(invalid), PeleError);
assert.match(render('flowchart LR\nA-->B').svg, /class="pele /);
console.log('Pele parse/render smoke checks passed');
