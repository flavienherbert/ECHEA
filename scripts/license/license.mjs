#!/usr/bin/env node
// Émission des clés de licence Échéa Pro (Ed25519).
//
//   node scripts/license/license.mjs init
//       Crée la paire de clés dans ~/.echea/ (jamais dans le dépôt) et affiche la clé publique
//       à recopier dans app/src/config.js (LICENSE_PUBLIC_KEY).
//
//   node scripts/license/license.mjs issue --org "Nom de l'organisme" --email client@exemple.fr [--months 13] [--plan pro]
//       Affiche une clé à envoyer au client après son paiement.
//
// La clé privée peut aussi être fournie par la variable ECHEA_LICENSE_PRIVATE_KEY (contenu PEM).
import { generateKeyPairSync, createPrivateKey, createPublicKey, sign, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIR = process.env.ECHEA_KEY_DIR || join(homedir(), '.echea');
const PRIV = join(DIR, 'license-private.pem');
const PREFIX = 'ECHEA1';

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function args() {
  const out = {};
  const a = process.argv.slice(3);
  for (let i = 0; i < a.length; i += 1) if (a[i].startsWith('--')) { out[a[i].slice(2)] = a[i + 1]; i += 1; }
  return out;
}

function loadPrivateKey() {
  const pem = process.env.ECHEA_LICENSE_PRIVATE_KEY || (existsSync(PRIV) ? readFileSync(PRIV, 'utf8') : null);
  if (!pem) throw new Error(`Clé privée introuvable : lancez d'abord « init » ou définissez ECHEA_LICENSE_PRIVATE_KEY (${PRIV}).`);
  return createPrivateKey(pem);
}

export function publicKeyHex(privateKey) {
  const jwk = createPublicKey(privateKey).export({ format: 'jwk' });
  return Buffer.from(jwk.x, 'base64url').toString('hex');
}

export function issue({ org, email, months = 13, plan = 'pro', today = new Date() }, privateKey) {
  const exp = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + Number(months), today.getUTCDate()));
  const payload = { v: 1, id: randomUUID().slice(0, 8), org: org || '', email: email || '', plan, iat: today.toISOString().slice(0, 10), exp: exp.toISOString().slice(0, 10) };
  const body = `${PREFIX}.${b64url(JSON.stringify(payload))}`;
  const signature = sign(null, Buffer.from(body), privateKey);
  return { token: `${body}.${b64url(signature)}`, payload };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const cmd = isCli ? process.argv[2] : undefined;
if (cmd === 'init') {
  if (existsSync(PRIV)) {
    console.log(`Une clé existe déjà : ${PRIV}`);
  } else {
    mkdirSync(DIR, { recursive: true, mode: 0o700 });
    const { privateKey } = generateKeyPairSync('ed25519');
    writeFileSync(PRIV, privateKey.export({ format: 'pem', type: 'pkcs8' }), { mode: 0o600 });
    console.log(`Clé privée créée : ${PRIV} (à sauvegarder, ne jamais la committer)`);
  }
  console.log(`LICENSE_PUBLIC_KEY = '${publicKeyHex(loadPrivateKey())}'`);
} else if (cmd === 'issue') {
  const a = args();
  if (!a.email) { console.error('Usage : issue --org "Organisme" --email client@exemple.fr [--months 13]'); process.exit(1); }
  const { token, payload } = issue(a, loadPrivateKey());
  console.log(JSON.stringify(payload));
  console.log(token);
} else if (cmd === 'pubkey') {
  console.log(publicKeyHex(loadPrivateKey()));
} else if (cmd) {
  console.error(`Commande inconnue : ${cmd}`);
  process.exit(1);
}
