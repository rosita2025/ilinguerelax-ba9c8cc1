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
  countryPricing: {
    priceUsd: number;
    currencyCode: string;
    finalPriceAmount: number;
    priceLabel?: string;
    exchangeRate?: number;
  }, 
  gateway: PaymentGateway,
  countryCode: string
): PaymentPayload {
  const finalAmount = countryPricing.finalPriceAmount || 0;
  const currency = (countryPricing.currencyCode || "USD") as Currency;
  const regionUsdPrice = countryPricing.priceUsd;

  switch (gateway) {
    case 'paypal': {
      // PayPal: Si la moneda no es soportada, reconvertimos al USD del Tier Regional
      const paypalSupported = ['USD', 'EUR', 'MXN', 'GBP', 'CAD', 'AUD', 'BRL'].includes(currency);
      return {
        gateway,
        countryCode,
        amount: paypalSupported ? finalAmount.toFixed(2) : regionUsdPrice.toFixed(2),
        currency: paypalSupported ? currency : 'USD'
      };
    }

    case 'stripe': {
      // Stripe: Usa centavos (x100) para la mayoría, excepto zero-decimal
      const zeroDecimalCurrencies = ['CLP', 'PYG', 'UGX', 'VND', 'DJF', 'GNF', 'KMF', 'KRW', 'LAK', 'MGA', 'RWF', 'VUV', 'XAF', 'XOF', 'XPF'];
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
    case 'dlocal':
      return {
        gateway,
        countryCode,
        amount: Number(finalAmount.toFixed(2)),
        currency: currency
      };

    case 'binance':
      return {
        gateway,
        countryCode,
        amount: regionUsdPrice.toFixed(2),
        amountUsdt: regionUsdPrice.toFixed(2),
        currency: 'USDT'
      };
    
    case 'manual':
      // Para Yape usamos soles, para SPEI usamos MXN, etc.
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
