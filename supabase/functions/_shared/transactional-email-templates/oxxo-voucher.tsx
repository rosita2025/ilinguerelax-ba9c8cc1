import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

/**
 * Ficha de OXXO (México): se envía en cuanto se genera la ficha, para que la persona no la pierda.
 * El pago es en efectivo en la tienda; el acceso llega por correo cuando OXXO confirma el pago.
 */
interface Props {
  customerName?: string
  customerEmail?: string
  productName?: string
  amount?: number
  currency?: string
  reference?: string
  voucherUrl?: string
  expiresAt?: string
  orderNumber?: string
}

const fmtMoney = (amount?: number, currency?: string) => {
  if (amount == null) return '—'
  const c = (currency || 'MXN').toUpperCase()
  try {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: c }).format(Number(amount))
  } catch {
    return `${Number(amount).toFixed(2)} ${c}`
  }
}

const fmtDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City' }).format(d)
  } catch {
    return d.toISOString()
  }
}

const trackingUrl = (orderNumber?: string, customerEmail?: string) => {
  const base = 'https://www.ilinguerelax.com/mi-pedido'
  const params: string[] = []
  if (orderNumber) params.push(`order=${encodeURIComponent(orderNumber)}`)
  if (customerEmail) params.push(`email=${encodeURIComponent(customerEmail)}`)
  return params.length ? `${base}?${params.join('&')}` : base
}

const Email = ({ customerName, customerEmail, productName, amount, currency, reference, voucherUrl, expiresAt, orderNumber }: Props) => {
  const until = fmtDate(expiresAt)
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Tu ficha de OXXO está lista{until ? ` — págala antes del ${until}` : ''}. Todavía no se te cobró nada.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>iLingue Relax</Text>
            <Heading style={h1}>🧾 Tu ficha de OXXO está lista</Heading>
          </Section>

          <Section style={cardHi}>
            <Text style={hiTitle}>¡Hola {customerName || ''}! 👋</Text>
            <Text style={hiLine}>
              Todavía <strong>no se te cobró nada</strong>. Para recibir tu acceso, paga en efectivo en cualquier tienda OXXO con el número de referencia de abajo.
            </Text>
          </Section>

          <Section style={card}>
            <Row>
              <Column><Text style={label}>Producto</Text></Column>
              <Column align="right"><Text style={value}>{productName || 'Tu pedido iLingue Relax'}</Text></Column>
            </Row>
            <Hr style={hr} />
            <Row>
              <Column><Text style={label}>Monto a pagar</Text></Column>
              <Column align="right"><Text style={amountVal}>{fmtMoney(amount, currency)}</Text></Column>
            </Row>
            {until ? (
              <Row>
                <Column><Text style={label}>Vence</Text></Column>
                <Column align="right"><Text style={value}>{until}</Text></Column>
              </Row>
            ) : null}
          </Section>

          {reference ? (
            <Section style={refBox}>
              <Text style={refLabel}>NÚMERO DE REFERENCIA</Text>
              <Text style={refNumber}>{reference}</Text>
            </Section>
          ) : null}

          {voucherUrl ? (
            <Text style={{ textAlign: 'center' as const, margin: '16px 0' }}>
              <a href={voucherUrl} style={primaryBtn}>Ver mi ficha con código de barras</a>
            </Text>
          ) : null}

          <Section style={card}>
            <Text style={stepsTitle}>Cómo pagar</Text>
            <Text style={step}>1. Abre tu ficha (botón de arriba) o dicta el número de referencia en caja.</Text>
            <Text style={step}>2. Paga el monto en efectivo en cualquier OXXO.</Text>
            <Text style={step}>3. Cuando OXXO confirme el pago, tu acceso llega a este mismo correo.</Text>
          </Section>

          <Text style={trust}>🔒 Pago seguro procesado por Stripe · Sin tarjeta y sin identificación · Garantía de 7 días</Text>

          <Section style={trackBox}>
            <Text style={{ textAlign: 'center' as const, margin: '8px 0' }}>
              <a href={trackingUrl(orderNumber, customerEmail)} style={trackBtn}>Ver estado de mi pedido</a>
            </Text>
            <Text style={{ textAlign: 'center' as const, margin: '8px 0' }}>
              <a href={`https://wa.me/12512724704?text=${encodeURIComponent('Hola, tengo una duda con mi ficha de OXXO.')}`} style={whatsappBtn}>¿Dudas? Escríbenos por WhatsApp</a>
            </Text>
          </Section>

          <Text style={footer}>Si ya pagaste, ignora este correo: el acceso llega en cuanto OXXO lo confirme 💛</Text>
          <Text style={footer}>hola@ilinguerelax.com · www.ilinguerelax.com</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) => `🧾 Tu ficha de OXXO está lista${d.reference ? ` · ref. ${d.reference}` : ''}`,
  displayName: 'Ficha de OXXO (cliente)',
  previewData: {
    customerName: 'María',
    customerEmail: 'maria@ejemplo.com',
    productName: 'Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés',
    amount: 256.72,
    currency: 'MXN',
    reference: '12345678901234',
    voucherUrl: 'https://payments.stripe.com/oxxo/voucher/ejemplo',
    expiresAt: '2026-11-25T18:00:00Z',
    orderNumber: 'ILR-ST-ABCD1234',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, color: '#111827' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }
const header = { borderBottom: '2px solid #0d9488', paddingBottom: '12px', marginBottom: '20px', textAlign: 'center' as const }
const brand = { margin: 0, fontSize: '12px', color: '#0d9488', letterSpacing: '2px', fontWeight: 'bold' as const }
const h1 = { fontSize: '22px', color: '#111827', margin: '8px 0 4px' }
const cardHi = { backgroundColor: '#f0fdfa', border: '1px solid #0d9488', borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }
const hiTitle = { margin: '0 0 8px', fontSize: '18px', color: '#0f766e', fontWeight: 'bold' as const }
const hiLine = { margin: '6px 0', fontSize: '14px', color: '#134e4a', lineHeight: '1.5' }
const card = { border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }
const label = { margin: '4px 0', fontSize: '13px', color: '#6b7280' }
const value = { margin: '4px 0', fontSize: '14px', color: '#111827', fontWeight: 'bold' as const }
const amountVal = { margin: '4px 0', fontSize: '18px', color: '#0d9488', fontWeight: 'bold' as const }
const hr = { borderColor: '#f3f4f6', margin: '8px 0' }
const refBox = { backgroundColor: '#fffbeb', border: '2px dashed #f59e0b', borderRadius: '12px', padding: '14px', textAlign: 'center' as const, marginBottom: '8px' }
const refLabel = { margin: '0 0 4px', fontSize: '11px', letterSpacing: '1px', color: '#92400e', fontWeight: 'bold' as const }
const refNumber = { margin: 0, fontSize: '24px', letterSpacing: '2px', color: '#111827', fontWeight: 'bold' as const, fontFamily: 'Courier New, monospace' }
const primaryBtn = { backgroundColor: '#0d9488', color: '#ffffff', textDecoration: 'none', padding: '13px 26px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold' as const, display: 'inline-block' }
const stepsTitle = { margin: '0 0 6px', fontSize: '15px', fontWeight: 'bold' as const, color: '#0f766e' }
const step = { margin: '4px 0', fontSize: '13px', color: '#374151', lineHeight: '1.5' }
const trust = { textAlign: 'center' as const, fontSize: '12px', color: '#4b5563', margin: '8px 0 16px' }
const trackBox = { backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '10px', padding: '12px', margin: '12px 0' }
const trackBtn = { backgroundColor: '#0d9488', color: '#ffffff', textDecoration: 'none', padding: '11px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' as const, display: 'inline-block' }
const whatsappBtn = { backgroundColor: '#15803d', color: '#ffffff', textDecoration: 'none', padding: '11px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' as const, display: 'inline-block' }
const footer = { textAlign: 'center' as const, color: '#9ca3af', fontSize: '12px', margin: '8px 0 0' }
