import { CAMPAIGN_CURRENCIES, CampaignCurrency, CampaignPrice } from "@/hooks/useCampaignPrice";

const FLAGS: Record<CampaignCurrency, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  COP: "🇨🇴",
  ARS: "🇦🇷",
  PEN: "🇵🇪",
  MXN: "🇲🇽",
  CLP: "🇨🇱",
  BRL: "🇧🇷",
  UYU: "🇺🇾",
  BOB: "🇧🇴",
  PYG: "🇵🇾",
  GTQ: "🇬🇹",
  DOP: "🇩🇴",
  CRC: "🇨🇷",
  HNL: "🇭🇳",
  NIO: "🇳🇮",
  VES: "🇻🇪",
  NZD: "🇳🇿",
  SEK: "🇸🇪",
  NOK: "🇳🇴",
  DKK: "🇩🇰",
  CHF: "🇨🇭",
  JPY: "🇯🇵",
  KRW: "🇰🇷",
  SGD: "🇸🇬",
  HKD: "🇭🇰",
  TWD: "🇹🇼",
};

interface Props {
  campaign: CampaignPrice;
  className?: string;
}

/** Compact pill selector to preview each currency. Useful for QA & user choice. */
export const CampaignCurrencySelector = ({ campaign, className = "" }: Props) => {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="text-[11px] text-muted-foreground mr-1">Currency:</span>
      {CAMPAIGN_CURRENCIES.map((c) => {
        const active = campaign.currency === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => campaign.setCurrency(c)}
            className={`text-[11px] font-semibold px-2 py-1 rounded-full border transition-colors ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
            aria-pressed={active}
          >
            {FLAGS[c]} {c}
          </button>
        );
      })}
    </div>
  );
};
