// Empreinte déterministe (cyrb53) pour fabriquer des identifiants stables. Pas un usage cryptographique.

export function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Identifiant alphanumérique stable, en majuscules. */
export function stableId(str, length = 16) {
  const a = cyrb53(str, 11).toString(36);
  const b = cyrb53(str, 29).toString(36);
  return (a + b).toUpperCase().padEnd(length, '0').slice(0, length);
}
