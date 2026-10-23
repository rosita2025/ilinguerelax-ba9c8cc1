import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

/**
 * Upsell post-compra (día 1 y día 3). Se envía SOLO con los upsells configurados
 * en admin para el producto comprado que el cliente todavía NO tiene.
 * Idioma: el del público del producto comprado (es = hispanohablantes que
 * aprenden inglés · en = angloparlantes que aprenden español).
 */
interface Offer { name: string; url: string; image?: string }
interface Props {
  customerName?: string
  sourceName?: string
  offers?: Offer[]
  day?: number
  lang?: 'es' | 'en' | 'it'
}

const COPY = {
  es: {
    htmlLang: 'es',
    previewLast: 'Te falta 1 material para completar tu colección',
    previewMany: (s?: string) => `Complementa ${s || 'tu compra'}`,
    h1Last: '🎯 Solo te falta 1 para completarlo',
    h1Many: '🚀 Complementa tu aprendizaje',
    hello: (n?: string) => `Hola${n ? ` ${n}` : ''},`,
    day3: (s?: string) =>
      `Ya pasaron unos días desde ${s ? `que recibiste ${s}` : 'tu compra'}. Estos materiales combinan muy bien con lo que ya tienes:`,
    day1: (s?: string) =>
      `Gracias por tu compra${s ? ` de ${s}` : ''}. Si tuviste algún problema para descargarla, responde este correo o escríbenos por WhatsApp. Cuando quieras, estos materiales la complementan:`,
    view: (name: string) => `Ver ${name}`,
    subjectLast: (s?: string) => `Te falta 1 material para completar ${s || 'tu colección'}`,
    subjectMany: (s?: string) => `Complementa ${s || 'tu compra'} con estos materiales`,
  },
  en: {
    htmlLang: 'en',
    previewLast: "You're 1 material away from completing your collection",
    previewMany: (s?: string) => `Complement ${s || 'your purchase'}`,
    h1Last: '🎯 Just 1 left to complete it',
    h1Many: '🚀 Complement your learning',
    hello: (n?: string) => `Hi${n ? ` ${n}` : ''},`,
    day3: (s?: string) =>
      `A few days have passed since ${s ? `you received ${s}` : 'your purchase'}. These materials pair really well with what you already have:`,
    day1: (s?: string) =>
      `Thank you for your purchase${s ? ` of ${s}` : ''}. If you had any trouble downloading it, reply to this email or message us on WhatsApp. Whenever you're ready, these materials complement it:`,
    view: (name: string) => `View ${name}`,
    subjectLast: (s?: string) => `You're 1 material away from completing ${s || 'your collection'}`,
    subjectMany: (s?: string) => `Complement ${s || 'your purchase'} with these materials`,
  },
  it: {
    htmlLang: 'it',
    previewLast: 'Ti manca 1 materiale per completare la tua collezione',
    previewMany: (s?: string) => `Completa ${s || 'il tuo acquisto'}`,
    h1Last: '🎯 Te ne manca solo 1 per completarla',
    h1Many: '🚀 Completa il tuo apprendimento',
    hello: (n?: string) => `Ciao${n ? ` ${n}` : ''},`,
    day3: (s?: string) =>
      `Sono passati alcuni giorni da quando ${s ? `hai ricevuto ${s}` : 'hai fatto il tuo acquisto'}. Questi materiali si abbinano molto bene a quello che hai già:`,
    day1: (s?: string) =>
      `Grazie per il tuo acquisto${s ? ` di ${s}` : ''}. Se hai avuto qualche problema a scaricarlo, rispondi a questa email o scrivici su WhatsApp. Quando vuoi, questi materiali lo completano:`,
    view: (name: string) => `Vedi ${name}`,
    subjectLast: (s?: string) => `Ti manca 1 materiale per completare ${s || 'la tua collezione'}`,
    subjectMany: (s?: string) => `Completa ${s || 'il tuo acquisto'} con questi materiali`,
  },
} as const

const Email = ({ customerName, sourceName, offers = [], day, lang }: Props) => {
  const c = COPY[lang === 'en' ? 'en' : lang === 'it' ? 'it' : 'es']
  const last = offers.length === 1
  return (
    <Html lang={c.htmlLang} dir="ltr">
      <Head />
      <Preview>{last ? c.previewLast : c.previewMany(sourceName)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>iLingue Relax</Text>
            <Heading style={h1}>{last ? c.h1Last : c.h1Many}</Heading>
          </Section>
          <Text style={p}>{c.hello(customerName)}</Text>
          <Text style={p}>{day === 3 ? c.day3(sourceName) : c.day1(sourceName)}</Text>
          {offers.map((o) => (
            <Section key={o.url} style={card}>
              <Text style={offerName}>{o.name}</Text>
              <Text style={{ margin: '8px 0 0' }}>
                <a href={o.url} style={btn}>{c.view(o.name)}</a>
              </Text>
            </Section>
          ))}
          <Text style={footer}>hola@ilinguerelax.com · www.ilinguerelax.com</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) => {
    const c = COPY[d.lang === 'en' ? 'en' : d.lang === 'it' ? 'it' : 'es']
    return (d.offers?.length ?? 0) === 1 ? c.subjectLast(d.sourceName) : c.subjectMany(d.sourceName)
  },
  displayName: 'Upsell post-compra (cliente)',
  previewData: {
    customerName: 'María',
    sourceName: 'Patrones Especiales en Inglés',
    lang: 'es',
    offers: [
      { name: '1,000 Verbos Esenciales en Inglés', url: 'https://www.ilinguerelax.com/products/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion' },
      { name: '500 Preguntas en Inglés', url: 'https://www.ilinguerelax.com/products/500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes' },
    ],
    day: 1,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, color: '#111827' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }
const header = { borderBottom: '2px solid #0d9488', paddingBottom: '12px', marginBottom: '20px', textAlign: 'center' as const }
const brand = { margin: 0, fontSize: '12px', color: '#0d9488', letterSpacing: '2px', fontWeight: 'bold' as const }
const h1 = { fontSize: '22px', color: '#111827', margin: '8px 0 4px' }
const p = { fontSize: '15px', lineHeight: '1.6', color: '#374151', margin: '0 0 12px' }
const card = { border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 18px', marginBottom: '12px' }
const offerName = { margin: 0, fontSize: '16px', fontWeight: 'bold' as const, color: '#111827' }
const btn = { display: 'inline-block', backgroundColor: '#0d9488', color: '#ffffff', textDecoration: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: 'bold' as const, fontSize: '14px' }
const footer = { textAlign: 'center' as const, color: '#9ca3af', fontSize: '12px', margin: '16px 0 0' }
