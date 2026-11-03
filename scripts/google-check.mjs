#!/usr/bin/env node
/**
 * R.O.U.T.E. — verifica delle credenziali Google Calendar.
 *
 * Uso:  npm run google:check
 *
 * Controlla che le tre variabili siano presenti nel .env, ne mostra solo la
 * forma (mai il contenuto) e chiede a Google se il refresh token è valido.
 * Esce con codice 0 se tutto funziona, 1 se qualcosa non va.
 */

import 'dotenv/config';

const mask = (value) => {
  if (!value) return '<vuoto>';
  if (value.length <= 14) return `${value.slice(0, 2)}…${value.slice(-2)}`;
  return `${value.slice(0, 8)}…${value.slice(-12)}`;
};

const clean = (value) => String(value || '').replace(/\s+/g, '');

const clientId = clean(process.env.GOOGLE_CLIENT_ID);
const clientSecret = clean(process.env.GOOGLE_CLIENT_SECRET);
const refreshToken = clean(process.env.GOOGLE_REFRESH_TOKEN);

console.log('\nCredenziali lette da .env\n');
console.log('  CLIENT_ID     ', mask(clientId), `(${clientId.length} caratteri)`);
console.log('  CLIENT_SECRET ', mask(clientSecret), `(${clientSecret.length} caratteri)`);
console.log('  REFRESH_TOKEN ', mask(refreshToken), `(${refreshToken.length} caratteri)`);
console.log('  CALENDAR_ID   ', process.env.GOOGLE_CALENDAR_ID || 'primary');
console.log('  TIMEZONE      ', process.env.GOOGLE_TIMEZONE || 'Europe/Rome');
console.log('  DRY_RUN       ', process.env.GOOGLE_CALENDAR_DRY_RUN === '1' ? 'attivo' : 'disattivo');

const problems = [];
if (!clientId) problems.push('GOOGLE_CLIENT_ID mancante');
if (!clientSecret) problems.push('GOOGLE_CLIENT_SECRET mancante');
if (!refreshToken) problems.push('GOOGLE_REFRESH_TOKEN mancante');
if (clientId && !clientId.endsWith('.apps.googleusercontent.com')) {
  problems.push('GOOGLE_CLIENT_ID non termina con .apps.googleusercontent.com');
}
if (clientSecret && !clientSecret.startsWith('GOCSPX-')) {
  problems.push('GOOGLE_CLIENT_SECRET non inizia con GOCSPX-');
}
if (refreshToken && refreshToken.length < 50) {
  problems.push(`GOOGLE_REFRESH_TOKEN sembra troncato (${refreshToken.length} caratteri, attesi ~100)`);
}
if (refreshToken && /(il-resto|\.\.\.|…|ESEMPIO)/i.test(refreshToken)) {
  problems.push('GOOGLE_REFRESH_TOKEN contiene un segnaposto di esempio, non un token reale');
  problems.push('  → esegui `npm run google:auth` e completa l’autorizzazione nel browser');
}

if (problems.length > 0) {
  console.log('\nProblemi nel file .env:');
  for (const problem of problems) console.log('  •', problem);
}

if (!clientId || !clientSecret || !refreshToken) {
  console.log('\n→ Impossibile contattare Google: credenziali incomplete.\n');
  process.exit(1);
}

console.log('\n→ Chiedo un access token a Google…');

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

if (payload.access_token) {
  console.log('✔ Google ha accettato le credenziali.');
  console.log(`  access_token ottenuto (scade in ${payload.expires_in}s), scope: ${payload.scope || 'n/d'}`);

  if (process.env.GOOGLE_CALENDAR_DRY_RUN === '1') {
    console.log('\n  (dry-run attivo: gli eventi non verranno creati su Google)\n');
  } else {
    console.log('\n  Ora puoi sincronizzare: POST /api/google/sync o «Sincronizza ora» in R.O.U.T.E.\n');
  }
  process.exit(0);
}

console.log('✖ Google ha rifiutato le credenziali.');
console.log('  errore:', payload.error || `HTTP ${response.status}`);
console.log('  dettaglio:', payload.error_description || 'nessun dettaglio');

if (payload.error === 'invalid_client') {
  console.log('\n  Il Client ID non esiste (o è stato eliminato). Ricopialo da:');
  console.log('  Google Cloud Console → API e servizi → Credenziali → il tuo client OAuth desktop.');
} else if (payload.error === 'invalid_grant') {
  console.log('\n  Il refresh token non è più valido: rilancia `npm run google:auth`.');
  console.log('  Se continua, revoca l’accesso da https://myaccount.google.com/permissions');
} else if (payload.error === 'unauthorized_client') {
  console.log('\n  Il client non è autorizzato per questo tipo di flusso: verifica che sia "App desktop".');
}

console.log('');
process.exit(1);
