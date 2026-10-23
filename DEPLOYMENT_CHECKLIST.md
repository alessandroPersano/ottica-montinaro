# Checklist di pubblicazione

Nessun progetto Neon, Vercel, Stripe live o Resend è stato collegato: mancano credenziali autenticate. Non inserire chiavi o connection string in Git.

## Neon

1. Crea un progetto nella regione più vicina al deployment Vercel (in Europa, `eu-central-1` se il progetto Vercel è a Francoforte).
2. Usa la connection string serverless con SSL. Mettila solo nelle variabili Vercel, come `DATABASE_URL`.
3. Crea un branch Neon per le preview, distinto dal database di produzione.
4. In produzione esegui `npm run db:migrate` da una macchina controllata, dopo un backup.
5. Non eseguire il seed demo in produzione.

## Vercel

1. Crea il progetto e collega il repository Git.
2. Imposta le variabili per Production, Preview e Development. Le preview non devono puntare al database di produzione.
3. Obbligatorie: `DATABASE_URL`, `BETTER_AUTH_SECRET` (almeno 32 caratteri), `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET` (almeno 16 caratteri).
4. Produzione Vercel (`VERCEL_ENV=production`): `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`. Senza queste variabili il processo di produzione si ferma con un messaggio esplicito. Una build locale può partire senza Stripe: il pagamento al ritiro non lo usa.
5. Lascia `EMAIL_OUTBOX`, `AUTO_MIGRATE`, `SEED_ON_BOOT` e `E2E_TEST_HELPERS` disattivi.
6. Il cron è in `vercel.json`: `GET /api/cron/reminders` alle 05:00 UTC. Il job interpreta le date in `Europe/Rome`. Vercel deve inviare `Authorization: Bearer <CRON_SECRET>`.
7. Collega il dominio solo dopo i testi e i dati verificati.

## Stripe

1. In test mode registra `https://<dominio>/api/stripe/webhook`.
2. Eventi: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`.
3. Attiva il Customer Portal per carta, fatture e disdetta.
4. Passa alle chiavi live solo dopo lo smoke test.

## Resend

Verifica il dominio mittente e usa `EMAIL_FROM` di quel dominio. Controlla che le email non contengano parametri clinici.

## Primo accesso e smoke test

1. `npm run admin:create` con le variabili d'ambiente, senza stamparle nei log.
2. Registrazione con informativa privacy, login, reset password.
3. Ordine con ritiro e pagamento in negozio, senza sessione Stripe.
4. Incasso contanti e incasso carta/POS, poi secondo tentativo bloccato.
5. Consegna bloccata se il saldo è dovuto.
6. Checkout Stripe di prova e webhook firmato.
7. Cron con segreto corretto e con segreto errato.

## Rollback e backup

- Prima di ogni migrazione: snapshot Neon.
- Per tornare indietro: ripristina lo snapshot e ridistribuisci il deployment precedente su Vercel.
- Le migrazioni attuali sono solo additive (`drizzle/0000_init.sql`). Un rollback di schema non è automatico.
- Conserva i backup secondo la retention fiscale configurata (default 10 anni per gli ordini).
