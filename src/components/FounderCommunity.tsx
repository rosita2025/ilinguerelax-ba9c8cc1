import { BadgeCheck, Briefcase, ExternalLink, Facebook, GraduationCap, Instagram, Users } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

type Lang = "es" | "en" | "fr" | "it" | "pt";

const INSTAGRAM_URL = "https://www.instagram.com/ilinguerelax/";
const FACEBOOK_URL = "https://www.facebook.com/ilinguerelax";
/** Cifras REALES de las capturas de la propia cuenta (Facebook 7,4 mil; Instagram 1.818). Se muestran redondeadas hacia abajo con «+». Actualizar cuando crezcan. */
const FACEBOOK_FOLLOWERS = 7400;
const INSTAGRAM_FOLLOWERS = 1800;

const TXT: Record<Lang, {
  kicker: string; title: string; pronounce: string; p1: string; p2: string; marketing: string; marketingSub: string; eng: string; engSub: string; brand: string; brandSub: string;
  commKicker: string; commTitle: string; commText: string; followers: string; igText: string; fbText: string; igCta: string; fbCta: string;
}> = {
  es: {
    kicker: "Quién soy", title: "Hola, soy Gladys", pronounce: "iLingue se pronuncia",
    p1: "Detrás de iLingue Relax estoy yo. Trabajé más de 10 años en marketing y mi carrera de base es Ingeniería Civil.",
    p2: "Preparo materiales para aprender idiomas sin estrés: claros, ordenados y a tu propio ritmo.",
    marketing: "10+ años", marketingSub: "en marketing", eng: "Ingeniería Civil", engSub: "mi carrera de base", brand: "Marca educativa", brandSub: "iLingue Relax · idiomas sin estrés",
    commKicker: "Comunidad", commTitle: "Únete a la comunidad de iLingue Relax", commText: "Tips, vocabulario y novedades todos los días. Mira cómo es nuestra comunidad y sígueme.",
    followers: "seguidores", igText: "Tips, vocabulario y contenido para aprender inglés", fbText: "Comunidad, novedades y ofertas", igCta: "Seguir en Instagram", fbCta: "Seguir en Facebook",
  },
  en: {
    kicker: "Who I am", title: "Hi, I'm Gladys", pronounce: "iLingue is pronounced",
    p1: "I'm the person behind iLingue Relax. I worked in marketing for more than 10 years and my base degree is Civil Engineering.",
    p2: "I create materials to learn languages without stress: clear, organized and at your own pace.",
    marketing: "10+ years", marketingSub: "in marketing", eng: "Civil Engineering", engSub: "my base degree", brand: "Educational brand", brandSub: "iLingue Relax · languages without stress",
    commKicker: "Community", commTitle: "Join the iLingue Relax community", commText: "Tips, vocabulary and news every day. See our community and follow along.",
    followers: "followers", igText: "Tips, vocabulary and content to learn English", fbText: "Community, news and special offers", igCta: "Follow on Instagram", fbCta: "Follow on Facebook",
  },
  fr: {
    kicker: "Qui suis-je", title: "Bonjour, je suis Gladys", pronounce: "iLingue se prononce",
    p1: "Je suis la personne derrière iLingue Relax. J'ai travaillé plus de 10 ans dans le marketing et ma formation de base est l'ingénierie civile.",
    p2: "Je prépare des supports pour apprendre les langues sans stress : clairs, organisés et à votre rythme.",
    marketing: "10+ ans", marketingSub: "en marketing", eng: "Ingénierie civile", engSub: "ma formation de base", brand: "Marque éducative", brandSub: "iLingue Relax · les langues sans stress",
    commKicker: "Communauté", commTitle: "Rejoignez la communauté iLingue Relax", commText: "Astuces, vocabulaire et nouveautés chaque jour. Découvrez notre communauté et suivez-nous.",
    followers: "abonnés", igText: "Astuces, vocabulaire et contenu pour apprendre l'anglais", fbText: "Communauté, nouveautés et offres", igCta: "Suivre sur Instagram", fbCta: "Suivre sur Facebook",
  },
  it: {
    kicker: "Chi sono", title: "Ciao, sono Gladys", pronounce: "iLingue si pronuncia",
    p1: "Dietro iLingue Relax ci sono io. Ho lavorato per più di 10 anni nel marketing e la mia laurea di base è in Ingegneria Civile.",
    p2: "Preparo materiali per imparare le lingue senza stress: chiari, ordinati e al tuo ritmo.",
    marketing: "10+ anni", marketingSub: "nel marketing", eng: "Ingegneria Civile", engSub: "la mia laurea di base", brand: "Marchio educativo", brandSub: "iLingue Relax · lingue senza stress",
    commKicker: "Comunità", commTitle: "Unisciti alla comunità di iLingue Relax", commText: "Consigli, vocabolario e novità ogni giorno. Scopri la nostra comunità e seguici.",
    followers: "follower", igText: "Consigli, vocabolario e contenuti per imparare l'inglese", fbText: "Comunità, novità e offerte", igCta: "Segui su Instagram", fbCta: "Segui su Facebook",
  },
  pt: {
    kicker: "Quem sou", title: "Olá, eu sou a Gladys", pronounce: "iLingue se pronuncia",
    p1: "Por trás da iLingue Relax estou eu. Trabalhei mais de 10 anos em marketing e minha formação de base é Engenharia Civil.",
    p2: "Preparo materiais para aprender idiomas sem estresse: claros, organizados e no seu ritmo.",
    marketing: "10+ anos", marketingSub: "em marketing", eng: "Engenharia Civil", engSub: "minha formação de base", brand: "Marca educativa", brandSub: "iLingue Relax · idiomas sem estresse",
    commKicker: "Comunidade", commTitle: "Junte-se à comunidade iLingue Relax", commText: "Dicas, vocabulário e novidades todos os dias. Veja nossa comunidade e siga-nos.",
    followers: "seguidores", igText: "Dicas, vocabulário e conteúdo para aprender inglês", fbText: "Comunidade, novidades e ofertas", igCta: "Seguir no Instagram", fbCta: "Seguir no Facebook",
  },
};

/** Cómo suena «iLingue» (palabra italiana: «lingue» = idiomas). */
const PRONUNCIATION: Record<Lang, string> = {
  es: "i-LIN-güe (como «bilingüe»)",
  en: "ee-LEEN-gweh",
  fr: "i-LIN-gwé",
  it: "i-LIN-gue",
  pt: "i-LIN-güe",
};

/** «+1.800» (es/it/pt), «+1,800» (en), «+1 800» (fr): se agrupa a mano porque Intl no separa los miles de 4 cifras en es/pt. */
const num = (n: number, lang: Lang) => {
  const sep = lang === "en" ? "," : lang === "fr" ? "\u202f" : ".";
  return `+${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep)}`;
};

/**
 * «Quién soy» (Gladys) + comunidad de Instagram y Facebook, para generar confianza.
 * SOLO datos reales dados por la dueña: 10+ años en marketing, base en Ingeniería Civil, 7,4 mil seguidores en Facebook y 1.818 en Instagram
 * (de las capturas de las cuentas). No se muestran calificaciones de terceros ni cifras de ventas.
 */
export const FounderCommunity = ({ className = "" }: { className?: string }) => {
  const { language } = useI18n();
  const lang = (language in TXT ? language : "es") as Lang;
  const t = TXT[lang];

  return (
    <section className={`py-10 md:py-14 bg-gradient-to-b from-background to-secondary/30 ${className}`} aria-labelledby="ilr-quien-soy">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Quién soy */}
          <div className="grid items-center gap-6 rounded-3xl border border-border bg-card p-5 shadow-card md:grid-cols-[260px_1fr] md:gap-10 md:p-8">
            <figure className="relative mx-auto w-full max-w-[240px] md:mx-0">
              <div className="overflow-hidden rounded-2xl border-4 border-background shadow-hero">
                <img
                  src="/images/gladys-ilingue-relax.webp"
                  alt="Gladys, detrás de iLingue Relax"
                  width={720}
                  height={977}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover object-[50%_30%]"
                />
              </div>
              <span className="absolute -bottom-3 -right-3 rounded-full bg-primary p-2.5 text-primary-foreground shadow-lg">
                <BadgeCheck className="h-5 w-5" aria-hidden="true" />
              </span>
            </figure>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> {t.kicker}
              </span>
              <h2 id="ilr-quien-soy" className="mt-3 text-3xl font-bold leading-tight text-foreground md:text-4xl">
                {t.title}<span className="text-primary">.</span>
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">{t.p1}</p>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground md:text-lg">{t.p2}</p>

              <p className="mt-4 inline-block rounded-xl bg-secondary/60 px-4 py-2 text-sm text-foreground">
                {t.pronounce} <b className="text-primary">{PRONUNCIATION[lang]}</b>
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Credential icon={Briefcase} title={t.marketing} desc={t.marketingSub} />
                <Credential icon={GraduationCap} title={t.eng} desc={t.engSub} />
                <Credential icon={BadgeCheck} title={t.brand} desc={t.brandSub} />
              </div>
            </div>
          </div>

          {/* Comunidad */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Users className="h-3.5 w-3.5" aria-hidden="true" /> {t.commKicker}
            </span>
            <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">{t.commTitle}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">{t.commText}</p>
            <div className="mt-6 grid gap-4 text-left sm:grid-cols-2">
              <SocialCard
                href={INSTAGRAM_URL}
                handle="@ilinguerelax"
                text={t.igText}
                count={num(INSTAGRAM_FOLLOWERS, lang)}
                unit={t.followers}
                cta={t.igCta}
                icon={<Instagram className="h-7 w-7 text-white" aria-hidden="true" />}
                iconBg="bg-gradient-to-br from-pink-500 to-purple-600"
              />
              <SocialCard
                href={FACEBOOK_URL}
                handle="iLingue Relax"
                text={t.fbText}
                count={num(FACEBOOK_FOLLOWERS, lang)}
                unit={t.followers}
                cta={t.fbCta}
                icon={<Facebook className="h-7 w-7 text-white" aria-hidden="true" />}
                iconBg="bg-blue-600"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Credential = ({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) => (
  <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
    </div>
    <div>
      <div className="text-sm font-bold leading-tight text-foreground">{title}</div>
      <div className="text-xs leading-snug text-muted-foreground">{desc}</div>
    </div>
  </div>
);

const SocialCard = ({ href, handle, text, count, unit, cta, icon, iconBg }: {
  href: string; handle: string; text: string; count: string; unit: string; cta: string; icon: React.ReactNode; iconBg: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-hero"
  >
    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-semibold text-foreground transition-colors group-hover:text-primary">{handle}</span>
        <span className="text-sm font-extrabold text-primary">{count} <span className="font-semibold">{unit}</span></span>
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary">{cta} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></span>
    </div>
  </a>
);

export default FounderCommunity;
