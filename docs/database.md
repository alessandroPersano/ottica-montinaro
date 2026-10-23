# Database

PostgreSQL tramite Drizzle. I prezzi sono interi in centesimi. I timestamp sono UTC. Gli identificativi interni sono UUID, tranne gli utenti Better Auth che usano id testuali UUID generati dalla libreria.

## Driver

`src/db/index.ts` sceglie il driver da `DATABASE_URL`:

- `pglite:` — file o memoria, per sviluppo e test
- host `neon.tech` — pool serverless, con transazioni
- altri URL — postgres.js

La migrazione iniziale è `drizzle/0000_init.sql`. Si applica con `npm run db:migrate`.

## Vincoli rilevanti

- `orders.public_number` è univoco e leggibile (`OM-YYYY-#####`), separato dall'UUID.
- `payments` ha un indice unico parziale: un solo incasso in negozio saldato per ordine (`origin = IN_STORE` e stato `PAID`, `PARTIALLY_REFUNDED` o `REFUNDED`).
- `stripe_events.id` è univoco e rende idempotente il webhook.
- `reminder_deliveries` usa una chiave di idempotenza univoca.
- `privacy_documents` è univoco su tipo e versione.
- `consent_events` è append-only: non si aggiorna una riga per revocare, si inserisce un nuovo evento.

## Cosa non è in foreign key

`inventory_movements.order_id` e `orders.subscription_id` non hanno foreign key, per evitare il ciclo di dichiarazione nello schema. L'applicazione scrive solo id esistenti.

## Seed

`npm run db:seed` è ripetibile: cancella i record demo per id fissi e li reinserisce. I prodotti, i clienti e gli ordini sono fittizi e marcati `is_demo`.
