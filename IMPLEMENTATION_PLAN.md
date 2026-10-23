# Piano di implementazione — Ottica Montinaro

Piattaforma per catalogo lenti a contatto, ordini, pagamento al ritiro, abbonamenti Stripe e scadenziario. Interfaccia in italiano. Repository vuota all’avvio. Sito istituzionale non raggiungibile (HTTP 500): identità visiva provvisoria, vedi `BRAND_ASSETS_NEEDED.md`.

## Principi

- Prezzi in centesimi interi. Date di business in `Europe/Rome`, timestamp salvati in UTC.
- Stripe è la fonte finanziaria per i pagamenti online. Il registro interno è la fonte per contanti e carta/POS al ritiro.
- Prescrizioni e parametri oculari non finiscono in log, URL, analytics o email.
- Ogni azione sensibile è autorizzata sul server.
- I testi legali sono bozze.

## Fasi

1. **Fondamenta.** Next.js, TypeScript strict, Tailwind, componenti in stile shadcn, env tipizzato, header di sicurezza, lint e test.
2. **Dati.** Schema Drizzle normalizzato, migrazione SQL, connessione Neon serverless oppure Postgres/PGlite in locale.
3. **Dominio.** Calcolo scadenze, consumo lenti, macchine a stati, validazione parametri, privacy, idempotenza. Test Vitest prima dell’interfaccia.
4. **Accesso.** Better Auth, ruoli ADMIN / OPERATOR / CUSTOMER, verifica email, reset password, consenso privacy immutabile, script del primo amministratore.
5. **Catalogo e vetrina.** Pagine pubbliche, filtri, carrello per utenti registrati, checkout con ritiro o spedizione.
6. **Ordini e incassi.** Pagamento online Stripe, pagamento al ritiro senza Stripe, incasso atomico, storico movimenti, blocco consegna se il saldo è dovuto.
7. **Prescrizioni, scadenziario, promemoria.** Validazione staff, cron protetto, email React Email / Resend, outbox in sviluppo.
8. **Back office.** Dashboard, anagrafiche, CSV, incassi, audit, impostazioni configurabili.
9. **Abbonamenti.** Checkout ricorrente, portale Stripe, proiezione stati, blocco evasione se la prescrizione è scaduta.
10. **Qualità.** Test end-to-end dei flussi principali, build, documentazione operativa e checklist di pubblicazione.

## Decisioni applicate

| Tema | Scelta |
| --- | --- |
| Checkout ospite | Non previsto: l’acquisto richiede un account, così prescrizione e consensi restano collegati alla persona. |
| Prezzo esposto | IVA inclusa. Lo scontrino fiscale resta al registratore di cassa. |
| Varianti | Regole di gamma sul prodotto. SKU separata solo se serve davvero. |
| Database locale | `pglite:` per sviluppo e test senza credenziali Neon. Produzione: Neon. |
| Email senza Resend | In sviluppo le email vanno in outbox consultabile. In produzione Resend è obbligatorio. |
| Analytics | Disattivati. Nessun cookie banner finché non si attivano cookie non necessari. |
| Logo | Wordmark tipografico provvisorio, nessun hotlink. |

## Fuori da questo repository

Pubblicazione reale su Neon, Vercel, Stripe live, Resend e dominio. Le azioni manuali sono in `DEPLOYMENT_CHECKLIST.md`. Non vengono simulate.
