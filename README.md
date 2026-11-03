# NAVICELLA V1.0 — R.O.U.T.E.

Modulo logistico della Navicella: agenda persistente di turni, lezioni, studio e impegni
personali, con ingestion in linguaggio naturale e timeboxing calcolato.

## Avvio

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # type-check
npm run build    # bundle di produzione
```

Lo store è un file JSON locale: `data/route.json` (escluso da git, creato al primo avvio).

## C-05 · R.O.U.T.E. — come funziona

1. **Ingestion in linguaggio naturale** — il parser (`server/routeParser.ts`) riconosce:
   - date: `oggi`, `domani`, `dopodomani`, `lunedì`, `12/11`, `12 novembre`, `2026-11-12`
   - orari: `14-18`, `9:30-13:00`, `dalle 9 alle 13`, `ore 15-19`
   - ricorrenza: `ogni martedì`, `tutti i venerdì`, `settimanale`
   - luoghi: `presso Farmacia Centrale`, `in aula B`
   - categorie: `lavoro`, `universita`, `studio`, `personale`, `altro`

   Il parser è **deterministico e locale**: funziona anche senza `GEMINI_API_KEY`.

2. **Anteprima modificabile** — ogni frase produce una bozza con titolo, categoria, data,
   orari, luogo e ricorrenza, correggibile prima del salvataggio.

3. **Persistenza** — gli impegni sono salvati su `data/route.json`; le ricorrenze
   settimanali vengono espanse al volo nell'intervallo richiesto.

4. **Timeboxing** — il server sottrae gli impegni dalla finestra giornaliera
   (default `08:00–23:00`), applica un buffer di spostamento (default 30′) e restituisce
   i blocchi liberi con durata ≥ 30′.

5. **Conflitti** — ogni creazione/modifica restituisce le sovrapposizioni rilevate, mostrate
   in UI come avvisi non bloccanti.

## API

| Metodo | Endpoint | Descrizione |
| --- | --- | --- |
| `GET` | `/api/route/shifts` | Elenco impegni + metadati store |
| `POST` | `/api/route/shifts` | Crea impegno (`title`, `category`, `date`, `start`, `end`, `location?`, `recurrence?`) |
| `PATCH` | `/api/route/shifts/:id` | Modifica impegno (accetta anche `base@YYYY-MM-DD`) |
| `DELETE` | `/api/route/shifts/:id` | Elimina impegno o intera serie settimanale |
| `POST` | `/api/route/parse` | Anteprima senza salvare (`{ "text": "domani turno 14-18" }`) — restituisce `preview` (impegni) e `exams` (esami) |
| `POST` | `/api/route/ingest` | Parse + salvataggio immediato (`created` + `createdExams`) |
| `GET` | `/api/route/agenda?from=YYYY-MM-DD&to=YYYY-MM-DD&buffer=30` | Agenda con blocchi liberi e totali per categoria |
| `GET` | `/api/route/exams` | Piano di studi: elenco esami + metadati |
| `POST` | `/api/route/exams` | Crea esame (`subject`, `date`, `time?`, `status?`, `priority?`, `cfu?`, `grade?`, `topics?`, `notes?`) |
| `PATCH` | `/api/route/exams/:id` | Modifica esame (stato, voto, nuova data…) |
| `DELETE` | `/api/route/exams/:id` | Elimina esame |
| `POST` | `/api/route/exams/parse` | Anteprima esame in linguaggio naturale |
| `POST` | `/api/route/exams/ingest` | Parse + salvataggio esami |

## C-05b · Piano di studi (esami)

Gli esami sono entità autonome rispetto agli impegni: un appello può non avere
ancora un orario, e porta con sé stato, priorità, CFU e voto.

| Campo | Note |
| --- | --- |
| `subject` | materia / insegnamento (obbligatorio) |
| `date` | data appello `YYYY-MM-DD` (obbligatoria) |
| `time` | ora appello `HH:MM` (opzionale) |
| `status` | `da_fare` · `prenotato` · `superato` · `ritirato` |
| `priority` | `alta` · `media` · `bassa` |
| `cfu` | 1–60 (opzionale) |
| `grade` | 18–30, `31` = 30L (imposta lo stato a `superato`) |
| `topics`, `notes` | argomenti da preparare, note libere |

**Agenda.** Un esame con `time` riserva in agenda un blocco di default di 120′
(configurabile con `?examBlock=NN` sulla richiesta agenda): il timeboxing non
propone di studiare durante l'appello. Gli esami senza orario compaiono come
evento del giorno senza sottrarre tempo libero.

**Linguaggio naturale.** Il parser locale riconosce
`esame di Farmacologia e Tossicologia il 5 dicembre 9 cfu priorità alta, prenotato, in aula B`
→ materia «Farmacologia e Tossicologia», 2026-12-05, priorità alta, 9 CFU,
stato prenotato, note «Aula B». Gli esami sono esclusi dal parsing degli
impegni per non generare doppioni.

**Migrazione.** Alla prima esecuzione dopo l'aggiornamento, i due esami che
erano hardcoded nella HUD vengono importati nello store (`version: 2`):
da quel momento la HUD legge solo da `data/route.json`.

### Esempi

```bash
curl -X POST localhost:3000/api/route/parse \
  -H 'Content-Type: application/json' \
  -d '{"text":"Ogni martedì laboratorio 9-13 in aula B"}'

curl -X POST localhost:3000/api/route/shifts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Turno Farmacia","category":"lavoro","date":"2026-11-04","start":"14:00","end":"18:30"}'

curl -X POST localhost:3000/api/route/exams \
  -H 'Content-Type: application/json' \
  -d '{"subject":"Chimica Organica II","date":"2026-12-05","time":"09:00","status":"prenotato","priority":"alta","cfu":8,"targetHours":30}'

curl "localhost:3000/api/route/agenda?from=2026-11-02&to=2026-11-08&buffer=30"
```

## C-05c · Preparazione, orizzonte e segnalazioni

**Studio collegato all'esame.** Un impegno può portare `examId`: è una sessione di
studio dedicata a una materia. Il motore somma i minuti pianificati da oggi fino
all'appello e li confronta con `targetHours` dell'esame.

| Endpoint | Descrizione |
| --- | --- |
| `GET` | `/api/route/overview?days=60` | Giorni, esami con avanzamento, segnalazioni |
| `GET` | `/api/route/warnings` | Solo le segnalazioni (con conteggio per severità) |

**Segnalazioni deterministiche** (`buildRouteWarnings`): appello entro 7 giorni,
appello entro 21 giorni senza ore di studio pianificate, copertura del target
sotto il 50%, appello passato con stato non aggiornato, settimana con più di 40
ore impegnate.

**Conflitti.** `findConflicts` ora considera anche gli appelli: pianificare studio
sopra un esame produce un conflitto con `kind: "exam"`.

**Vista «Orizzonte».** La UI mostra le prossime settimane (carico impegni +
studio), gli appelli con la barra di avanzamento e le segnalazioni.

## Google Calendar · sync e notifiche sul telefono

Ogni impegno salvato in R.O.U.T.E. viene creato (o aggiornato/eliminato) anche su
Google Calendar; gli esami compaiono come appelli (tutto il giorno se l'ora non è
nota). I reminder sono impostati sull'evento stesso:

| Evento | Reminder |
| --- | --- |
| Impegno | 60′ e 10′ prima |
| Esame | 1 giorno e 2 ore prima |

### Configurazione (una volta sola)

1. **Google Cloud Console** → crea un progetto e abilita **Google Calendar API**.
2. **OAuth consent screen**: tipo *External*, aggiungi il tuo account come
   *test user*.
3. **Credenziali → Crea credenziali → ID client OAuth**, tipo **App desktop**.
   Copia Client ID e Client Secret.
4. Nel codespace esegui:

```bash
npm run google:auth
```

Lo script avvia un server locale sulla porta `53682`, stampa l'URL di consenso e,
al ritorno, il **refresh token**. In Codespaces inoltra la porta `53682` dal
pannello *Porte* se la pagina di ritorno non si apre.

5. Crea il file `.env` (parti da `.env.example`) e incolla i valori:

```env
GOOGLE_CLIENT_ID="…apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="…"
GOOGLE_REFRESH_TOKEN="…"
GOOGLE_CALENDAR_ID="primary"   # oppure un calendario dedicato
GOOGLE_TIMEZONE="Europe/Rome"
```

6. Riavvia il server e premi **«Sincronizza ora»** nel pannello Google Calendar
   di R.O.U.T.E. (oppure `POST /api/google/sync`).

### Endpoint

| Metodo | Endpoint | Descrizione |
| --- | --- | --- |
| `GET` | `/api/google/status` | Configurazione, ultima sync, ultimo errore, eventi da sincronizzare |
| `POST` | `/api/google/ping` | Verifica che il refresh token funzioni |
| `POST` | `/api/google/sync` | Sincronizza impegni futuri/ricorrenti e tutti gli esami |

**Dry run.** Con `GOOGLE_CALENDAR_DRY_RUN=1` gli eventi vengono solo stampati nel
log: utile per verificare la configurazione senza toccare il calendario.

**Notifiche sul telefono.** Arrivano dall'app Google Calendar: verifica che le
notifiche dell'app siano attive e che il calendario scelto sia visibile
(`GOOGLE_CALENDAR_ID`). Se usi un calendario secondario, attivalo sul telefono.

**Senza credenziali** R.O.U.T.E. funziona normalmente: la sincronizzazione resta
inerte e l'app mostra «non configurato».

## Robustezza dello store

- Scrittura **atomica**: `data/route.json` viene scritto su un file temporaneo e
  sostituito con `rename`, così non si leggono mai JSON a metà.
- **Backup**: prima di ogni scrittura, se sono passati almeno 10 minuti, lo store
  corrente viene copiato in `data/backups/route-<timestamp>.json` (ultimi 20 file).
- Se un processo scrive mentre un altro è attivo, il backup permette di
  recuperare lo stato precedente.

Per ripristinare:

```bash
cp data/backups/route-<timestamp>.json data/route.json   # server fermo
```

## Integrazione N.I.C.O.

Il function calling `route_insert_shift` scrive sullo stesso store: i turni dettati in chat
(anche nella modalità fallback senza API key) compaiono immediatamente nell'agenda e nella
HUD della Navicella.
