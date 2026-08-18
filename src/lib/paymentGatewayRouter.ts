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
  const price = countryPricing.priceUsd ? (countryPricing.priceUsd * (exchangeRates[countryPricing.currencyCode as Currency] || 1)) : 0;
  // Si useCountryTierRouting ya calculó el finalPriceAmount, deberíamos recibirlo. 
  // Pero para ser robustos, recalculamos o extraemos del hook.
  
  // Asumimos que countryPricing viene del hook useCountryTierRouting o sumItemsLocal
  const finalPrice = (countryPricing as any).finalPriceAmount || price;
  const currency = (countryPricing.currencyCode || "USD") as Currency;
  const rate = exchangeRates[currency] || 1;

  switch (gateway) {
    case 'paypal': {
      // Fallback a USD para monedas no soportadas por PayPal como COP/PEN
      const paypalSupported = ['USD', 'EUR', 'MXN', 'GBP', 'CAD', 'AUD'].includes(currency);
      return {
        gateway,
        countryCode,
        amount: paypalSupported ? finalPrice.toFixed(2) : (finalPrice / rate).toFixed(2),
        currency: paypalSupported ? currency : 'USD'
      };
    }

    case 'stripe': {
      // Stripe usa centavos para la mayoría de monedas (USD, EUR, MXN, PEN)
      // Pero montos enteros para CLP, PYG, etc.
      const zeroDecimalCurrencies = ['CLP', 'PYG', 'UGX', 'VND', 'DJF', 'GNF', 'KMF', 'KRW', 'LAK', 'MGA', 'PYG', 'RWF', 'VUV', 'XAF', 'XOF', 'XPF'];
      const isZeroDecimal = zeroDecimalCurrencies.includes(currency);
      
      return {
        gateway,
        countryCode,
        amount: isZeroDecimal ? Math.round(finalPrice) : Math.round(finalPrice * 100),
        currency: currency.toLowerCase(),
        formattedPrice: countryPricing.priceLabel
      };
    }

    case 'mercadopago':
      // Mercado Pago en MX/PE usa moneda local
      return {
        gateway,
        countryCode,
        amount: Math.round(finalPrice * 100) / 100,
        currency: currency
      };

    case 'dlocal':
      // dLocal Go siempre moneda local LATAM
      return {
        gateway,
        countryCode,
        amount: Math.round(finalPrice * 100) / 100,
        currency: currency
      };

    case 'binance':
      // Binance Pay usa USDT (USD equivalente)
      return {
        gateway,
        countryCode,
        amount: (finalPrice / rate).toFixed(2),
        amountUsdt: (finalPrice / rate).toFixed(2),
        currency: 'USDT'
      };
    
    case 'manual':
      // Yape/Plin (PE) o SPEI (MX)
      return {
        gateway,
        countryCode,
        amount: finalPrice,
        currency: currency
      };

    default:
      return {
        gateway,
        countryCode,
        amount: finalPrice,
        currency: currency
      };
  }
}
