import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sameSignedEnvelopeWithNewlineOnly as compatible} from './compare-signed-envelope.mjs';
const hash = s => createHash('sha256').update(s).digest('hex');
const signed = '{"schema":1,"payload":"signed-payload","signature":"valid-signature"}';
test('same signed envelope accepts CRLF checkpoint against LF publish (actual V220 failure)', () => {
  assert.equal(compatible(signed + '\n', hash(signed + '\r\n')), true);
  assert.equal(compatible(signed + '\r\n', hash(signed + '\n')), true);
});
test('accepts exact match and missing final newline only', () => {
  assert.equal(compatible(signed + '\n', hash(signed + '\n')), true);
  assert.equal(compatible(signed, hash(signed + '\n')), true);
});
test('rejects changed signed payload with SAME revision', () => {
  const changed = signed.replace('signed-payload', 'altered-payload');
  assert.equal(compatible(changed + '\n', hash(signed + '\r\n')), false);
});
test('rejects changed signature, internal whitespace and multiple newlines', () => {
  assert.equal(compatible(signed.replace('valid-signature','altered-signature') + '\n', hash(signed + '\r\n')), false);
  assert.equal(compatible(signed.replace('"payload"', ' "payload"') + '\n', hash(signed + '\r\n')), false);
  assert.equal(compatible(signed + '\n\n', hash(signed + '\n')), false);
});
test('rejects invalid checkpoint hash', () => {
  assert.equal(compatible(signed, ''), false);
  assert.equal(compatible(signed, undefined), false);
});
