# Stripe

Stripe gestisce solo i pagamenti online e gli abbonamenti. Il pagamento al ritiro non crea sessioni, PaymentIntent o eventi finti.

## Route

- Webhook: `POST /api/stripe/webhook`. Verifica la firma con il body grezzo e `STRIPE_WEBHOOK_SECRET`.
- Il checkout una tantum e il checkout abbonamento partono da Server Action (`startOnlineCheckout`, `startSubscriptionCheckout`) che creano la Checkout Session sul server.
- Il Customer Portal si apre con `openBillingPortal`.

## Eventi

`checkout.session.completed` segna l'ordine pagato, scrive il movimento e scala lo stock. `invoice.paid` e `invoice.payment_failed` aggiornano l'abbonamento. `customer.subscription.*` allinea lo stato. `charge.refunded` aggiunge un movimento di rimborso senza modificare lo storico precedente.

Ogni event id viene inserito con conflitto ignorato. Se l'elaborazione fallisce, la riga viene cancellata così Stripe può riprovare.

## Test locale

```powershell
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Usa chiavi di test. La carta `4242 4242 4242 4242` completa il pagamento. Per un pagamento fallito usa `4000 0000 0000 0002`.

Gli abbonamenti usano `interval: day` e `interval_count` 30, 60 o 90. La fine del periodo si legge da `subscription.items.data[0].current_period_end`.
