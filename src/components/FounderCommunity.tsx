import { useI18n } from "@/i18n/I18nContext";

type Lang = "es" | "en" | "fr" | "it" | "pt";

const INSTAGRAM_URL = "https://www.instagram.com/ilinguerelax/";
const FACEBOOK_URL = "https://www.facebook.com/ilinguerelax";
const GOOGLE_URL = "https://www.google.com/search?q=iLingue+Relax";
/** Cifras REALES de las capturas de las cuentas (Facebook 7,4 mil; Instagram 1.818), redondeadas hacia abajo. Actualizar cuando crezcan. */
const FACEBOOK_FOLLOWERS = 7400;
const INSTAGRAM_FOLLOWERS = 1800;
const TOTAL = FACEBOOK_FOLLOWERS + INSTAGRAM_FOLLOWERS;
/** Dato dado por la dueña (en un año, personas de varios países). Verificar y actualizar. */
const BUYERS = 2000;

const TXT: Record<Lang, {
  kicker: string; hello: string; behind: string; p1: string; p2: string; p3: string; p4: string; bye: string; alt: string;
  badgeFollowers: string; badgeEng: string; badgeEngSub: string; pillHearing: string; pillMkt: string; pillSales: string;
  commKicker: string; commBefore: string; commAfter: string; commText: string; igAlt: string; fbAlt: string;
  gKicker: string; gTitle: string; gText: string; gAlt: string;
}> = {
  es: {
    kicker: "Conoce a Crady", hello: "¡Hola! Soy Crady,", behind: "detrás de iLingue Relax.",
    p1: "Tengo <b>discapacidad auditiva</b>. En la universidad me daba <b>vergüenza</b> hablar inglés: no escuchaba bien, no sabía cómo se pronunciaban las palabras y las decía mal.",
    p2: "Por eso creé <b>iLingue Relax</b>: libros para aprender idiomas <b>sin estrés</b>, rápido y con la <b>pronunciación escrita paso a paso</b>. También están pensados para personas con discapacidad auditiva.",
    p3: "Trabajé más de <b>10 años en marketing</b> y mi carrera de base es <b>Ingeniería Civil</b>. Creo que <b>no existen límites</b> para aprender.",
    p4: "En un año, <b>más de 2.000 personas de varios países</b> ya aprenden con iLingue Relax. El más popular: <b>5.000 palabras en inglés</b>.",
    bye: "¡Mucho gusto! Aprende a tu ritmo, sin vergüenza. 💙", alt: "Crady, detrás de iLingue Relax",
    badgeFollowers: "seguidores", badgeEng: "Ing. Civil", badgeEngSub: "carrera de base", pillHearing: "Discapacidad auditiva", pillMkt: "10 años en marketing", pillSales: "+2.000 personas en un año",
    commKicker: "Comunidad", commBefore: "Más de", commAfter: "seguidores en Facebook e Instagram", commText: "Mira cómo es la comunidad de iLingue Relax y aprende con nosotros, sin estrés.",
    igAlt: "Perfil de Instagram de iLingue Relax (@ilinguerelax)", fbAlt: "Página de Facebook de iLingue Relax: 7,4 mil seguidores",
    gKicker: "Google", gTitle: "Búscanos en Google", gText: "Así aparece iLingue Relax en Google.", gAlt: "Panel de iLingue Relax en Google: sitio web y descripción de la marca",
  },
  en: {
    kicker: "Meet Crady", hello: "Hi! I'm Crady,", behind: "the person behind iLingue Relax.",
    p1: "I have a <b>hearing disability</b>. At university I felt <b>embarrassed</b> to speak English: I couldn't hear well, I didn't know how words were pronounced and I said them wrong.",
    p2: "That's why I created <b>iLingue Relax</b>: books to learn languages <b>without stress</b>, fast, with <b>pronunciation written step by step</b>. They're also designed for people with a hearing disability.",
    p3: "I worked <b>10+ years in marketing</b> and my base degree is <b>Civil Engineering</b>. I believe there are <b>no limits</b> to learning.",
    p4: "In one year, <b>more than 2,000 people from several countries</b> are already learning with iLingue Relax. The most popular: <b>5,000 English words</b>.",
    bye: "Nice to meet you! Learn at your own pace, without embarrassment. 💙", alt: "Crady, the person behind iLingue Relax",
    badgeFollowers: "followers", badgeEng: "Civil Eng.", badgeEngSub: "base degree", pillHearing: "Hearing disability", pillMkt: "10 years in marketing", pillSales: "2,000+ people in one year",
    commKicker: "Community", commBefore: "Over", commAfter: "followers on Facebook and Instagram", commText: "See what the iLingue Relax community looks like and learn with us, stress-free.",
    igAlt: "iLingue Relax Instagram profile (@ilinguerelax)", fbAlt: "iLingue Relax Facebook page: 7.4K followers",
    gKicker: "Google", gTitle: "Find us on Google", gText: "This is how iLingue Relax appears on Google.", gAlt: "iLingue Relax brand panel on Google: website and brand description",
  },
  fr: {
    kicker: "Faites connaissance avec Crady", hello: "Bonjour ! Je suis Crady,", behind: "la personne derrière iLingue Relax.",
    p1: "J'ai un <b>handicap auditif</b>. À l'université, j'avais <b>honte</b> de parler anglais : j'entendais mal, je ne savais pas comment prononcer les mots et je les disais mal.",
    p2: "C'est pourquoi j'ai créé <b>iLingue Relax</b> : des livres pour apprendre les langues <b>sans stress</b>, vite, avec la <b>prononciation écrite pas à pas</b>. Ils sont aussi pensés pour les personnes malentendantes.",
    p3: "J'ai travaillé <b>plus de 10 ans dans le marketing</b> et ma formation de base est l'<b>ingénierie civile</b>. Je crois qu'il n'y a <b>aucune limite</b> pour apprendre.",
    p4: "En un an, <b>plus de 2 000 personnes de plusieurs pays</b> apprennent déjà avec iLingue Relax. Le plus populaire : <b>5 000 mots d'anglais</b>.",
    bye: "Enchanté(e) ! Apprenez à votre rythme, sans gêne. 💙", alt: "Crady, la personne derrière iLingue Relax",
    badgeFollowers: "abonnés", badgeEng: "Ing. civil", badgeEngSub: "formation de base", pillHearing: "Handicap auditif", pillMkt: "10 ans en marketing", pillSales: "2 000+ personnes en un an",
    commKicker: "Communauté", commBefore: "Plus de", commAfter: "abonnés sur Facebook et Instagram", commText: "Découvrez la communauté iLingue Relax et apprenez avec nous, sans stress.",
    igAlt: "Profil Instagram d'iLingue Relax (@ilinguerelax)", fbAlt: "Page Facebook d'iLingue Relax : 7,4 k abonnés",
    gKicker: "Google", gTitle: "Trouvez-nous sur Google", gText: "Voici comment iLingue Relax apparaît sur Google.", gAlt: "Fiche de la marque iLingue Relax sur Google : site web et description",
  },
  it: {
    kicker: "Conosci Crady", hello: "Ciao! Sono Crady,", behind: "la persona dietro iLingue Relax.",
    p1: "Ho una <b>disabilità uditiva</b>. All'università mi <b>vergognavo</b> di parlare inglese: non sentivo bene, non sapevo come si pronunciassero le parole e le dicevo male.",
    p2: "Per questo ho creato <b>iLingue Relax</b>: libri per imparare le lingue <b>senza stress</b>, in fretta, con la <b>pronuncia scritta passo dopo passo</b>. Sono pensati anche per le persone con disabilità uditiva.",
    p3: "Ho lavorato <b>più di 10 anni nel marketing</b> e la mia laurea di base è in <b>Ingegneria Civile</b>. Credo che <b>non ci siano limiti</b> per imparare.",
    p4: "In un anno, <b>più di 2.000 persone di vari paesi</b> imparano già con iLingue Relax. Il più popolare: <b>5.000 parole in inglese</b>.",
    bye: "Piacere! Impara con i tuoi tempi, senza imbarazzo. 💙", alt: "Crady, la persona dietro iLingue Relax",
    badgeFollowers: "follower", badgeEng: "Ing. Civile", badgeEngSub: "laurea di base", pillHearing: "Disabilità uditiva", pillMkt: "10 anni nel marketing", pillSales: "2.000+ persone in un anno",
    commKicker: "Comunità", commBefore: "Più di", commAfter: "follower su Facebook e Instagram", commText: "Scopri la comunità di iLingue Relax e impara con noi, senza stress.",
    igAlt: "Profilo Instagram di iLingue Relax (@ilinguerelax)", fbAlt: "Pagina Facebook di iLingue Relax: 7,4 mila follower",
    gKicker: "Google", gTitle: "Trovaci su Google", gText: "Ecco come appare iLingue Relax su Google.", gAlt: "Scheda del marchio iLingue Relax su Google: sito web e descrizione",
  },
  pt: {
    kicker: "Conheça o Crady", hello: "Olá! Eu sou o Crady,", behind: "a pessoa por trás da iLingue Relax.",
    p1: "Tenho <b>deficiência auditiva</b>. Na universidade eu tinha <b>vergonha</b> de falar inglês: não ouvia bem, não sabia como as palavras eram pronunciadas e as dizia errado.",
    p2: "Por isso criei a <b>iLingue Relax</b>: livros para aprender idiomas <b>sem estresse</b>, rápido e com a <b>pronúncia escrita passo a passo</b>. Também são pensados para pessoas com deficiência auditiva.",
    p3: "Trabalhei <b>mais de 10 anos em marketing</b> e minha formação de base é <b>Engenharia Civil</b>. Acredito que <b>não existem limites</b> para aprender.",
    p4: "Em um ano, <b>mais de 2.000 pessoas de vários países</b> já aprendem com a iLingue Relax. O mais popular: <b>5.000 palavras em inglês</b>.",
    bye: "Prazer! Aprenda no seu ritmo, sem vergonha. 💙", alt: "Crady, a pessoa por trás da iLingue Relax",
    badgeFollowers: "seguidores", badgeEng: "Eng. Civil", badgeEngSub: "formação de base", pillHearing: "Deficiência auditiva", pillMkt: "10 anos em marketing", pillSales: "+2.000 pessoas em um ano",
    commKicker: "Comunidade", commBefore: "Mais de", commAfter: "seguidores no Facebook e Instagram", commText: "Veja como é a comunidade iLingue Relax e aprenda com a gente, sem estresse.",
    igAlt: "Perfil do Instagram da iLingue Relax (@ilinguerelax)", fbAlt: "Página do Facebook da iLingue Relax: 7,4 mil seguidores",
    gKicker: "Google", gTitle: "Encontre-nos no Google", gText: "Assim a iLingue Relax aparece no Google.", gAlt: "Painel da marca iLingue Relax no Google: site e descrição",
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

/**
 * Celular con la captura de la cuenta. TODOS tienen el mismo tamaño (misma proporción); la captura va entera, arriba, y lo que sobra
 * es el fondo blanco de la propia pantalla. Es un enlace (sin botones aparte).
 */
function Phone({ src, alt, href }: { src: string; alt: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={alt} className="mx-auto block w-[230px] shrink-0 sm:w-[250px]">
      <span className="relative block rounded-[2.4rem] bg-neutral-900 p-2.5 shadow-xl ring-8 ring-primary/15 transition hover:ring-primary/30">
        <span className="absolute left-1/2 top-3.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-neutral-900" aria-hidden="true" />
        <span className="block aspect-[640/1320] w-full overflow-hidden rounded-[1.9rem] bg-white">
          <img src={src} alt={alt} loading="lazy" decoding="async" width={640} className="h-auto w-full" />
        </span>
      </span>
    </a>
  );
}

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block rounded-full border border-primary/30 bg-background px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">{children}</span>
);

/**
 * «Conoce a Crady» (mismo modelo que YMT Fitness: foto en arco con dos insignias) + «Más de X seguidores» con 2 celulares del mismo tamaño
 * (Facebook e Instagram) + el panel de Google aparte en fondo claro. Todo sin botones: los celulares son el enlace.
 * Solo datos reales dados por la dueña: discapacidad auditiva y su historia, 10 años en marketing, Ingeniería Civil, Facebook 7,4 mil e Instagram 1.818
 * seguidores, más de 2.000 personas de varios países en un año y «5.000 palabras en inglés» como el más popular. Capturas en public/img/comunidad
 * (la de Facebook: a pedido de la dueña se quitó la línea con nombres de seguidores; lo demás, sin tocar).
 */
export const FounderCommunity = ({ className = "" }: { className?: string }) => {
  const { language } = useI18n();
  const lang = (language in TXT ? language : "es") as Lang;
  const t = TXT[lang];

  return (
    <div className={className}>
      {/* Quién soy */}
      <section className="bg-primary/[0.05] px-4 py-6 md:px-6 md:py-8" aria-labelledby="ilr-quien-soy">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-14">
          <figure className="relative mx-auto w-full max-w-[300px] md:mx-0">
            <div className="rounded-t-[999px] rounded-b-3xl bg-primary/15 p-2 shadow-xl">
              <img
                src="/images/crady-ilingue-relax.webp"
                alt={t.alt}
                width={720}
                height={893}
                loading="lazy"
                decoding="async"
                className="aspect-[720/893] w-full rounded-t-[999px] rounded-b-2xl border-2 border-primary/50 bg-muted object-cover"
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
              <Rich html={t.p4} />
            </div>
            <p className="mt-5 text-lg font-bold text-primary md:text-xl">{t.bye}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill>{t.pillHearing}</Pill>
              <Pill>{t.pillMkt}</Pill>
              <Pill>{t.pillSales}</Pill>
            </div>
          </div>
        </div>
      </section>

      {/* Comunidad: 2 celulares del mismo tamaño */}
      <section className="bg-secondary/40 px-4 py-6 md:px-6 md:py-8" aria-labelledby="ilr-comunidad">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
            <span className="h-px w-10 bg-primary" aria-hidden="true" /> {t.commKicker} <span className="h-px w-10 bg-primary" aria-hidden="true" />
          </div>
          <h2 id="ilr-comunidad" className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            {t.commBefore} <span className="text-primary">{group(TOTAL, lang)}</span> {t.commAfter}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-foreground/80 md:text-lg">{t.commText}</p>
          <div className="mt-10 grid justify-center gap-10 sm:grid-cols-2">
            <Phone src="/img/comunidad/facebook.webp" alt={t.fbAlt} href={FACEBOOK_URL} />
            <Phone src="/img/comunidad/instagram.webp" alt={t.igAlt} href={INSTAGRAM_URL} />
          </div>
        </div>
      </section>

      {/* Google: aparte, fondo claro, sin botones */}
      <section className="bg-background px-4 py-6 md:px-6 md:py-8" aria-labelledby="ilr-google">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
            <span className="h-px w-10 bg-primary" aria-hidden="true" /> {t.gKicker} <span className="h-px w-10 bg-primary" aria-hidden="true" />
          </div>
          <h2 id="ilr-google" className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">{t.gTitle}</h2>
          <p className="mx-auto mt-3 max-w-md text-base text-foreground/80 md:text-lg">{t.gText}</p>
          <div className="mt-8">
            <Phone src="/img/comunidad/google.webp" alt={t.gAlt} href={GOOGLE_URL} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default FounderCommunity;
