#!/usr/bin/env node
/**
 * R.O.U.T.E. — completa l'autorizzazione Google incollando il codice.
 *
 * Serve quando il browser non riesce ad aprire http://localhost:53682
 * (porta non inoltrata nel codespace). Dopo aver autorizzato l'app, il browser
 * mostra un errore ma l'indirizzo contiene `?code=...`: copialo tutto e
 * incollalo qui.
 *
 * Uso:  npm run google:code
 */

import fs from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import 'dotenv/config';

const ENV_FILE = '.env';
const REDIRECT_URI = 'http://localhost:53682/oauth2callback';

const clean = (value) => String(value || '').replace(/\s+/g, '');
const clientId = clean(process.env.GOOGLE_CLIENT_ID);
const clientSecret = clean(process.env.GOOGLE_CLIENT_SECRET);

function upsertEnv(values) {
  let content = '';
  try {
    content = fs.readFileSync(ENV_FILE, 'utf8');
  } catch {
    content = '';
  }

  for (const [key, value] of Object.entries(values)) {
    if (!value) continue;
    const line = `${key}="${value}"`;
    const pattern = new RegExp(`^${key}\\s*=.*$`, 'm');
    if (pattern.test(content)) {
      content = content.replace(pattern, line);
    } else {
      if (content && !content.endsWith('\n')) content += '\n';
      content += `${line}\n`;
    }
  }

  fs.writeFileSync(ENV_FILE, content, 'utf8');
}

async function verify(refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const payload = await response.json().catch(() => ({}));
  return payload.access_token
    ? { ok: true }
    : { ok: false, error: payload.error, detail: payload.error_description };
}

function extractCode(raw) {
  const value = raw.trim();
  if (!value) return '';

  // Se ha incollato l'URL completo (anche quello della pagina di errore).
  const match = /[?&]code=([^&\s]+)/.exec(value);
  if (match) return decodeURIComponent(match[1]);

  // Se ha incollato solo il codice.
  if (/^[\w./-]{10,}$/.test(value)) return decodeURIComponent(value);

  return '';
}

async function main() {
  if (!clientId || !clientSecret) {
    console.error('\n✖ Manca GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET nel file .env.\n');
    process.exit(1);
  }

  const rl = createInterface({ input, output });
  console.log(
    '\nIncolla l’INDIRIZZO COMPLETO della pagina di errore del browser\n' +
      '(quello che inizia con http://localhost:53682/oauth2callback?code=…)',
  );
  console.log('oppure solo il codice. Non viene salvato né mostrato.\n');

  const answer = await rl.question('URL o codice: ');
  rl.close();

  const code = extractCode(answer);
  if (!code) {
    console.error('\n✖ Non ho trovato un codice valido nell’input.\n');
    process.exit(1);
  }

  console.log(`\n→ Codice ricevuto (${code.length} caratteri). Lo scambio con Google…`);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.refresh_token) {
    console.error(`\n✖ Scambio fallito: ${payload.error || response.status}`);
    console.error(`  dettaglio: ${payload.error_description || 'nessun dettaglio'}`);

    if (payload.error === 'invalid_grant') {
      console.error(
        '\n  Il codice è scaduto (durano pochi minuti) o è già stato usato.' +
          '\n  Rilancia `npm run google:auth`, autorizza di nuovo e rifai lo scambio.\n',
      );
    } else {
      console.error('');
    }
    process.exit(1);
  }

  const refreshToken = String(payload.refresh_token);
  upsertEnv({
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
    GOOGLE_REFRESH_TOKEN: refreshToken,
  });

  console.log(`✔ Token scritto in ${ENV_FILE} (${refreshToken.length} caratteri).`);

  const check = await verify(refreshToken);
  if (check.ok) {
    console.log('✔ Google ha accettato le credenziali: sincronizzazione pronta.');
    console.log('  Riavvia il server e premi «Sincronizza ora» in R.O.U.T.E.\n');
    process.exit(0);
  }

  console.error(`✖ Verifica fallita (${check.error}): ${check.detail}\n`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
