const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

export async function deriveReceipt(idempotencyKey: string, pepper: string) {
  const ticketMaterial = await hmac(`ticket:${idempotencyKey}`, pepper);
  const secret = await hmac(`tracking:${idempotencyKey}`, pepper);
  const year = new Date().getUTCFullYear();
  return { ticket: `D-DAS-${year}-${ticketMaterial.slice(0, 24).toUpperCase()}`, secret };
}

export async function encrypt(value: string, encodedKey: string) {
  const raw = fromBase64(encodedKey);
  if (raw.byteLength !== 32) throw new Error('ENCRYPTION_KEY_INVALID');
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(value)));
  return `v1.${toBase64Url(iv)}.${toBase64Url(cipher)}`;
}
