# Materiali di marca mancanti

Audit del 23 ottobre 2026.

## Esito dell’audit

Il sito istituzionale `https://www.otticamontinaro.it` e `https://otticamontinaro.it` non è stato utilizzabile come fonte visiva:

- il server Aruba ha risposto `HTTP 500 Internal Server Error`;
- il browser ha ricevuto una pagina di errore vuota, senza HTML del sito, senza CSS e senza immagini.

Non è stato quindi possibile rilevare in modo affidabile logo, colori, font, stile di pulsanti, card, fotografie, spaziature o navigazione reale. I contenuti testuali citati in questa piattaforma (claim “dal 1984”, indirizzo e telefono) provengono dalla richiesta di progetto e da risultati di ricerca pubblici, e restano **da confermare dal titolare**.

Non sono state importate né collegate immagini del sito. Non è stato copiato un logo.

## Token grafici provvisori

L’interfaccia usa un design system marcato `PROVVISORIO` in `src/styles/brand.ts` e nel commento di `src/app/globals.css`.

Sostituirlo prima della produzione. Non va presentato al pubblico come identità ufficiale di Ottica Montinaro.

## Materiali da fornire

1. Logo principale in SVG (versione orizzontale e versione compatta).
2. Eventuali varianti: positivo, negativo, monocromatico.
3. Favicon e icona app (SVG o PNG 512×512).
4. Codici colore ufficiali (primario, secondario, sfondo, testo, stato).
5. Font con licenza d’uso web, oppure conferma a usare i font provvisori (Source Serif 4 e Source Sans 3, con licenza Open Font License).
6. Foto del negozio, del personale e dei prodotti **di cui il titolare possiede i diritti**, in formato WebP o JPEG, senza watermark di terzi.
7. Testi istituzionali approvati: claim, presentazione, servizi.
8. Orari di apertura verificati.
9. Email e telefono da pubblicare.
10. Partita IVA e dati del titolare del trattamento, solo dopo conferma del consulente.
11. Icona o marchio per le email transazionali.

## Cosa non fare

- Non usare loghi di produttori di lenti (Johnson & Johnson, Alcon, Bausch, CooperVision, ecc.) senza contratto.
- Non incorporare fotografie scaricate dal sito attuale finché non è chiaro il diritto d’uso.
