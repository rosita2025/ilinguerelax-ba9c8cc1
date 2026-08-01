import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  productName?: string
  /** Etiqueta libre de la actualización, p. ej. "v1.7" */
  versionLabel?: string
  /** Lista de novedades (texto plano, una por línea en el admin) */
  changes?: string[]
  /** Siempre la URL privada /mi-descarga?t=<token>. Nunca enlaces de Drive. */
  downloadUrl?: string
  /** Nota del bono nuevo (opcional) */
  bonusNote?: string
}

const Email = ({ customerName, productName, versionLabel, changes, downloadUrl, bonusNote }: Props) => {
  const name = customerName?.trim() || 'Cliente'
  const product = productName?.trim() || 'Tu material ILINGUE RELAX'
  const version = versionLabel?.trim() || ''
  const list = (changes ?? []).filter((c) => !!c && String(c).trim().length > 0)
  const url = downloadUrl || 'https://ilinguerelax.com/mi-pedido'

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>{`Tu material se actualizó${version ? ` a la ${version}` : ''}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brand}>ILINGUE RELAX</Text>
            <Text style={orderTag}>ACTUALIZACIÓN DE MATERIAL{version ? ` · ${version}` : ''}</Text>
          </Section>

          <Heading style={h1}>
            {`¡Hola ${name}! Tu material se actualizó${version ? ` a la ${version}` : ''} ✨`}
          </Heading>

          <Text style={intro}>
            Actualizamos <strong>{product}</strong> que ya compraste. No tienes que pagar nada ni volver
            a comprarlo: la nueva versión ya está disponible en <strong>tu mismo enlace de descarga</strong> de siempre.
          </Text>

          {list.length > 0 && (
            <Section style={itemCard}>
              <Text style={itemName}>Novedades de esta versión</Text>
              {list.map((c, i) => (
                <Text key={i} style={bullet}>• {c}</Text>
              ))}
            </Section>
          )}

          {bonusNote && bonusNote.trim().length > 0 && (
            <Section style={bonusBox}>
              <Text style={bonusText}>🎁 <strong>Bono actualizado:</strong> {bonusNote}</Text>
            </Section>
          )}

          <Section style={{ textAlign: 'center' as const, margin: '24px 0 8px' }}>
            <Button href={url} style={btn}>Abrir mis descargas</Button>
          </Section>
          <Text style={small}>
            Es el mismo enlace privado de tu pedido; no se genera uno nuevo. Si lo tenías guardado, sigue funcionando.
          </Text>

          <Hr style={hr} />

          <Text style={support}>
            ¿Algún problema para abrir el material? Responde este correo o escríbenos a{' '}
            <Link href="mailto:hola@ilinguerelax.com" style={linkA}>hola@ilinguerelax.com</Link>{' '}
            · WhatsApp{' '}
            <Link href="https://wa.me/12512724704" style={linkA}>+1 251 272 4704</Link>.
          </Text>
          <Text style={footer}>© {new Date().getFullYear()} ILINGUE RELAX · ilinguerelax.com</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) =>
    `📘 Tu material se actualizó${d.versionLabel ? ` a la ${d.versionLabel}` : ''} — ${d.productName || 'ILINGUE RELAX'}`,
  displayName: 'Actualización de material comprado',
  previewData: {
    customerName: 'María Pérez',
    productName: '1,000 Palabras Esenciales en Inglés',
    versionLabel: 'v1.7',
    changes: ['Nuevas 120 páginas de ejemplos', 'Audio de pronunciación revisado'],
    downloadUrl: 'https://ilinguerelax.com/mi-descarga?t=TOKEN_PRIVADO',
    bonusNote: 'Se añadió el bono de frases de viaje en tu misma carpeta.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, color: '#111827' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }
const brandBar = { borderBottom: '2px solid #0f766e', paddingBottom: '12px', marginBottom: '24px' }
const brand = { margin: 0, fontSize: '20px', fontWeight: 'bold' as const, color: '#0f766e', letterSpacing: '1px' }
const orderTag = { margin: '4px 0 0', fontSize: '12px', color: '#6b7280', letterSpacing: '1px' }
const h1 = { fontSize: '23px', color: '#111827', margin: '0 0 12px' }
const intro = { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const itemCard = { padding: '16px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '12px' }
const itemName = { margin: '0 0 8px', fontSize: '15px', fontWeight: 'bold' as const, color: '#111827' }
const bullet = { margin: '0 0 6px', fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }
const bonusBox = { padding: '12px 16px', backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '10px', margin: '4px 0 0' }
const bonusText = { margin: 0, fontSize: '14px', color: '#115e59', lineHeight: '1.6' }
const btn = { backgroundColor: '#0f766e', color: '#ffffff', padding: '13px 22px', borderRadius: '8px', textDecoration: 'none', fontSize: '15px', fontWeight: 'bold' as const, display: 'inline-block' }
const small = { fontSize: '13px', color: '#6b7280', lineHeight: '1.6', textAlign: 'center' as const, margin: 0 }
const linkA = { color: '#0f766e', textDecoration: 'underline' }
const support = { fontSize: '14px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { textAlign: 'center' as const, color: '#9ca3af', fontSize: '12px', margin: '16px 0 0' }
