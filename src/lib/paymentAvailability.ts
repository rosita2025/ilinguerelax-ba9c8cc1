/**
 * PayPal directo está APAGADO mientras la cuenta de PayPal del negocio siga restringida
 * (PayPal responde `PAYEE_ACCOUNT_RESTRICTED` al crear cualquier orden, en todos los países).
 * Cuando PayPal levante la restricción, poner en `false`: la fila vuelve a depender de /admin/checkout-methods.
 */
export const PAYPAL_UNAVAILABLE = true;
