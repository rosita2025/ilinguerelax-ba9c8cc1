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

interface Material {
  productName: string
  downloadUrl: string
  accessKey?: string
}

interface Props {
  customerName?: string
  orderNumber?: string
  materials?: Material[]
}

const Email = ({ customerName, orderNumber, materials }: Props) => {
  const name = customerName?.trim() || 'Cliente'
  const list: Material[] = materials && materials.length > 0
    ? materials
    : [{ productName: 'Tu producto ILINGUE RELAX', downloadUrl: 'https://ilinguerelax.com' }]
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Tus materiales de {orderNumber || 'ILINGUE RELAX'} están listos</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brand}>ILINGUE RELAX</Text>
            <Text style={orderTag}>PEDIDO #{orderNumber || '—'}</Text>
          </Section>

          <Heading style={h1}>¡Hola {name}! Aquí están tus materiales 🎉</Heading>
          <Text style={intro}>
            Tu pago fue verificado correctamente. A continuación encontrarás los enlaces para acceder a los PDFs y contenidos que compraste.
          </Text>

          <Section style={noticeBox}>
            <Text style={noticeText}>
              📄 <strong>Material digital en PDF descargable.</strong> No es un curso, no incluye clases en vivo,
              profesor ni tutorías. Acceso inmediato y de por vida desde los enlaces de abajo.
            </Text>
          </Section>

          <Hr style={hr} />


          {list.map((m, i) => (
            <Section key={i} style={itemCard}>
              <Text style={itemName}>📘 {m.productName}</Text>
              <Button href={m.downloadUrl} style={btn}>Acceder al material</Button>
              {m.accessKey && (
                <Text style={keyLine}>
                  Clave de acceso: <strong style={keyValue}>{m.accessKey}</strong>
                </Text>
              )}
              <Text style={link}>
                <Link href={m.downloadUrl} style={linkA}>{m.downloadUrl}</Link>
              </Text>
            </Section>
          ))}

          <Hr style={hr} />

          <Text style={support}>
            Guarda este correo — puedes volver a acceder cuando quieras. Si tienes cualquier problema, responde este mensaje o escríbenos a{' '}
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
  subject: (d: Props) => `📥 Tus materiales de ILINGUE RELAX — Pedido #${d.orderNumber || 'ILR'}`,
  displayName: 'Entrega de materiales digitales',
  previewData: {
    customerName: 'María Pérez',
    orderNumber: 'ILR-YP-1234',
    materials: [
      {
        productName: 'Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés',
        downloadUrl: 'https://ilinguerelax.com/descarga/patrones-ingles',
        accessKey: '123A',
      },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, color: '#111827' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }
const brandBar = { borderBottom: '2px solid #0f766e', paddingBottom: '12px', marginBottom: '24px' }
const brand = { margin: 0, fontSize: '20px', fontWeight: 'bold' as const, color: '#0f766e', letterSpacing: '1px' }
const orderTag = { margin: '4px 0 0', fontSize: '12px', color: '#6b7280', letterSpacing: '1px' }
const h1 = { fontSize: '24px', color: '#111827', margin: '0 0 12px' }
const intro = { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 8px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const itemCard = { padding: '16px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '12px' }
const itemName = { margin: '0 0 12px', fontSize: '16px', fontWeight: 'bold' as const, color: '#111827' }
const btn = { backgroundColor: '#0f766e', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' as const, display: 'inline-block' }
const keyLine = { margin: '12px 0 0', fontSize: '14px', color: '#4b5563' }
const keyValue = { color: '#0f766e', fontFamily: 'monospace' as const, fontSize: '15px' }
const link = { margin: '8px 0 0', fontSize: '12px', color: '#6b7280', wordBreak: 'break-all' as const }
const linkA = { color: '#0f766e', textDecoration: 'underline' }
const support = { fontSize: '14px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { textAlign: 'center' as const, color: '#9ca3af', fontSize: '12px', margin: '16px 0 0' }
