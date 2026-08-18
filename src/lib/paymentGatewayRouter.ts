import { detectCurrency, exchangeRates, type Currency } from "@/i18n";
import { type CountryTierRouting } from "@/hooks/useCountryTierRouting";

export type PaymentGateway = 'stripe' | 'paypal' | 'mercadopago' | 'dlocal' | 'binance' | 'manual';

export interface PaymentPayload {
  amount: number | string;
  currency: string;
  formattedPrice?: string;
  amountUsdt?: string;
  gateway: PaymentGateway;
  countryCode: string;
}

/**
 * Mapeo dinámico de montos y monedas para pasarelas de pago basado en la lógica regional.
 */
export function getPaymentPayload(
  countryPricing: Partial<CountryTierRouting>, 
  gateway: PaymentGateway,
  countryCode: string
): PaymentPayload {
  // Extraemos los valores calculados por el hook useCountryTierRouting
  // Si no vienen (ej. en un contexto de prueba), hacemos fallback a la lógica base
  const finalAmount = countryPricing.finalPriceAmount || 0;
  const currency = (countryPricing.currencyCode || "USD") as Currency;
  const rate = countryPricing.exchangeRate || exchangeRates[currency] || 1;
  const regionUsdPrice = countryPricing.priceUsd || (finalAmount / rate);

  switch (gateway) {
    case 'paypal': {
      // PayPal: Si la moneda no es soportada (PEN, COP, etc), reconvertimos al USD del Tier Regional
      const paypalSupported = ['USD', 'EUR', 'MXN', 'GBP', 'CAD', 'AUD'].includes(currency);
      return {
        gateway,
        countryCode,
        amount: paypalSupported ? finalAmount.toFixed(2) : regionUsdPrice.toFixed(2),
        currency: paypalSupported ? currency : 'USD'
      };
    }

    case 'stripe': {
      // Stripe: Usa centavos (x100) para la mayoría, excepto zero-decimal (CLP, PYG, etc)
      const zeroDecimalCurrencies = ['CLP', 'PYG', 'UGX', 'VND', 'DJF', 'GNF', 'KMF', 'KRW', 'LAK', 'MGA', 'PYG', 'RWF', 'VUV', 'XAF', 'XOF', 'XPF'];
      const isZeroDecimal = zeroDecimalCurrencies.includes(currency);
      
      return {
        gateway,
        countryCode,
        amount: isZeroDecimal ? Math.round(finalAmount) : Math.round(finalAmount * 100),
        currency: currency.toLowerCase(),
        formattedPrice: countryPricing.priceLabel
      };
    }

    case 'mercadopago':
      // Mercado Pago: MX/PE usan moneda local
      return {
        gateway,
        countryCode,
        amount: Math.round(finalAmount * 100) / 100,
        currency: currency
      };

    case 'dlocal':
      // dLocal Go: Siempre moneda local LATAM redondeada
      return {
        gateway,
        countryCode,
        amount: Math.round(finalAmount * 100) / 100,
        currency: currency
      };

    case 'binance':
      // Binance Pay: Usa el equivalente en USD del Tier Regional (USDT)
      return {
        gateway,
        countryCode,
        amount: regionUsdPrice.toFixed(2),
        amountUsdt: regionUsdPrice.toFixed(2),
        currency: 'USDT'
      };
    
    case 'manual':
      // Yape/Plin (PEN) o SPEI (MXN)
      return {
        gateway,
        countryCode,
        amount: Math.round(finalAmount),
        currency: currency
      };

    default:
      return {
        gateway,
        countryCode,
        amount: finalAmount,
        currency: currency
      };
  }
}
