# Pagamenti in negozio

## Due canali distinti

Il pagamento online crea una Checkout Session Stripe. Il cliente paga prima del ritiro o della spedizione e lo stato diventa pagato solo dopo il webhook.

Il pagamento al ritiro non parla con Stripe. Il cliente sceglie una sola opzione: «Paga in negozio al ritiro — in contanti o con carta». L'ordine nasce con pagamento dovuto. La merce è prenotata per i giorni configurati (default 7).

## Contanti

Al banco l'operatore apre l'ordine, sceglie Contanti, indica l'importo dovuto, un eventuale riferimento e registra. Il sistema scrive in una sola transazione il pagamento `CASH_AT_PICKUP`, il movimento `CHARGE`, la ricevuta interna, lo storico e l'audit. Non memorizza dati di carta perché non ce ne sono.

## Carta / POS

La carta fisica si passa sul POS del negozio. Nell'applicazione si registra solo l'esito: metodo `CARD_AT_PICKUP`, importo, data, operatore e riferimento dello scontrino o del POS. Numero carta e CVC non vanno inseriti.

## Fine giornata

La vista «Incassi in negozio» somma i movimenti interni per metodo. Si usa per confrontare la cassa e il POS. Non chiude il registratore telematico e non sostituisce la contabilità.

## Storni

Un incasso registrato non si modifica. Una correzione crea un nuovo movimento di rimborso, con motivazione di almeno 8 caratteri, e lascia la ricevuta originale.

## Scadenza della prenotazione

Il cron marca come scadute le prenotazioni oltre `reservedUntil`. Lo staff può prorogare o annullare indicando il motivo. Finché il saldo è dovuto, la consegna è bloccata. Solo un amministratore può forzare la consegna, con una motivazione obbligatoria.

## Responsabilità

L'operatore verifica l'identità, l'importo e il metodo reale prima di registrare. Un doppio click con la stessa chiave di idempotenza non crea un secondo incasso. Una seconda chiave, a ordine già saldato, viene rifiutata.

## Limiti

Il sistema non emette scontrini fiscali, non dialoga con il POS e non è un libro giornale. I totali servono alla gestione interna. Fiscalità, corrispettivi e registratore telematico restano fuori da questa applicazione.
