# Operatività

## Ogni giorno

Il cron `GET /api/cron/reminders` con `Authorization: Bearer <CRON_SECRET>`:

- ricalcola gli stati delle scadenze in `Europe/Rome`
- invia al massimo un promemoria per chiave di idempotenza
- lavora a lotti e continua se un destinatario fallisce
- segna le prenotazioni scadute
- marca scadute le configurazioni oltre la validità
- blocca l'evasione dell'abbonamento se la configurazione collegata è scaduta, senza cancellare l'abbonamento

## Promemoria

Scostamenti predefiniti: 30, 14 e 7 giorni prima, il giorno stesso, 7 giorni dopo. Si cambiano in `app_settings` (`reminderOffsetsDays`).

## Impostazioni, non costanti

Soglia e costo di spedizione, durata prenotazione, pagamento al ritiro, metodi accettati, eventuale massimale, validità della configurazione, indirizzo e istruzioni di ritiro, orari, telefono, email, finestra di annullamento e frequenze di abbonamento stanno nel JSON `store`. I default sono in `src/lib/settings.ts`. Orari ed email restano vuoti finché il titolare non li conferma.

## Dati provvisori

Nome Ottica Montinaro, Calimera (LE), Via Roma 14, telefono 0832 873284, attività dal 1984. Non pubblicare partita IVA, email, orari o condizioni finché non sono verificati. L'aliquota IVA predefinita è 22% e va confermata: alcune forniture sanitarie possono avere un'aliquota diversa.

## Identità visiva

Il sito istituzionale rispondeva HTTP 500 durante l'analisi. Colori, font e marchio tipografico sono provvisori. Vedi `BRAND_ASSETS_NEEDED.md`.

## Incidenti

- Webhook Stripe duplicato: la chiave primaria lo ignora.
- Incasso duplicato: la transazione e l'indice unico lo rifiutano.
- Email non partita: resta `FAILED` o in `email_outbox` se l'outbox è attivo.
- Database: ripristina lo snapshot Neon descritto in `DEPLOYMENT_CHECKLIST.md`.
