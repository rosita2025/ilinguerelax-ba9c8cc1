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

interface Props {
  orderNumber?: string
  customerName?: string
  productName?: string
  amount?: number
  currency?: string
  amountUsd?: number
  method?: string
  orderDate?: string
  binancePayId?: string
  binanceAddress?: string
  binanceNetwork?: string
}

const fmtMoney = (amount?: number, currency?: string) => {
  if (amount == null) return '—'
  const c = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('es', { style: 'currency', currency: c }).format(Number(amount))
  } catch {
    return `${Number(amount).toFixed(2)} ${c}`
  }
}

const Email = ({
  orderNumber,
  customerName,
  productName,
  amount,
  currency,
  amountUsd,
  method,
  orderDate,
  binancePayId,
  binanceAddress,
  binanceNetwork,
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>
      ⏳ Recibimos tu pedido {orderNumber || ''} — revisaremos tu pago en máximo 24 horas
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>ILINGUE RELAX</Text>
          <Heading style={h1}>⏳ Tu pedido está en revisión</Heading>
          <Text style={orderTag}>PEDIDO #{orderNumber || '—'}</Text>
        </Section>

        <Section style={cardHi}>
          <Text style={hiTitle}>¡Hola {customerName || ''}! 👋</Text>
          <Text style={hiLine}>
            Recibimos tu comprobante de pago por <strong>{method || 'Yape/Plin'}</strong>. Nuestra
            supervisora <strong>Rosa</strong> lo revisará y confirmará en un plazo{' '}
            <strong>máximo de 24 horas</strong>.
          </Text>
          <Text style={hiLine}>
            Guarda este correo — es tu comprobante en caso de que se cierre la página o tu batería
            se apague. No necesitas hacer nada más.
          </Text>
        </Section>

        <Section style={card}>
          <Row>
            <Column><Text style={label}>Producto</Text></Column>
            <Column align="right"><Text style={value}>{productName || '—'}</Text></Column>
          </Row>
          <Hr style={hr} />
          <Row>
            <Column><Text style={label}>Monto pagado</Text></Column>
            <Column align="right"><Text style={amountVal}>{fmtMoney(amount, currency)}</Text></Column>
          </Row>
          <Row>
            <Column><Text style={label}>Método</Text></Column>
            <Column align="right"><Text style={value}>{method || 'Yape/Plin'}</Text></Column>
          </Row>
          <Row>
            <Column><Text style={label}>Fecha</Text></Column>
            <Column align="right">
              <Text style={value}>
                {orderDate ? new Date(orderDate).toLocaleString('es') : new Date().toLocaleString('es')}
              </Text>
            </Column>
          </Row>
        </Section>

        <Section style={nextBox}>
          <Text style={nextTitle}>¿Qué sigue?</Text>
          <Text style={nextLine}>1️⃣ Rosa verifica tu pago (máximo 24 h).</Text>
          <Text style={nextLine}>2️⃣ Recibirás un correo con el enlace de descarga de tu material digital.</Text>
          <Text style={nextLine}>3️⃣ Si necesitas ayuda urgente, escríbenos a hola@ilinguerelax.com.</Text>
        </Section>

        <Text style={footer}>Gracias por tu compra 💛 — Equipo ILINGUE RELAX</Text>
        <Text style={footer}>hola@ilinguerelax.com · www.ilinguerelax.com</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) =>
    `⏳ Recibimos tu pedido #${d.orderNumber || 'ILR'} — revisión en máximo 24h`,
  displayName: 'Confirmación pedido pendiente (cliente)',
  previewData: {
    orderNumber: 'ILR-YP-1234',
    customerName: 'María',
    productName: '1,000 Verbos en Inglés',
    amount: 45,
    currency: 'PEN',
    method: 'Yape/Plin',
    orderDate: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, color: '#111827' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }
const header = { borderBottom: '2px solid #0d9488', paddingBottom: '12px', marginBottom: '20px', textAlign: 'center' as const }
const brand = { margin: 0, fontSize: '12px', color: '#0d9488', letterSpacing: '2px', fontWeight: 'bold' as const }
const h1 = { fontSize: '22px', color: '#111827', margin: '8px 0 4px' }
const orderTag = { margin: 0, fontSize: '12px', color: '#6b7280', letterSpacing: '1px' }
const cardHi = { backgroundColor: '#f0fdfa', border: '1px solid #0d9488', borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }
const hiTitle = { margin: '0 0 8px', fontSize: '18px', color: '#0f766e', fontWeight: 'bold' as const }
const hiLine = { margin: '6px 0', fontSize: '14px', color: '#134e4a', lineHeight: '1.5' }
const card = { border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }
const label = { margin: '4px 0', fontSize: '13px', color: '#6b7280' }
const value = { margin: '4px 0', fontSize: '14px', color: '#111827', fontWeight: 'bold' as const }
const amountVal = { margin: '4px 0', fontSize: '18px', color: '#0d9488', fontWeight: 'bold' as const }
const hr = { borderColor: '#f3f4f6', margin: '8px 0' }
const nextBox = { backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }
const nextTitle = { margin: '0 0 8px', fontSize: '14px', color: '#92400e', fontWeight: 'bold' as const }
const nextLine = { margin: '4px 0', fontSize: '13px', color: '#78350f', lineHeight: '1.5' }
const footer = { textAlign: 'center' as const, color: '#9ca3af', fontSize: '12px', margin: '8px 0 0' }
