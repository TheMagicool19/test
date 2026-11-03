#!/usr/bin/env node
/**
 * R.O.U.T.E. — helper per ottenere il refresh token di Google Calendar.
 *
 * Uso:
 *   1. Crea un OAuth Client ID di tipo "App desktop" nella Google Cloud Console
 *      (API abilitata: Google Calendar API).
 *   2. Lancia:  npm run google:auth
 *   3. Apri l'URL stampato, autorizza con il tuo account, copia il refresh token
 *      dentro il file .env come GOOGLE_REFRESH_TOKEN.
 *
 * In Codespaces la pagina di ritorno usa http://localhost:53682: se il browser
 * non riesce ad aprirla, inoltra la porta 53682 dal pannello "Porte" di VS Code.
 */

import http from 'node:http';
import fs from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import 'dotenv/config';

const ENV_FILE = '.env';

/** Scrive/aggiorna una chiave nel file .env senza toccare le altre righe. */
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

/** Chiede a Google se le credenziali funzionano davvero. */
async function verifyCredentials(clientId, clientSecret, refreshToken) {
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
  if (payload.access_token) return { ok: true };
  return {
    ok: false,
    error: payload.error || `HTTP ${response.status}`,
    detail: payload.error_description || 'nessun dettaglio',
  };
}

const PORT = Number(process.env.GOOGLE_AUTH_PORT || 53682);
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

const rl = createInterface({ input, output });

async function ask(label, fallback = '') {
  if (fallback) return fallback;
  const answer = await rl.question(label);
  return answer.trim();
}

async function main() {
  // Difesa contro copia-incolla che si portano dietro a capo o spazi.
  const sanitize = (value) => String(value || '').replace(/\s+/g, '');

  const clientId = sanitize(
    await ask(
      'GOOGLE_CLIENT_ID (termina con .apps.googleusercontent.com): ',
      process.env.GOOGLE_CLIENT_ID,
    ),
  );
  const clientSecret = sanitize(
    await ask('GOOGLE_CLIENT_SECRET: ', process.env.GOOGLE_CLIENT_SECRET),
  );

  if (!clientId || !clientSecret) {
    console.error('\n✖ Client ID e Client Secret sono obbligatori.');
    process.exit(1);
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPE);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  console.log('\n1) Apri questo URL nel browser e autorizza l’accesso:\n');
  console.log(authUrl.toString());
  console.log(
    `\n2) Il browser tornerà su ${REDIRECT_URI}` +
      `\n   (in Codespaces: scheda "Porte" → inoltra la porta ${PORT}).` +
      '\n3) Attendo il codice di autorizzazione…\n',
  );

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', REDIRECT_URI);
    if (url.pathname !== '/oauth2callback') {
      res.writeHead(404).end('Not found');
      return;
    }

    const error = url.searchParams.get('error');
    const code = url.searchParams.get('code');

    if (error || !code) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Autorizzazione rifiutata: ${error || 'codice mancante'}`);
      console.error(`\n✖ Autorizzazione rifiutata: ${error || 'codice mancante'}`);
      server.close();
      rl.close();
      process.exit(1);
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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

      const payload = await tokenResponse.json();

      if (!tokenResponse.ok || !payload.refresh_token) {
        const detail = payload.error_description || payload.error || 'risposta non valida';
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Errore: ${detail}`);
        console.error(
          `\n✖ Scambio del codice fallito: ${detail}\n` +
            '  Se il token manca, revoca l’accesso da https://myaccount.google.com/permissions e riprova.',
        );
        server.close();
        rl.close();
        process.exit(1);
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        '<h2>Autorizzazione completata ✅</h2><p>Torna al terminale: le credenziali sono state salvate in .env.</p>',
      );

      const refreshToken = String(payload.refresh_token);
      const tokenLooksShort = refreshToken.length < 50;

      upsertEnv({
        GOOGLE_CLIENT_ID: clientId,
        GOOGLE_CLIENT_SECRET: clientSecret,
        GOOGLE_REFRESH_TOKEN: refreshToken,
      });

      console.log('\n✔ Autorizzazione completata.');
      console.log(`  Token scritto in ${ENV_FILE} (${refreshToken.length} caratteri).`);
      if (tokenLooksShort) {
        console.log('  ⚠️  Il token sembra più corto del normale: se la verifica fallisce, riprova.');
      }

      console.log('\n→ Verifico le credenziali con Google…');
      const check = await verifyCredentials(clientId, clientSecret, refreshToken);

      if (check.ok) {
        console.log('✔ Google ha accettato le credenziali: la sincronizzazione è pronta.');
        console.log('  Riavvia il server (`npm run dev`) e premi «Sincronizza ora» in R.O.U.T.E.\n');
      } else if (check.error === 'invalid_client') {
        console.log('✖ Google non riconosce il Client ID:', check.detail);
        console.log('  → Ricopia il Client ID dalla console (Credenziali → il tuo client → icona copia).');
        console.log('  → Se il client è stato eliminato o ricreato, usa quello nuovo.\n');
      } else if (check.error === 'invalid_grant') {
        console.log('✖ Il refresh token è rifiutato:', check.detail);
        console.log('  → Revoca l’accesso da https://myaccount.google.com/permissions e rilancia lo script.\n');
      } else {
        console.log(`✖ Verifica fallita (${check.error}): ${check.detail}\n`);
      }

      server.close();
      rl.close();
      process.exit(check.ok ? 0 : 2);
    } catch (err) {
      console.error('\n✖ Errore di rete durante lo scambio del codice:', err);
      server.close();
      rl.close();
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log(`Server locale in ascolto su ${REDIRECT_URI}\n`);
  });

  setTimeout(() => {
    console.error('\n✖ Tempo scaduto (10 minuti): nessuna autorizzazione ricevuta.');
    server.close();
    rl.close();
    process.exit(1);
  }, 10 * 60 * 1000).unref();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
