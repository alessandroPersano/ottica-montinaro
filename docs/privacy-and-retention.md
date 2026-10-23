# Privacy e conservazione

I testi in `/privacy`, `/cookie`, `/termini`, `/condizioni-di-vendita` e `/spedizioni-e-ritiro` sono bozze. Vanno riletti da un professionista prima della produzione. L'applicazione non sceglie la base giuridica del trattamento clinico.

## Consensi

La checkbox dell'informativa privacy è obbligatoria e non preselezionata. Il link si apre in una nuova scheda. Senza accettazione l'account non viene creato: la Server Action rifiuta la richiesta e un hook Better Auth esige una prova HMAC `x-om-consent` firmata con `BETTER_AUTH_SECRET`, valida cinque minuti.

Il marketing è una checkbox separata, facoltativa e non preselezionata. La revoca si registra come nuovo evento, non come modifica di quello precedente.

Se `clinicalConsentRequired` è attivo (default), una configurazione inserita online richiede anche il consenso segnaposto. Il testo va sostituito dopo il parere del consulente.

Ogni evento conserva utente, tipo, versione, timestamp UTC, fonte (`SIGNUP`, `CHECKOUT` o `PROFILE`) e hash del testo. IP e user agent non sono salvati finché il consulente non lo conferma.

## Dati clinici

Si raccolgono solo i parametri necessari all'ordine. Non finiscono nei log, negli URL, nelle analytics o nel corpo delle email. I log scartano chiavi che ricordano password, token, sfera, cilindro, asse, addizione e prescrizione.

## Diritti

L'area personale mostra i consensi. La richiesta di rettifica o cancellazione va tracciata in `privacy_requests`. L'anonimizzazione deve conservare gli importi degli ordini per il periodo fiscale (`retentionOrdersYears`, default 10) e rimuovere nome, contatti e parametri clinici. L'export completo dell'interessato è ancora da collegare a un pulsante dedicato: i dati sono già nel database e l'endpoint va attivato insieme alla procedura del consulente.

## Cookie e analytics

Sono usati solo cookie di sessione, necessari all'accesso. Non c'è un banner. Le analytics restano spente finché non esiste un consenso valido e una configurazione esplicita.

## Email

I promemoria di servizio non includono i parametri dell'occhio. Le comunicazioni promozionali richiedono il consenso marketing e un link di disiscrizione. I promemoria di scadenza ordine e ritiro sono comunicazioni di servizio.
