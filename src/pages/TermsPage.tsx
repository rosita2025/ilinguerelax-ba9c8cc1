import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { FileText, ShoppingCart, RotateCcw, BookOpen, Scale, AlertTriangle, Copyright, Gavel, Building2 } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useI18n } from "@/i18n/I18nContext";

type SectionContent = { title: string; content: string };
type PageContent = {
  heroTitle: string;
  heroSubtitle: string;
  lastUpdated: string;
  seoTitle: string;
  seoDescription: string;
  sections: SectionContent[];
};

const icons = [FileText, Building2, ShoppingCart, BookOpen, RotateCcw, Scale, Copyright, AlertTriangle, Gavel];

const CONTENT: Record<"es" | "en" | "fr" | "pt", PageContent> = {
  es: {
    heroTitle: "Condiciones de Uso",
    heroSubtitle: "Términos y condiciones que rigen el uso de nuestros servicios y productos.",
    lastUpdated: "Última actualización: 9 de julio de 2026",
    seoTitle: "Condiciones de Uso - iLingue Relax",
    seoDescription: "Lee los términos y condiciones de uso de iLingue Relax. Política de reembolsos, licencias de productos digitales y derechos de autor.",
    sections: [
      { title: "Aceptación de los Términos", content: `Al acceder y utilizar el sitio web de iLingue Relax (ilinguerelax.com) y adquirir nuestros productos, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, te pedimos que no utilices nuestros servicios.\n\nNos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación. Te recomendamos revisar esta página periódicamente.` },
      { title: "Información Legal del Operador", content: `El sitio web ilinguerelax.com y la marca iLingue Relax son operados por Carmen Rosa Aliaga Domínguez, persona física inscrita en Perú con RUC 10739908375, en representación de Youtumundial LLC.\n\nPara fines de facturación, cumplimiento y verificación de pagos locales en Latinoamérica, la titularidad y administración del sitio corresponde a la persona física antes mencionada. Cualquier consulta legal o comercial puede dirigirse a hola@ilinguerelax.com.` },
      { title: "Productos y Servicios", content: `iLingue Relax ofrece productos educativos digitales (ebooks, guías PDF, audios) y libros físicos disponibles próximamente a través de la tienda de Amazon. Todos los productos digitales son de descarga inmediata una vez completado el pago.\n\n• Productos digitales vendidos a través de Hotmart (Latinoamérica): la entrega y el acceso se realizan directamente dentro de la plataforma de Hotmart una vez confirmado el pago.\n• Productos digitales vendidos en la tienda de iLingue Relax (Stripe, Mercado Pago, Yape/Plin): la entrega se realiza mediante una página web de descarga protegida por contraseña. La contraseña se envía por correo electrónico de forma automática (pagos con Stripe y Mercado Pago) o de forma manual (pagos con Yape/Plin, una vez que la Supervisora de Pagos verifica el comprobante en un plazo de 1 a 24 horas).\n• Libros físicos: próximamente disponibles a través de la tienda de Amazon; los tiempos de entrega, envío y devoluciones se rigen por las políticas de Amazon y sus socios logísticos.\n• Disponibilidad: nos reservamos el derecho de modificar, suspender o discontinuar cualquier producto sin previo aviso.` },
      { title: "Licencia de Uso (Productos Digitales)", content: `Al adquirir un producto digital de iLingue Relax, recibes una licencia personal, no exclusiva y no transferible para usar el contenido:\n\n✓ Uso permitido: descargar y usar el contenido para tu aprendizaje personal. Puedes imprimir copias para uso personal y no comercial.\n\n✗ Uso prohibido:\n  • Revender, redistribuir o compartir los archivos con terceros.\n  • Subir el contenido a sitios web, foros, redes sociales o plataformas de intercambio de archivos.\n  • Modificar, adaptar o crear trabajos derivados para distribución.\n  • Usar el contenido con fines comerciales sin autorización escrita.\n\nEl incumplimiento de estas condiciones puede resultar en la cancelación de tu acceso y acciones legales por violación de derechos de autor.` },
      { title: "Política de Reembolsos y Garantía", content: `Productos digitales comprados a través de Hotmart (Latinoamérica):\n• Aplica la garantía oficial de Hotmart: puedes solicitar la devolución del 100% del importe dentro de los primeros 7 días desde la fecha de compra, directamente desde tu cuenta de comprador en Hotmart o escribiendo a hola@ilinguerelax.com.\n• El reembolso se procesa según los plazos y métodos de Hotmart (5 a 15 días hábiles).\n\nProductos digitales comprados en la tienda de iLingue Relax (Stripe, Mercado Pago, Yape/Plin):\n• Por tratarse de contenido digital de descarga inmediata y acceso protegido por contraseña, no se admiten devoluciones ni reembolsos una vez confirmado el pago y entregada la contraseña de acceso.\n• Ante cualquier problema técnico con la descarga o el acceso, contáctanos en hola@ilinguerelax.com y nuestra Supervisora de Pagos te asistirá para restablecer el acceso.\n\nLibros físicos (próximamente en Amazon):\n• Las devoluciones, cambios y reclamos por daños en el envío se gestionan directamente según la política vigente de la tienda de Amazon.` },
      { title: "Precios y Pagos", content: `• Todos los precios mostrados en el sitio pueden aparecer en USD o en tu moneda local (según detección automática de país por IP). Los precios locales son aproximaciones y pueden variar ligeramente según la tasa de cambio del día del pago aplicada por el procesador.\n• Los pagos se procesan de forma segura a través de los siguientes proveedores autorizados:\n   – Stripe: tarjetas de crédito/débito (Visa, Mastercard, Amex), Apple Pay, Google Pay y Link.\n   – dLocal Go: métodos de pago locales en Latinoamérica (OXXO, SPEI, Nequi, PSE, PIX, tarjetas locales).\n   – Mercado Pago: transferencias bancarias, PagoEfectivo, Western Union, Tambo y Kasnet. Disponible únicamente desde Perú.\n   – Yape y Plin: pago manual desde Perú, verificación en 1 a 24 horas.\n   – Hotmart: procesa pagos en Latinoamérica (Nequi, PIX, OXXO, Boleto, tarjetas locales).\n   – Amazon: procesa los pagos de los libros físicos (próximamente).\n• Los precios están sujetos a cambio sin previo aviso.\n• Los impuestos aplicables se calculan según la legislación de tu país.` },
      { title: "Propiedad Intelectual", content: `Todo el contenido del sitio web y los productos de iLingue Relax está protegido por derechos de autor, marcas registradas y otras leyes de propiedad intelectual.\n\n• iLingue Relax® y nuestro logotipo son marcas registradas.\n• El contenido de nuestros ebooks y guías es propiedad exclusiva de iLingue Relax.\n• Queda estrictamente prohibida la reproducción, distribución o comunicación pública sin autorización previa por escrito.\n\niLingue Relax™ es una marca registrada propiedad de Youtumundial LLC y está registrada en el Estado de Nuevo México, Estados Unidos. La marca, nombre comercial, logotipos y todos los elementos de marca relacionados son propiedad exclusiva de Youtumundial LLC. Cualquier uso, reproducción, imitación o distribución no autorizada de la marca iLingue Relax™ o de cualquier designación confusamente similar está estrictamente prohibido y puede violar las leyes de marcas y propiedad intelectual aplicables.` },
      { title: "Limitación de Responsabilidad", content: `iLingue Relax proporciona materiales educativos de calidad, pero no garantiza resultados específicos de aprendizaje. El progreso depende del esfuerzo y dedicación individual de cada usuario.\n\n• No somos responsables por daños indirectos, incidentales o consecuenciales.\n• No garantizamos que el sitio esté libre de errores o disponible ininterrumpidamente.\n• Las recomendaciones y ejemplos de pronunciación son orientativas.` },
      { title: "Ley Aplicable y Resolución de Disputas", content: `Estos términos se rigen por las leyes del Estado de Nuevo México, Estados Unidos.\n\n• Antes de iniciar cualquier acción legal, las partes intentarán resolver la disputa de buena fe mediante negociación directa.\n• Si no se alcanza una solución, las disputas se resolverán mediante arbitraje vinculante conforme a las reglas de la Asociación Americana de Arbitraje (AAA).\n• Cualquier acción legal debe iniciarse dentro de los 12 meses siguientes a la causa de la reclamación.` },
    ],
  },
  en: {
    heroTitle: "Terms & Conditions",
    heroSubtitle: "Terms and conditions governing the use of our services and products.",
    lastUpdated: "Last updated: July 9, 2026",
    seoTitle: "Terms & Conditions - iLingue Relax",
    seoDescription: "Read the iLingue Relax terms and conditions. Refund policy, digital product licenses, and copyright.",
    sections: [
      { title: "Acceptance of Terms", content: `By accessing and using the iLingue Relax website (ilinguerelax.com) and purchasing our products, you fully accept these terms and conditions. If you do not agree with any part, please do not use our services.\n\nWe reserve the right to modify these terms at any time. Changes take effect immediately upon publication. We recommend reviewing this page periodically.` },
      { title: "Legal Operator Information", content: `The ilinguerelax.com website and the iLingue Relax brand are operated by Carmen Rosa Aliaga Dominguez, a natural person registered in Peru under RUC 10739908375, on behalf of Youtumundial LLC.\n\nFor billing, compliance, and verification of local payments in Latin America, ownership and administration of the site correspond to the aforementioned natural person. Any legal or commercial inquiry may be directed to hola@ilinguerelax.com.` },
      { title: "Products & Services", content: `iLingue Relax offers digital educational products (ebooks, PDF guides, audio) and physical books coming soon via Amazon. All digital products are available for immediate download once payment is complete.\n\n• Digital products sold through Hotmart (Latin America): delivery and access happen directly inside the Hotmart platform once payment is confirmed.\n• Digital products sold in the iLingue Relax store (Stripe, Mercado Pago, Yape/Plin): delivery is provided via a password-protected download page. The password is sent automatically by email (Stripe & Mercado Pago) or manually (Yape/Plin, verified within 1–24 hours).\n• Physical books: coming soon via Amazon; delivery, shipping and returns are governed by Amazon's policies.\n• Availability: we reserve the right to modify, suspend or discontinue any product without notice.` },
      { title: "License of Use (Digital Products)", content: `When you purchase a digital product from iLingue Relax, you receive a personal, non-exclusive, non-transferable license to use the content:\n\n✓ Permitted use: download and use for your personal learning. You may print copies for personal, non-commercial use.\n\n✗ Prohibited use:\n  • Reselling, redistributing or sharing the files with third parties.\n  • Uploading the content to websites, forums, social networks or file-sharing platforms.\n  • Modifying, adapting or creating derivative works for distribution.\n  • Using the content for commercial purposes without written authorization.\n\nBreach of these conditions may result in access cancellation and legal action for copyright infringement.` },
      { title: "Refund Policy & Guarantee", content: `Digital products purchased via Hotmart (Latin America):\n• Hotmart's official guarantee applies: you may request a 100% refund within the first 7 days from purchase, directly from your Hotmart buyer account or by writing to hola@ilinguerelax.com.\n• Refunds are processed per Hotmart's timelines (5–15 business days).\n\nDigital products purchased in the iLingue Relax store (Stripe, Mercado Pago, Yape/Plin):\n• As this is digital content with immediate download and password-protected access, no refunds are accepted once payment is confirmed and the access password has been delivered.\n• For technical issues with download or access, contact hola@ilinguerelax.com and our Payments Supervisor will help restore access.\n\nPhysical books (coming soon on Amazon):\n• Returns, exchanges and shipping damage claims are handled directly under Amazon's current policy.` },
      { title: "Prices & Payments", content: `• All prices on the site may appear in USD or your local currency (auto-detected by IP). Local prices are approximations and may vary slightly based on the processor's daily exchange rate.\n• Payments are securely processed by these authorized providers:\n   – Stripe: credit/debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay and Link.\n   – dLocal Go: local payment methods across Latin America (OXXO, SPEI, Nequi, PSE, PIX, local cards).\n   – Mercado Pago: bank transfers, PagoEfectivo, Western Union, Tambo and Kasnet. Peru only.\n   – Yape & Plin: manual payment from Peru, verified within 1–24 hours.\n   – Hotmart: local payment methods across Latin America (Nequi, PIX, OXXO, Boleto, local cards).\n   – Amazon: processes physical book payments (coming soon).\n• Prices are subject to change without notice.\n• Applicable taxes are calculated per your country's legislation.` },
      { title: "Intellectual Property", content: `All content on the iLingue Relax website and products is protected by copyright, trademarks and other intellectual property laws.\n\n• iLingue Relax® and our logo are registered trademarks.\n• The content of our ebooks and guides is the exclusive property of iLingue Relax.\n• Reproduction, distribution or public communication without prior written authorization is strictly prohibited.\n\niLingue Relax™ is a trademark owned by Youtumundial LLC and is registered in the State of New Mexico, United States. The trademark, brand name, logos, and all related branding elements are the exclusive property of Youtumundial LLC. Any unauthorized use, reproduction, imitation, or distribution of the iLingue Relax™ trademark or any confusingly similar designation is strictly prohibited and may violate applicable trademark and intellectual property laws.` },
      { title: "Limitation of Liability", content: `iLingue Relax provides quality educational materials but does not guarantee specific learning results. Progress depends on each user's individual effort and dedication.\n\n• We are not liable for indirect, incidental or consequential damages.\n• We do not guarantee the site to be error-free or uninterrupted.\n• Pronunciation recommendations and examples are indicative and may vary by accent or regional dialect.` },
      { title: "Governing Law & Dispute Resolution", content: `These terms are governed by the laws of the State of New Mexico, United States, without regard to conflict-of-law principles.\n\n• Before initiating legal action, both parties commit to attempting to resolve any dispute in good faith through direct negotiation.\n• If no solution is reached, disputes will be resolved by binding arbitration under the rules of the American Arbitration Association (AAA).\n• Any legal action must be initiated within 12 months of the cause of the claim.` },
    ],
  },
  fr: {
    heroTitle: "Conditions d'Utilisation",
    heroSubtitle: "Conditions générales régissant l'utilisation de nos services et produits.",
    lastUpdated: "Dernière mise à jour : 9 juillet 2026",
    seoTitle: "Conditions d'Utilisation - iLingue Relax",
    seoDescription: "Lisez les conditions générales de iLingue Relax. Politique de remboursement, licences des produits numériques et droits d'auteur.",
    sections: [
      { title: "Acceptation des Conditions", content: `En accédant au site iLingue Relax (ilinguerelax.com) et en achetant nos produits, vous acceptez pleinement ces conditions. Si vous n'êtes pas d'accord, veuillez ne pas utiliser nos services.\n\nNous nous réservons le droit de modifier ces conditions à tout moment. Les changements prennent effet immédiatement.` },
      { title: "Informations Légales de l'Opérateur", content: `Le site ilinguerelax.com et la marque iLingue Relax sont exploités par Carmen Rosa Aliaga Dominguez, personne physique enregistrée au Pérou sous le numéro RUC 10739908375, agissant au nom de Youtumundial LLC.\n\nPour la facturation, la conformité et la vérification des paiements locaux en Amérique latine, la propriété et l'administration du site reviennent à la personne physique susmentionnée. Toute question juridique ou commerciale peut être adressée à hola@ilinguerelax.com.` },
      { title: "Produits et Services", content: `iLingue Relax propose des produits éducatifs numériques (ebooks, guides PDF, audios) et des livres physiques bientôt disponibles via Amazon.\n\n• Produits numériques via Hotmart (Amérique latine) : livraison directement dans la plateforme Hotmart.\n• Produits numériques dans la boutique iLingue Relax (Stripe, Mercado Pago, Yape/Plin) : téléchargement via page protégée par mot de passe envoyé par e-mail.\n• Livres physiques : bientôt sur Amazon ; livraison et retours régis par les politiques d'Amazon.\n• Disponibilité : nous pouvons modifier, suspendre ou arrêter tout produit sans préavis.` },
      { title: "Licence d'Utilisation (Produits Numériques)", content: `L'achat d'un produit numérique iLingue Relax vous accorde une licence personnelle, non exclusive et non transférable :\n\n✓ Autorisé : télécharger et utiliser pour votre apprentissage personnel, imprimer pour un usage non commercial.\n\n✗ Interdit :\n  • Revendre, redistribuer ou partager les fichiers.\n  • Publier le contenu sur des sites, forums, réseaux sociaux ou plateformes de partage.\n  • Modifier ou créer des œuvres dérivées destinées à la distribution.\n  • Utiliser à des fins commerciales sans autorisation écrite.\n\nToute infraction peut entraîner l'annulation de l'accès et des poursuites pour violation du droit d'auteur.` },
      { title: "Politique de Remboursement", content: `Produits numériques achetés via Hotmart (Amérique latine) :\n• Garantie officielle Hotmart : remboursement à 100 % dans les 7 premiers jours.\n\nProduits numériques dans la boutique iLingue Relax (Stripe, Mercado Pago, Yape/Plin) :\n• Contenu numérique à téléchargement immédiat protégé par mot de passe : aucun remboursement une fois le mot de passe livré.\n• En cas de problème technique : hola@ilinguerelax.com.\n\nLivres physiques (bientôt sur Amazon) :\n• Retours et réclamations gérés selon la politique d'Amazon.` },
      { title: "Prix et Paiements", content: `• Les prix peuvent apparaître en USD ou dans votre monnaie locale (détection automatique par IP).\n• Fournisseurs autorisés :\n   – Stripe : cartes (Visa, Mastercard, Amex), Apple Pay, Google Pay, Link.\n   – dLocal Go : moyens de paiement locaux en Amérique latine (OXXO, SPEI, Nequi, PSE, PIX).\n   – Mercado Pago : virements, PagoEfectivo, Western Union, Tambo, Kasnet. Pérou uniquement.\n   – Yape & Plin : paiement manuel depuis le Pérou, vérification 1–24 h.\n   – Hotmart : moyens locaux en Amérique latine (Nequi, PIX, OXXO, Boleto).\n   – Amazon : livres physiques (bientôt).\n• Prix susceptibles de changer sans préavis.\n• Taxes selon la législation de votre pays.` },
      { title: "Propriété Intellectuelle", content: `Tout le contenu du site et des produits iLingue Relax est protégé par le droit d'auteur, les marques et autres lois de propriété intellectuelle.\n\n• iLingue Relax® et notre logo sont des marques déposées.\n• Le contenu de nos ebooks et guides est la propriété exclusive de iLingue Relax.\n• Toute reproduction, distribution ou communication publique sans autorisation écrite préalable est strictement interdite.\n\niLingue Relax™ est une marque détenue par Youtumundial LLC et enregistrée dans l'État du Nouveau-Mexique, États-Unis. La marque, le nom commercial, les logos et tous les éléments de marque associés sont la propriété exclusive de Youtumundial LLC. Toute utilisation, reproduction, imitation ou distribution non autorisée de la marque iLingue Relax™ ou de toute désignation susceptible de prêter à confusion est strictement interdite et peut enfreindre les lois applicables en matière de marques et de propriété intellectuelle.` },
      { title: "Limitation de Responsabilité", content: `iLingue Relax fournit du matériel éducatif de qualité mais ne garantit pas de résultats d'apprentissage spécifiques.\n\n• Nous ne sommes pas responsables des dommages indirects, accessoires ou consécutifs.\n• Nous ne garantissons pas un site sans erreur ou ininterrompu.\n• Les exemples de prononciation sont indicatifs.` },
      { title: "Loi Applicable et Litiges", content: `Ces conditions sont régies par les lois de l'État du Nouveau-Mexique, États-Unis.\n\n• Les parties tenteront de résoudre tout différend de bonne foi par négociation directe.\n• À défaut, les litiges seront résolus par arbitrage exécutoire selon les règles de l'American Arbitration Association (AAA).\n• Toute action doit être engagée dans les 12 mois suivant la cause de la réclamation.` },
    ],
  },
  pt: {
    heroTitle: "Termos e Condições",
    heroSubtitle: "Termos e condições que regem o uso dos nossos serviços e produtos.",
    lastUpdated: "Última atualização: 9 de julho de 2026",
    seoTitle: "Termos e Condições - iLingue Relax",
    seoDescription: "Leia os termos e condições da iLingue Relax. Política de reembolsos, licenças de produtos digitais e direitos autorais.",
    sections: [
      { title: "Aceitação dos Termos", content: `Ao acessar o site iLingue Relax (ilinguerelax.com) e adquirir nossos produtos, você aceita integralmente estes termos. Se não concordar, por favor não utilize nossos serviços.\n\nReservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação.` },
      { title: "Informação Legal do Operador", content: `O site ilinguerelax.com e a marca iLingue Relax são operados por Carmen Rosa Aliaga Dominguez, pessoa física registrada no Peru sob o RUC 10739908375, em nome da Youtumundial LLC.\n\nPara fins de faturamento, conformidade e verificação de pagamentos locais na América Latina, a titularidade e administração do site correspondem à pessoa física mencionada. Qualquer consulta jurídica ou comercial pode ser dirigida a hola@ilinguerelax.com.` },
      { title: "Produtos e Serviços", content: `A iLingue Relax oferece produtos educacionais digitais (ebooks, guias PDF, áudios) e livros físicos em breve na Amazon.\n\n• Produtos digitais via Hotmart (América Latina): entrega diretamente na plataforma Hotmart.\n• Produtos digitais na loja iLingue Relax (Stripe, Mercado Pago, Yape/Plin): entrega via página de download protegida por senha.\n• Livros físicos: em breve na Amazon; entrega e devoluções conforme políticas da Amazon.\n• Disponibilidade: podemos alterar, suspender ou descontinuar qualquer produto sem aviso.` },
      { title: "Licença de Uso (Produtos Digitais)", content: `A compra concede licença pessoal, não exclusiva e intransferível:\n\n✓ Permitido: baixar e usar para aprendizado pessoal, imprimir para uso não comercial.\n\n✗ Proibido:\n  • Revender, redistribuir ou compartilhar arquivos.\n  • Publicar o conteúdo em sites, fóruns ou plataformas de compartilhamento.\n  • Modificar ou criar obras derivadas para distribuição.\n  • Uso comercial sem autorização por escrito.\n\nO descumprimento pode gerar cancelamento de acesso e ações legais por violação de direitos autorais.` },
      { title: "Política de Reembolso", content: `Produtos digitais via Hotmart (América Latina):\n• Garantia oficial da Hotmart: reembolso de 100% nos primeiros 7 dias.\n\nProdutos digitais na loja iLingue Relax (Stripe, Mercado Pago, Yape/Plin):\n• Conteúdo digital de download imediato protegido por senha: não há reembolso após a senha entregue.\n• Problemas técnicos: hola@ilinguerelax.com.\n\nLivros físicos (em breve na Amazon):\n• Trocas e devoluções pela política vigente da Amazon.` },
      { title: "Preços e Pagamentos", content: `• Preços em USD ou moeda local (detecção automática por IP).\n• Provedores autorizados:\n   – Stripe: cartões (Visa, Mastercard, Amex), Apple Pay, Google Pay, Link.\n   – dLocal Go: métodos locais de pagamento na América Latina (OXXO, SPEI, Nequi, PSE, PIX).\n   – Mercado Pago: transferências, PagoEfectivo, Western Union, Tambo, Kasnet. Somente Peru.\n   – Yape & Plin: pagamento manual do Peru, verificação em 1–24 h.\n   – Hotmart: métodos locais na América Latina (Nequi, PIX, OXXO, Boleto).\n   – Amazon: livros físicos (em breve).\n• Preços sujeitos a alteração sem aviso.\n• Impostos conforme a legislação do seu país.` },
      { title: "Propriedade Intelectual", content: `Todo o conteúdo do site e produtos iLingue Relax é protegido por direitos autorais, marcas e outras leis de propriedade intelectual.\n\n• iLingue Relax® e nosso logotipo são marcas registradas.\n• O conteúdo dos ebooks e guias é propriedade exclusiva da iLingue Relax.\n• Reprodução, distribuição ou comunicação pública sem autorização prévia por escrito é estritamente proibida.\n\niLingue Relax™ é uma marca de propriedade da Youtumundial LLC e está registrada no Estado do Novo México, Estados Unidos. A marca, nome comercial, logotipos e todos os elementos de marca relacionados são propriedade exclusiva da Youtumundial LLC. Qualquer uso, reprodução, imitação ou distribuição não autorizada da marca iLingue Relax™ ou de qualquer designação confusamente similar é estritamente proibido e pode violar as leis de marcas e propriedade intelectual aplicáveis.` },
      { title: "Limitação de Responsabilidade", content: `A iLingue Relax fornece materiais educacionais de qualidade, mas não garante resultados específicos de aprendizado.\n\n• Não somos responsáveis por danos indiretos, incidentais ou consequentes.\n• Não garantimos site livre de erros ou ininterrupto.\n• Exemplos de pronúncia são orientativos.` },
      { title: "Lei Aplicável e Resolução de Disputas", content: `Estes termos são regidos pelas leis do Estado do Novo México, Estados Unidos.\n\n• As partes tentarão resolver disputas de boa-fé por negociação direta.\n• Caso contrário, as disputas serão resolvidas por arbitragem vinculante conforme as regras da American Arbitration Association (AAA).\n• Qualquer ação legal deve ser iniciada em até 12 meses após a causa da reclamação.` },
    ],
  },
};

const TermsPage = () => {
  const { language } = useI18n();
  const lang = (["es", "en", "fr", "pt"].includes(language) ? language : "es") as "es" | "en" | "fr" | "pt";
  const c = CONTENT[lang];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={c.seoTitle}
        description={c.seoDescription}
        canonicalUrl="https://ilinguerelax.com/condiciones"
        keywords="términos y condiciones iLingue Relax, terms and conditions, licencia productos digitales"
      />
      <Navbar />

      <motion.section
        className="pt-32 pb-16 gradient-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container px-4 md:px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              {c.heroTitle}
            </h1>
            <p className="text-lg text-primary-foreground/90">{c.heroSubtitle}</p>
            <p className="text-sm text-primary-foreground/70 mt-4">{c.lastUpdated}</p>
          </motion.div>
        </div>
      </motion.section>

      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto space-y-12">
            {c.sections.map((section, index) => {
              const Icon = icons[index] || FileText;
              return (
                <motion.div
                  key={section.title}
                  className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-foreground mb-3">{section.title}</h2>
                      <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {section.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default TermsPage;
