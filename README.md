# Ottica Montinaro — gestionale lenti a contatto

Applicazione Next.js per catalogo, ordini, abbonamenti, ritiro in negozio e scadenziario. L'interfaccia è in italiano. I testi legali e i dati di contatto non verificati dal titolare sono bozze.

## Requisiti

- Node.js 22 o superiore (in questo ambiente è stato usato Node 24 portabile)
- npm 11
- Per lo sviluppo locale non serve Neon: il database predefinito può essere PGlite

## Avvio locale

```powershell
copy .env.example .env
```

In `.env` per il solo sviluppo:

```
DATABASE_URL=pglite:./.data/pglite
BETTER_AUTH_SECRET=dev-only-secret-change-before-any-deploy-32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=dev-cron-secret-not-for-production
EMAIL_OUTBOX=true
AUTO_MIGRATE=true
SEED_ON_BOOT=true
```

Poi:

```powershell
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

`AUTO_MIGRATE` e `SEED_ON_BOOT` valgono solo per un URL `pglite:` e non vanno attivati in produzione.

## Account demo

Password di tutti gli account demo: `Demo-Password-1`. Non usarla in produzione.

- `demo.admin@example.com` — amministratore
- `demo.operatore@example.com` — operatore
- `demo.cliente@example.com` — cliente
- `demo.cliente2@example.com` — cliente

Il seed rifiuta l'ambiente di produzione se `ALLOW_DEMO_SEED` non è `true`.

## Primo amministratore reale

Non inserire la password nel repository. Da una shell, con le variabili solo per quel processo:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "una-password-di-almeno-12-caratteri"
$env:ADMIN_NAME = "Nome Cognome"
npm run admin:create
```

## Comandi

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`

## Stripe in test mode

Lascia `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` vuoti per provare il pagamento al ritiro senza Stripe. Per il checkout online:

1. Installa Stripe CLI.
2. `stripe login`
3. `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copia il `whsec_` mostrato in `STRIPE_WEBHOOK_SECRET`.
5. Usa chiavi `sk_test_` e `pk_test_`.
6. Carta di prova `4242 4242 4242 4242`, data futura, CVC qualsiasi.

Il redirect del browser non aggiorna lo stock. Lo fa solo il webhook firmato.

## Email

Con `EMAIL_OUTBOX=true` i messaggi restano nella tabella `email_outbox` e non partono da Resend. In produzione servono `RESEND_API_KEY` e un mittente verificato.

## Documentazione

- `IMPLEMENTATION_PLAN.md`
- `BRAND_ASSETS_NEEDED.md`
- `DEPLOYMENT_CHECKLIST.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/stripe.md`
- `docs/in-store-payments.md`
- `docs/privacy-and-retention.md`
- `docs/operations.md`
