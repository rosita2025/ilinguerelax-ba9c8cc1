import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

/**
 * Upsell post-compra (día 1 y día 3). Se envía SOLO con los upsells configurados
 * en admin para el producto comprado que el cliente todavía NO tiene.
 */
interface Offer { name: string; url: string; image?: string }
interface Props {
  customerName?: string
  sourceName?: string
  offers?: Offer[]
  day?: number
}

const Email = ({ customerName, sourceName, offers = [], day }: Props) => {
  const last = offers.length === 1
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>{last ? 'Te falta 1 material para completar tu colección' : `Complementa ${sourceName || 'tu compra'}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>iLingue Relax</Text>
            <Heading style={h1}>{last ? '🎯 Solo te falta 1 para completarlo' : '🚀 Complementa tu aprendizaje'}</Heading>
          </Section>
          <Text style={p}>Hola{customerName ? ` ${customerName}` : ''},</Text>
          <Text style={p}>
            {day === 3
              ? `Ya pasaron unos días desde ${sourceName ? `que recibiste ${sourceName}` : 'tu compra'}. Estos materiales combinan muy bien con lo que ya tienes:`
              : `Gracias por tu compra${sourceName ? ` de ${sourceName}` : ''}. Si tuviste algún problema para descargarla, responde este correo o escríbenos por WhatsApp. Cuando quieras, estos materiales la complementan:`}
          </Text>
          {offers.map((o) => (
            <Section key={o.url} style={card}>
              <Text style={offerName}>{o.name}</Text>
              <Text style={{ margin: '8px 0 0' }}>
                <a href={o.url} style={btn}>Ver {o.name}</a>
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
  subject: (d: Props) =>
    (d.offers?.length ?? 0) === 1
      ? `Te falta 1 material para completar ${d.sourceName || 'tu colección'}`
      : `Complementa ${d.sourceName || 'tu compra'} con estos materiales`,
  displayName: 'Upsell post-compra (cliente)',
  previewData: {
    customerName: 'María',
    sourceName: 'Patrones Especiales en Inglés',
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
