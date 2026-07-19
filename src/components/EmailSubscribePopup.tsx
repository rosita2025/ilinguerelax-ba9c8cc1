import { useEffect, useState } from "react";
import { X, Mail, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nContext";

const STORAGE_KEY = "ilr_newsletter_popup_v2";
const COOKIE_KEY = "ilr_newsletter_popup";
const DELAY_MS = 15000;
const DISMISS_TTL_DAYS = 7;
const SUBSCRIBED_TTL_DAYS = 365;

type PopupState = { status: "dismissed" | "subscribed"; until: number };

function readState(): PopupState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PopupState;
      if (parsed?.until && parsed.until > Date.now()) return parsed;
      if (parsed?.until && parsed.until <= Date.now()) localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]+)`));
    if (m) {
      const parsed = JSON.parse(decodeURIComponent(m[1])) as PopupState;
      if (parsed?.until && parsed.until > Date.now()) return parsed;
    }
  } catch {}
  return null;
}

function writeState(status: "dismissed" | "subscribed", ttlDays: number) {
  const until = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  const payload: PopupState = { status, until };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
  try {
    const expires = new Date(until).toUTCString();
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(payload))}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
}

type Copy = {
  title: string;
  subtitle: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  consent: string;
  submit: string;
  sending: string;
  noThanks: string;
  invalidEmail: string;
  mustAccept: string;
  errorGeneric: string;
  successTitle: string;
  successDesc: string;
  successHint: string;
  copy: string;
  copied: string;
  startShopping: string;
};

const COPIES: Record<string, Copy> = {
  es: {
    title: "10% de descuento 🎁",
    subtitle: "Suscríbete y recibe un cupón del 10% para tu primera compra en ILINGUE RELAX.",
    namePlaceholder: "Tu nombre (opcional)",
    emailPlaceholder: "tu@email.com",
    consent: "Acepto recibir emails de ILINGUE RELAX con ofertas y contenido educativo. Puedo darme de baja cuando quiera.",
    submit: "Obtener mi 10% de descuento",
    sending: "Enviando...",
    noThanks: "No, gracias",
    invalidEmail: "Email inválido",
    mustAccept: "Debes aceptar recibir emails",
    errorGeneric: "No se pudo suscribir. Intenta de nuevo.",
    successTitle: "¡Listo! 🎉",
    successDesc: "Tu cupón del 10% de descuento:",
    successHint: "Úsalo al finalizar tu compra en el checkout.",
    copy: "Copiar",
    copied: "Cupón copiado",
    startShopping: "Empezar a comprar",
  },
  en: {
    title: "10% off 🎁",
    subtitle: "Subscribe and get a 10% off coupon for your first order at ILINGUE RELAX.",
    namePlaceholder: "Your name (optional)",
    emailPlaceholder: "you@email.com",
    consent: "I agree to receive emails from ILINGUE RELAX with offers and educational content. I can unsubscribe anytime.",
    submit: "Get my 10% off",
    sending: "Sending...",
    noThanks: "No, thanks",
    invalidEmail: "Invalid email",
    mustAccept: "You must accept receiving emails",
    errorGeneric: "Could not subscribe. Please try again.",
    successTitle: "Done! 🎉",
    successDesc: "Your 10% off coupon:",
    successHint: "Use it at checkout to complete your order.",
    copy: "Copy",
    copied: "Coupon copied",
    startShopping: "Start shopping",
  },
  fr: {
    title: "10% de réduction 🎁",
    subtitle: "Abonnez-vous et recevez un coupon de 10% pour votre première commande chez ILINGUE RELAX.",
    namePlaceholder: "Votre prénom (facultatif)",
    emailPlaceholder: "vous@email.com",
    consent: "J'accepte de recevoir des emails d'ILINGUE RELAX avec des offres et du contenu éducatif. Je peux me désabonner à tout moment.",
    submit: "Obtenir mes 10% de réduction",
    sending: "Envoi...",
    noThanks: "Non, merci",
    invalidEmail: "Email invalide",
    mustAccept: "Vous devez accepter de recevoir des emails",
    errorGeneric: "Impossible de s'abonner. Réessayez.",
    successTitle: "C'est fait ! 🎉",
    successDesc: "Votre coupon de 10% de réduction :",
    successHint: "Utilisez-le au moment du paiement.",
    copy: "Copier",
    copied: "Coupon copié",
    startShopping: "Commencer les achats",
  },
  pt: {
    title: "10% de desconto 🎁",
    subtitle: "Assine e receba um cupom de 10% na sua primeira compra na ILINGUE RELAX.",
    namePlaceholder: "Seu nome (opcional)",
    emailPlaceholder: "seu@email.com",
    consent: "Aceito receber emails da ILINGUE RELAX com ofertas e conteúdo educacional. Posso cancelar quando quiser.",
    submit: "Obter meus 10% de desconto",
    sending: "Enviando...",
    noThanks: "Não, obrigado",
    invalidEmail: "Email inválido",
    mustAccept: "Você deve aceitar receber emails",
    errorGeneric: "Não foi possível assinar. Tente novamente.",
    successTitle: "Pronto! 🎉",
    successDesc: "Seu cupom de 10% de desconto:",
    successHint: "Use no checkout para concluir sua compra.",
    copy: "Copiar",
    copied: "Cupom copiado",
    startShopping: "Começar a comprar",
  },
  it: {
    title: "10% di sconto 🎁",
    subtitle: "Iscriviti e ricevi un coupon del 10% per il tuo primo ordine su ILINGUE RELAX.",
    namePlaceholder: "Il tuo nome (facoltativo)",
    emailPlaceholder: "tu@email.com",
    consent: "Accetto di ricevere email da ILINGUE RELAX con offerte e contenuti educativi. Posso disiscrivermi quando voglio.",
    submit: "Ottieni il mio 10% di sconto",
    sending: "Invio...",
    noThanks: "No, grazie",
    invalidEmail: "Email non valida",
    mustAccept: "Devi accettare di ricevere email",
    errorGeneric: "Impossibile iscriversi. Riprova.",
    successTitle: "Fatto! 🎉",
    successDesc: "Il tuo coupon del 10% di sconto:",
    successHint: "Usalo al checkout per completare l'ordine.",
    copy: "Copia",
    copied: "Coupon copiato",
    startShopping: "Inizia a fare acquisti",
  },
  de: {
    title: "10% Rabatt 🎁",
    subtitle: "Abonniere und erhalte einen 10%-Gutschein für deine erste Bestellung bei ILINGUE RELAX.",
    namePlaceholder: "Dein Name (optional)",
    emailPlaceholder: "du@email.com",
    consent: "Ich stimme zu, E-Mails von ILINGUE RELAX mit Angeboten und Lerninhalten zu erhalten. Ich kann mich jederzeit abmelden.",
    submit: "Meine 10% Rabatt holen",
    sending: "Senden...",
    noThanks: "Nein, danke",
    invalidEmail: "Ungültige E-Mail",
    mustAccept: "Du musst dem E-Mail-Empfang zustimmen",
    errorGeneric: "Anmeldung fehlgeschlagen. Bitte erneut versuchen.",
    successTitle: "Fertig! 🎉",
    successDesc: "Dein 10%-Rabatt-Gutschein:",
    successHint: "Verwende ihn an der Kasse.",
    copy: "Kopieren",
    copied: "Gutschein kopiert",
    startShopping: "Einkauf starten",
  },
  ko: {
    title: "10% 할인 🎁",
    subtitle: "구독하고 ILINGUE RELAX 첫 주문에 사용할 수 있는 10% 할인 쿠폰을 받으세요.",
    namePlaceholder: "이름 (선택)",
    emailPlaceholder: "you@email.com",
    consent: "ILINGUE RELAX의 프로모션과 학습 콘텐츠 이메일 수신에 동의합니다. 언제든지 구독을 취소할 수 있습니다.",
    submit: "10% 할인 받기",
    sending: "전송 중...",
    noThanks: "괜찮습니다",
    invalidEmail: "잘못된 이메일",
    mustAccept: "이메일 수신에 동의해야 합니다",
    errorGeneric: "구독할 수 없습니다. 다시 시도해 주세요.",
    successTitle: "완료! 🎉",
    successDesc: "10% 할인 쿠폰:",
    successHint: "결제 시 사용하세요.",
    copy: "복사",
    copied: "쿠폰 복사됨",
    startShopping: "쇼핑 시작",
  },
  ja: {
    title: "10%オフ 🎁",
    subtitle: "登録するとILINGUE RELAXの初回注文で使える10%オフクーポンがもらえます。",
    namePlaceholder: "お名前(任意)",
    emailPlaceholder: "you@email.com",
    consent: "ILINGUE RELAXからのお得な情報と教育コンテンツのメール受信に同意します。いつでも配信停止できます。",
    submit: "10%オフを受け取る",
    sending: "送信中...",
    noThanks: "いいえ、結構です",
    invalidEmail: "無効なメール",
    mustAccept: "メール受信に同意する必要があります",
    errorGeneric: "登録できませんでした。もう一度お試しください。",
    successTitle: "完了! 🎉",
    successDesc: "10%オフクーポン:",
    successHint: "チェックアウトでご利用ください。",
    copy: "コピー",
    copied: "クーポンをコピーしました",
    startShopping: "買い物を始める",
  },
  zh: {
    title: "10% 折扣 🎁",
    subtitle: "订阅即可获得 ILINGUE RELAX 首单 10% 折扣券。",
    namePlaceholder: "您的姓名(可选)",
    emailPlaceholder: "you@email.com",
    consent: "我同意接收 ILINGUE RELAX 的优惠和学习内容邮件。可随时取消订阅。",
    submit: "获取我的 10% 折扣",
    sending: "发送中...",
    noThanks: "不,谢谢",
    invalidEmail: "邮箱无效",
    mustAccept: "您必须同意接收邮件",
    errorGeneric: "订阅失败,请重试。",
    successTitle: "完成! 🎉",
    successDesc: "您的 10% 折扣券:",
    successHint: "结账时使用。",
    copy: "复制",
    copied: "优惠券已复制",
    startShopping: "开始购物",
  },
};

function getCopy(lang: string): Copy {
  return COPIES[lang] || COPIES[lang?.slice(0, 2)] || COPIES.en;
}

export const EmailSubscribePopup = () => {
  const { language, countryCode } = useI18n();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const COUPON = "NEW10";
  const c = getCopy(language);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (readState()) return;
    const p = window.location.pathname.toLowerCase();
    const BLOCKED = ["/admin", "/checkout", "/checkouts", "/pago", "/pagos", "/pay", "/success", "/gracias", "/thank", "/descarga", "/order"];
    if (BLOCKED.some((b) => p.startsWith(b)) || p.includes("success") || p.includes("checkout")) return;

    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
    writeState("dismissed", DISMISS_TTL_DAYS);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      toast.error(c.mustAccept);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error(c.invalidEmail);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email: email.trim(), name: name.trim() || undefined, source: "popup", language, country: countryCode },
      });
      if (error) throw error;
      try { writeState("subscribed", SUBSCRIBED_TTL_DAYS); } catch {}
      try {
        localStorage.setItem(
          "ilr_buyer",
          JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() || "", coupon: COUPON, ts: Date.now() }),
        );
        window.dispatchEvent(new CustomEvent("ilr:buyer-updated"));
      } catch {}
      setSuccess(true);
    } catch (err) {
      console.error(err);
      toast.error(c.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
              <Gift className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{c.successTitle}</h3>
            <p className="text-sm text-muted-foreground">{c.successDesc}</p>
            <div className="flex items-center justify-center gap-2">
              <code className="px-4 py-2.5 rounded-lg bg-primary/10 border-2 border-dashed border-primary text-primary font-bold text-lg tracking-widest">
                {COUPON}
              </code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText(COUPON);
                  toast.success(c.copied);
                }}
              >
                {c.copy}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{c.successHint}</p>
            <Button onClick={() => setOpen(false)} className="w-full">
              {c.startShopping}
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 pb-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{c.subtitle}</p>
            </div>

            <form onSubmit={submit} className="p-6 pt-4 space-y-3">
              <Input
                type="text"
                placeholder={c.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                disabled={loading}
              />
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={c.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-9"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 accent-primary"
                  disabled={loading}
                />
                <span>{c.consent}</span>
              </label>

              <Button
                type="submit"
                disabled={loading || !accepted}
                className="w-full"
              >
                {loading ? c.sending : c.submit}
              </Button>
              <button
                type="button"
                onClick={dismiss}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {c.noThanks}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
