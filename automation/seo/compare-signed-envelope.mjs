/* Allow an existing V220 SEO checkpoint to survive a CRLF/LF-only text change.
 * The Ed25519 signature and contents are verified before this comparison.
 * Do NOT normalize JSON fields or signed payloads: a same-revision content
 * change must still be rejected, even if both envelopes are validly signed.
 */
import {createHash} from 'node:crypto';
const sha256 = s => createHash('sha256').update(s).digest('hex');

export function sameSignedEnvelopeWithNewlineOnly(raw, previousHash) {
  if (typeof raw !== 'string' || !/^[a-f0-9]{64}$/i.test(previousHash || '')) return false;
  if (sha256(raw) === previousHash) return true;
  // Preserve EVERY byte except the single optional terminal newline.
  // GitHub's generated JSON uses LF; the Windows ZIP snapshot used CRLF.
  const base = raw.endsWith('\r\n') ? raw.slice(0, -2)
    : raw.endsWith('\n') ? raw.slice(0, -1) : raw;
  if (base.endsWith('\n') || base.endsWith('\r')) return false;
  return [base, base + '\n', base + '\r\n']
    .some(candidate => sha256(candidate) === previousHash);
}
