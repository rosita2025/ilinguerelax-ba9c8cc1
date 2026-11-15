import { Facebook, Instagram } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

type Lang = "es" | "en" | "fr" | "it" | "pt";

const INSTAGRAM_URL = "https://www.instagram.com/ilinguerelax/";
const FACEBOOK_URL = "https://www.facebook.com/ilinguerelax";
/** Cifras REALES de las capturas de las cuentas (Facebook 7,4 mil; Instagram 1.818), redondeadas hacia abajo. Actualizar cuando crezcan. */
const FACEBOOK_FOLLOWERS = 7400;
const INSTAGRAM_FOLLOWERS = 1800;
const TOTAL = FACEBOOK_FOLLOWERS + INSTAGRAM_FOLLOWERS;

const TXT: Record<Lang, {
  kicker: string; hello: string; behind: string; p1: string; p2: string; p3: string; bye: string; alt: string;
  badgeFollowers: string; badgeEng: string; badgeEngSub: string; badgeMkt: string;
  commKicker: string; commBefore: string; commAfter: string; commText: string; igCta: string; fbCta: string; igAlt: string; fbAlt: string;
}> = {
  es: {
    kicker: "Conoce a Crady", hello: "¡Hola! Soy Crady,", behind: "detrás de iLingue Relax.",
    p1: "Tengo <b>discapacidad auditiva</b>. Nunca aprendí inglés: me daba <b>vergüenza</b>, no escuchaba bien y no sabía cómo se pronunciaban las palabras.",
    p2: "Por eso creé <b>iLingue Relax</b>: aprender idiomas <b>sin estrés</b>, rápido y con la <b>pronunciación escrita paso a paso</b>. También está pensado para personas con discapacidad auditiva.",
    p3: "Trabajé más de <b>10 años en marketing</b> y mi carrera de base es <b>Ingeniería Civil</b>. Creo que <b>no existen límites</b> para aprender.",
    bye: "¡Mucho gusto! Aprende a tu ritmo, sin vergüenza. 💙", alt: "Crady, detrás de iLingue Relax",
    badgeFollowers: "seguidores", badgeEng: "Ing. Civil", badgeEngSub: "carrera de base", badgeMkt: "10 años en marketing",
    commKicker: "Comunidad", commBefore: "Más de", commAfter: "seguidores en Facebook e Instagram", commText: "Mira cómo es la comunidad de iLingue Relax y aprende con nosotros, sin estrés.",
    igCta: "Sígueme en Instagram", fbCta: "Sígueme en Facebook", igAlt: "Perfil de Instagram de iLingue Relax (@ilinguerelax)", fbAlt: "Página de Facebook de iLingue Relax: 7,4 mil seguidores",
  },
  en: {
    kicker: "Meet Crady", hello: "Hi! I'm Crady,", behind: "the person behind iLingue Relax.",
    p1: "I have a <b>hearing disability</b>. I never learned English: I felt <b>embarrassed</b>, I couldn't hear well and I didn't know how words were pronounced.",
    p2: "That's why I created <b>iLingue Relax</b>: learn languages <b>without stress</b>, fast, with <b>pronunciation written step by step</b>. It's also designed for people with a hearing disability.",
    p3: "I worked <b>10+ years in marketing</b> and my base degree is <b>Civil Engineering</b>. I believe there are <b>no limits</b> to learning.",
    bye: "Nice to meet you! Learn at your own pace, without embarrassment. 💙", alt: "Crady, the person behind iLingue Relax",
    badgeFollowers: "followers", badgeEng: "Civil Eng.", badgeEngSub: "base degree", badgeMkt: "10 years in marketing",
    commKicker: "Community", commBefore: "Over", commAfter: "followers on Facebook and Instagram", commText: "See what the iLingue Relax community looks like and learn with us, stress-free.",
    igCta: "Follow on Instagram", fbCta: "Follow on Facebook", igAlt: "iLingue Relax Instagram profile (@ilinguerelax)", fbAlt: "iLingue Relax Facebook page: 7.4K followers",
  },
  fr: {
    kicker: "Faites connaissance avec Crady", hello: "Bonjour ! Je suis Crady,", behind: "la personne derrière iLingue Relax.",
    p1: "J'ai un <b>handicap auditif</b>. Je n'ai jamais appris l'anglais : j'avais <b>honte</b>, j'entendais mal et je ne savais pas comment prononcer les mots.",
    p2: "C'est pourquoi j'ai créé <b>iLingue Relax</b> : apprendre les langues <b>sans stress</b>, vite, avec la <b>prononciation écrite pas à pas</b>. C'est aussi pensé pour les personnes malentendantes.",
    p3: "J'ai travaillé <b>plus de 10 ans dans le marketing</b> et ma formation de base est l'<b>ingénierie civile</b>. Je crois qu'il n'y a <b>aucune limite</b> pour apprendre.",
    bye: "Enchanté(e) ! Apprenez à votre rythme, sans gêne. 💙", alt: "Crady, la personne derrière iLingue Relax",
    badgeFollowers: "abonnés", badgeEng: "Ing. civil", badgeEngSub: "formation de base", badgeMkt: "10 ans en marketing",
    commKicker: "Communauté", commBefore: "Plus de", commAfter: "abonnés sur Facebook et Instagram", commText: "Découvrez la communauté iLingue Relax et apprenez avec nous, sans stress.",
    igCta: "Suivez-moi sur Instagram", fbCta: "Suivez-moi sur Facebook", igAlt: "Profil Instagram d'iLingue Relax (@ilinguerelax)", fbAlt: "Page Facebook d'iLingue Relax : 7,4 k abonnés",
  },
  it: {
    kicker: "Conosci Crady", hello: "Ciao! Sono Crady,", behind: "la persona dietro iLingue Relax.",
    p1: "Ho una <b>disabilità uditiva</b>. Non ho mai imparato l'inglese: mi <b>vergognavo</b>, non sentivo bene e non sapevo come si pronunciassero le parole.",
    p2: "Per questo ho creato <b>iLingue Relax</b>: imparare le lingue <b>senza stress</b>, in fretta, con la <b>pronuncia scritta passo dopo passo</b>. È pensato anche per le persone con disabilità uditiva.",
    p3: "Ho lavorato <b>più di 10 anni nel marketing</b> e la mia laurea di base è in <b>Ingegneria Civile</b>. Credo che <b>non ci siano limiti</b> per imparare.",
    bye: "Piacere! Impara con i tuoi tempi, senza imbarazzo. 💙", alt: "Crady, la persona dietro iLingue Relax",
    badgeFollowers: "follower", badgeEng: "Ing. Civile", badgeEngSub: "laurea di base", badgeMkt: "10 anni nel marketing",
    commKicker: "Comunità", commBefore: "Più di", commAfter: "follower su Facebook e Instagram", commText: "Scopri la comunità di iLingue Relax e impara con noi, senza stress.",
    igCta: "Seguimi su Instagram", fbCta: "Seguimi su Facebook", igAlt: "Profilo Instagram di iLingue Relax (@ilinguerelax)", fbAlt: "Pagina Facebook di iLingue Relax: 7,4 mila follower",
  },
  pt: {
    kicker: "Conheça o Crady", hello: "Olá! Eu sou o Crady,", behind: "a pessoa por trás da iLingue Relax.",
    p1: "Tenho <b>deficiência auditiva</b>. Nunca aprendi inglês: eu tinha <b>vergonha</b>, não ouvia bem e não sabia como as palavras eram pronunciadas.",
    p2: "Por isso criei a <b>iLingue Relax</b>: aprender idiomas <b>sem estresse</b>, rápido e com a <b>pronúncia escrita passo a passo</b>. Também é pensada para pessoas com deficiência auditiva.",
    p3: "Trabalhei <b>mais de 10 anos em marketing</b> e minha formação de base é <b>Engenharia Civil</b>. Acredito que <b>não existem limites</b> para aprender.",
    bye: "Prazer! Aprenda no seu ritmo, sem vergonha. 💙", alt: "Crady, a pessoa por trás da iLingue Relax",
    badgeFollowers: "seguidores", badgeEng: "Eng. Civil", badgeEngSub: "formação de base", badgeMkt: "10 anos em marketing",
    commKicker: "Comunidade", commBefore: "Mais de", commAfter: "seguidores no Facebook e Instagram", commText: "Veja como é a comunidade iLingue Relax e aprenda com a gente, sem estresse.",
    igCta: "Siga no Instagram", fbCta: "Siga no Facebook", igAlt: "Perfil do Instagram da iLingue Relax (@ilinguerelax)", fbAlt: "Página do Facebook da iLingue Relax: 7,4 mil seguidores",
  },
};

/** «7.400» (es/it/pt), «7,400» (en), «7 400» (fr): se agrupa a mano porque Intl no separa los miles de 4 cifras en es/pt. */
const group = (n: number, lang: Lang) => {
  const sep = lang === "en" ? "," : lang === "fr" ? " " : ".";
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
};

/** Texto con <b> (solo los que escribimos aquí, nunca contenido de usuarios). */
const Rich = ({ html, className }: { html: string; className?: string }) => (
  <p className={className} dangerouslySetInnerHTML={{ __html: html.replace(/<b>/g, '<b class="text-primary">') }} />
);

function Phone({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-[230px] rounded-[2.4rem] bg-neutral-900 p-2.5 shadow-xl ring-8 ring-primary/15 sm:w-[250px]">
      <div className="absolute left-1/2 top-3.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-neutral-900" aria-hidden="true" />
      <div className="aspect-[11/20] w-full overflow-hidden rounded-[1.9rem] bg-white">
        <img src={src} alt={alt} loading="lazy" decoding="async" className="w-full" />
      </div>
    </div>
  );
}

/**
 * «Conoce a Crady» (mismo modelo que YMT Fitness: foto en arco con dos insignias) + «Más de X seguidores en Facebook e Instagram»
 * (capturas REALES de Facebook e Instagram dentro de un celular). Solo datos reales dados por la dueña: discapacidad auditiva y su historia,
 * 10 años en marketing, Ingeniería Civil, Facebook 7,4 mil e Instagram 1.818 seguidores. Las capturas están en public/img/comunidad
 * (la de Facebook se recortó por abajo para no publicar los nombres de seguidores). No inventar otras cifras.
 */
export const FounderCommunity = ({ className = "" }: { className?: string }) => {
  const { language } = useI18n();
  const lang = (language in TXT ? language : "es") as Lang;
  const t = TXT[lang];

  return (
    <div className={className}>
      {/* Quién soy */}
      <section className="bg-primary/[0.05] px-4 py-10 md:px-6 md:py-14" aria-labelledby="ilr-quien-soy">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-14">
          <figure className="relative mx-auto w-full max-w-[300px] md:mx-0">
            <div className="rounded-t-[999px] rounded-b-3xl bg-primary/15 p-2 shadow-xl">
              <img
                src="/images/crady-ilingue-relax.webp"
                alt={t.alt}
                width={720}
                height={896}
                loading="lazy"
                decoding="async"
                className="aspect-[3/4] w-full rounded-t-[999px] rounded-b-2xl border-2 border-primary/50 bg-muted object-cover object-[50%_25%]"
              />
            </div>
            <div className="absolute -left-3 bottom-8 rounded-xl border border-primary/40 bg-background px-3 py-1.5 text-center shadow-md">
              <div className="text-2xl font-extrabold leading-none text-primary">+{group(FACEBOOK_FOLLOWERS, lang)}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">{t.badgeFollowers}</div>
            </div>
            <div className="absolute -right-3 bottom-2 rounded-xl border border-primary/40 bg-background px-3 py-1.5 text-center shadow-md">
              <div className="text-xl font-extrabold leading-none text-primary">{t.badgeEng}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">{t.badgeEngSub}</div>
            </div>
          </figure>

          <div>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="h-px w-10 bg-primary" aria-hidden="true" /> {t.kicker}
            </div>
            <h2 id="ilr-quien-soy" className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
              {t.hello} <span className="text-primary">{t.behind}</span>
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-foreground/85 md:text-lg">
              <Rich html={t.p1} />
              <Rich html={t.p2} />
              <Rich html={t.p3} />
            </div>
            <p className="mt-5 text-lg font-bold text-primary md:text-xl">{t.bye}</p>
            <p className="mt-3 inline-block rounded-full border border-primary/30 bg-background px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">{t.badgeMkt}</p>
          </div>
        </div>
      </section>

      {/* Comunidad */}
      <section className="bg-secondary/40 px-4 py-10 md:px-6 md:py-14" aria-labelledby="ilr-comunidad">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
            <span className="h-px w-10 bg-primary" aria-hidden="true" /> {t.commKicker} <span className="h-px w-10 bg-primary" aria-hidden="true" />
          </div>
          <h2 id="ilr-comunidad" className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            {t.commBefore} <span className="text-primary">{group(TOTAL, lang)}</span> {t.commAfter}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-foreground/80 md:text-lg">{t.commText}</p>

          <div className="mt-10 grid gap-10 sm:grid-cols-2">
            <div className="flex flex-col items-center gap-5">
              <Phone src="/img/comunidad/facebook.webp" alt={t.fbAlt} />
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-background px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary shadow-md transition hover:bg-primary hover:text-primary-foreground">
                <Facebook className="h-5 w-5" aria-hidden="true" /> {t.fbCta}
              </a>
              <span className="-mt-2 text-sm font-bold text-primary">iLingue Relax</span>
            </div>
            <div className="flex flex-col items-center gap-5">
              <Phone src="/img/comunidad/instagram.webp" alt={t.igAlt} />
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-background px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary shadow-md transition hover:bg-primary hover:text-primary-foreground">
                <Instagram className="h-5 w-5" aria-hidden="true" /> {t.igCta}
              </a>
              <span className="-mt-2 text-sm font-bold text-primary">@ilinguerelax</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FounderCommunity;
