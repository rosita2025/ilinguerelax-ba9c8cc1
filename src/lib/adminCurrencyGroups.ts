/** Monedas locales del admin agrupadas en las 5 regiones (se usan en /admin/monedas). */
export type CurrencyGroup = "LATAM" | "EUROPA" | "USA_CANADA" | "ASIA" | "RESTO";
export const GROUP_TITLE: Record<CurrencyGroup, string> = { LATAM: "🌎 LATAM", EUROPA: "🇪🇺 Europa", USA_CANADA: "🇺🇸 USA y Canadá", ASIA: "🌏 Asia", RESTO: "🌍 Resto del mundo" };
export const GROUP_HINT: Record<CurrencyGroup, string> = {
  LATAM: "Usa el precio de LATAM (US$)",
  EUROPA: "TODA Europa ve y paga en euros (España, Francia, Alemania, Italia, Reino Unido, Suiza, Suecia, Noruega, Dinamarca, Polonia, Chequia…): usa el precio de Europa (€). Las otras monedas europeas solo se ven si el visitante las elige a mano en el selector",
  USA_CANADA: "Usa el precio de USA y Canadá (US$)",
  ASIA: "Usa el precio de Asia y resto del mundo (US$)",
  RESTO: "Usa el precio de Asia y resto del mundo (US$); Australia y Nueva Zelanda, por ahora, el de USA y Canadá",
};
/** Monedas locales del admin, agrupadas en las 5 regiones. `region` decide qué precio base USD se usa (igual que el servidor y la página). */
export const LOCAL_CURRENCY_CARDS: { code: string; flag: string; label: string; region: "LATAM" | "Anglosphere/Europe" | "Asia" | "Africa"; group: CurrencyGroup }[] = [
  // LATAM
  { code: "MXN", flag: "🇲🇽", label: "México", region: "LATAM", group: "LATAM" },
  { code: "COP", flag: "🇨🇴", label: "Colombia", region: "LATAM", group: "LATAM" },
  { code: "ARS", flag: "🇦🇷", label: "Argentina", region: "LATAM", group: "LATAM" },
  { code: "CLP", flag: "🇨🇱", label: "Chile", region: "LATAM", group: "LATAM" },
  { code: "BRL", flag: "🇧🇷", label: "Brasil", region: "LATAM", group: "LATAM" },
  { code: "PEN", flag: "🇵🇪", label: "Perú", region: "LATAM", group: "LATAM" },
  { code: "UYU", flag: "🇺🇾", label: "Uruguay", region: "LATAM", group: "LATAM" },
  { code: "PYG", flag: "🇵🇾", label: "Paraguay", region: "LATAM", group: "LATAM" },
  { code: "BOB", flag: "🇧🇴", label: "Bolivia", region: "LATAM", group: "LATAM" },
  { code: "CRC", flag: "🇨🇷", label: "Costa Rica", region: "LATAM", group: "LATAM" },
  { code: "DOP", flag: "🇩🇴", label: "Rep. Dominicana", region: "LATAM", group: "LATAM" },
  { code: "GTQ", flag: "🇬🇹", label: "Guatemala", region: "LATAM", group: "LATAM" },
  { code: "HNL", flag: "🇭🇳", label: "Honduras", region: "LATAM", group: "LATAM" },
  { code: "NIO", flag: "🇳🇮", label: "Nicaragua", region: "LATAM", group: "LATAM" },
  { code: "VES", flag: "🇻🇪", label: "Venezuela", region: "LATAM", group: "LATAM" },
  // Europa
  { code: "EUR", flag: "🇪🇺", label: "Europa (euro)", region: "Anglosphere/Europe", group: "EUROPA" },
  { code: "GBP", flag: "🇬🇧", label: "Reino Unido", region: "Anglosphere/Europe", group: "EUROPA" },
  { code: "CHF", flag: "🇨🇭", label: "Suiza", region: "Anglosphere/Europe", group: "EUROPA" },
  { code: "SEK", flag: "🇸🇪", label: "Suecia", region: "Anglosphere/Europe", group: "EUROPA" },
  { code: "NOK", flag: "🇳🇴", label: "Noruega", region: "Anglosphere/Europe", group: "EUROPA" },
  { code: "DKK", flag: "🇩🇰", label: "Dinamarca", region: "Anglosphere/Europe", group: "EUROPA" },
  { code: "PLN", flag: "🇵🇱", label: "Polonia", region: "Anglosphere/Europe", group: "EUROPA" },
  { code: "CZK", flag: "🇨🇿", label: "Rep. Checa", region: "Anglosphere/Europe", group: "EUROPA" },
  // USA y Canadá: Estados Unidos ve US$ con el precio de USA y Canadá (no hay tarjeta USD: un precio fijo en USD pisaría los precios de todas las regiones que ven dólares)
  { code: "CAD", flag: "🇨🇦", label: "Canadá", region: "Anglosphere/Europe", group: "USA_CANADA" },
  // Asia
  { code: "JPY", flag: "🇯🇵", label: "Japón", region: "Asia", group: "ASIA" },
  { code: "KRW", flag: "🇰🇷", label: "Corea del Sur", region: "Asia", group: "ASIA" },
  { code: "CNY", flag: "🇨🇳", label: "China", region: "Asia", group: "ASIA" },
  { code: "INR", flag: "🇮🇳", label: "India", region: "Asia", group: "ASIA" },
  { code: "SGD", flag: "🇸🇬", label: "Singapur", region: "Asia", group: "ASIA" },
  { code: "HKD", flag: "🇭🇰", label: "Hong Kong", region: "Asia", group: "ASIA" },
  { code: "TWD", flag: "🇹🇼", label: "Taiwán", region: "Asia", group: "ASIA" },
  { code: "IDR", flag: "🇮🇩", label: "Indonesia", region: "Asia", group: "ASIA" },
  { code: "MYR", flag: "🇲🇾", label: "Malasia", region: "Asia", group: "ASIA" },
  // Resto del mundo
  { code: "AUD", flag: "🇦🇺", label: "Australia", region: "Anglosphere/Europe", group: "RESTO" },
  { code: "NZD", flag: "🇳🇿", label: "Nueva Zelanda", region: "Anglosphere/Europe", group: "RESTO" },
  { code: "ZAR", flag: "🇿🇦", label: "Sudáfrica", region: "Africa", group: "RESTO" },
  { code: "NGN", flag: "🇳🇬", label: "Nigeria", region: "Africa", group: "RESTO" },
  { code: "EGP", flag: "🇪🇬", label: "Egipto", region: "Africa", group: "RESTO" },
  { code: "KES", flag: "🇰🇪", label: "Kenia", region: "Africa", group: "RESTO" },
  { code: "MAD", flag: "🇲🇦", label: "Marruecos", region: "Africa", group: "RESTO" },
];
