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
  -d '{"subject":"Chimica Organica II","date":"2026-12-05","time":"09:00","status":"prenotato","priority":"alta","cfu":8}'

curl "localhost:3000/api/route/agenda?from=2026-11-02&to=2026-11-08&buffer=30"
```

## Integrazione N.I.C.O.

Il function calling `route_insert_shift` scrive sullo stesso store: i turni dettati in chat
(anche nella modalità fallback senza API key) compaiono immediatamente nell'agenda e nella
HUD della Navicella.
