import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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
  customerEmail?: string
  customerPhone?: string
  customerCountry?: string
  productName?: string
  amount?: number
  currency?: string
  method?: string
  orderDate?: string
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

const digitsOnly = (s?: string) => (s || '').replace(/[^\d]/g, '')

const Email = ({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  customerCountry,
  productName,
  amount,
  currency,
  method,
  orderDate,
}: Props) => {
  const waNumber = digitsOnly(customerPhone)
  const waText =
    `Hola ${customerName || ''} 👋 Soy Rosa de iLingue Relax. ` +
    `Recibí tu pedido ${orderNumber || ''} por ${fmtMoney(amount, currency)} (${method || 'Yape/Plin'}). ` +
    `¿Me confirmas la captura del pago para enviarte tu material?`
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`
    : ''

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>⏳ Nuevo pedido pendiente {orderNumber || ''} · {customerName || ''} · {fmtMoney(amount, currency)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>iLingue Relax · ADMIN</Text>
            <Heading style={h1}>⏳ Nuevo pedido pendiente (Yape/Plin)</Heading>
            <Text style={orderTag}>PEDIDO #{orderNumber || '—'}</Text>
          </Section>

          <Section style={cardHi}>
            <Text style={hiTitle}>Cliente para contactar</Text>
            <Text style={hiName}>{customerName || '—'}</Text>
            <Text style={hiLine}>📱 {customerPhone || '—'}</Text>
            <Text style={hiLine}>📧 {customerEmail || '—'}</Text>
            {waUrl ? (
              <Button href={waUrl} style={waBtn}>💬 Abrir WhatsApp del cliente</Button>
            ) : (
              <Text style={muted}>Sin teléfono — contactar por correo</Text>
            )}
          </Section>

          <Section style={card}>
            <Row>
              <Column><Text style={label}>Producto</Text></Column>
              <Column align="right"><Text style={value}>{productName || '—'}</Text></Column>
            </Row>
            <Hr style={hr} />
            <Row>
              <Column><Text style={label}>Monto</Text></Column>
              <Column align="right"><Text style={amountVal}>{fmtMoney(amount, currency)}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={label}>Método</Text></Column>
              <Column align="right"><Text style={value}>{method || 'Yape/Plin'}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={label}>País</Text></Column>
              <Column align="right"><Text style={value}>{customerCountry || '—'}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={label}>Fecha</Text></Column>
              <Column align="right"><Text style={value}>{orderDate ? new Date(orderDate).toLocaleString('es') : new Date().toLocaleString('es')}</Text></Column>
            </Row>
          </Section>

          <Text style={footer}>
            Verificar en el panel: https://www.ilinguerelax.com/admin/manual-payments
          </Text>
          <Text style={footer}>Notificación automática · hola@ilinguerelax.com</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) =>
    `⏳ Pedido pendiente #${d.orderNumber || 'ILR'} · ${d.customerName || 'Cliente'} · ${fmtMoney(d.amount, d.currency)}`,
  displayName: 'Aviso pedido pendiente (Yape/Plin)',
  to: 'hola@ilinguerelax.com',
  previewData: {
    orderNumber: 'ILR-YP-1234',
    customerName: 'María Pérez',
    customerEmail: 'maria@example.com',
    customerPhone: '+51 987 654 321',
    customerCountry: 'PE',
    productName: '1,000 Verbos en Inglés',
    amount: 45,
    currency: 'PEN',
    method: 'Yape/Plin',
    orderDate: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, color: '#111827' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }
const header = { borderBottom: '2px solid #ea580c', paddingBottom: '12px', marginBottom: '20px' }
const brand = { margin: 0, fontSize: '12px', color: '#ea580c', letterSpacing: '1px', fontWeight: 'bold' as const }
const h1 = { fontSize: '22px', color: '#111827', margin: '8px 0 4px' }
const orderTag = { margin: 0, fontSize: '12px', color: '#6b7280', letterSpacing: '1px' }
const cardHi = { backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '12px', padding: '18px 20px', marginBottom: '16px', textAlign: 'center' as const }
const hiTitle = { margin: 0, fontSize: '12px', color: '#065f46', letterSpacing: '1px', fontWeight: 'bold' as const }
const hiName = { margin: '6px 0 2px', fontSize: '20px', color: '#065f46', fontWeight: 'bold' as const }
const hiLine = { margin: '2px 0', fontSize: '14px', color: '#065f46' }
const waBtn = { backgroundColor: '#25D366', color: '#ffffff', padding: '12px 24px', borderRadius: '999px', fontWeight: 'bold' as const, fontSize: '15px', textDecoration: 'none', display: 'inline-block', marginTop: '10px' }
const muted = { margin: '8px 0 0', fontSize: '12px', color: '#6b7280' }
const card = { border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }
const label = { margin: '4px 0', fontSize: '13px', color: '#6b7280' }
const value = { margin: '4px 0', fontSize: '14px', color: '#111827', fontWeight: 'bold' as const }
const amountVal = { margin: '4px 0', fontSize: '18px', color: '#ea580c', fontWeight: 'bold' as const }
const hr = { borderColor: '#f3f4f6', margin: '8px 0' }
const footer = { textAlign: 'center' as const, color: '#9ca3af', fontSize: '12px', margin: '8px 0 0' }
