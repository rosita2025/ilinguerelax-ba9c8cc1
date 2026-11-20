/**
 * PayPal directo está APAGADO mientras la cuenta de PayPal del negocio siga restringida
 * (PayPal responde `PAYEE_ACCOUNT_RESTRICTED` al crear cualquier orden, en todos los países).
 * Cuando PayPal levante la restricción, poner en `false`: la fila vuelve a depender de /admin/checkout-methods.
 */
export const PAYPAL_UNAVAILABLE = true;

/**
 * dLocal Go está APAGADO: dLocal bloqueó la cuenta del negocio (transferencias, efectivo y billetera de dLocal ya no se pueden cobrar).
 * Se ocultan sus filas en el checkout y `payDlocal` no llama a la función. La billetera de Whop (Nequi, Mercado Pago) y Addi NO se tocan.
 * Cuando dLocal reactive la cuenta, poner en `false`: las filas vuelven a depender de /admin/checkout-methods.
 */
export const DLOCAL_UNAVAILABLE = true;
