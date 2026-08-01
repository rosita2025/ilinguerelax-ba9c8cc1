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
  customerEmail?: string
  customerPhone?: string
  customerCountry?: string
  productName?: string
  amount?: number
  currency?: string
  provider?: string
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

const Email = ({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  customerCountry,
  productName,
  amount,
  currency,
  provider,
  orderDate,
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Nueva venta {orderNumber || ''} · {productName || ''} · {fmtMoney(amount, currency)}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>iLingue Relax · ADMIN</Text>
          <Heading style={h1}>🛒 Nueva venta</Heading>
          <Text style={orderTag}>PEDIDO #{orderNumber || '—'}</Text>
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
            <Column align="right"><Text style={value}>{provider || '—'}</Text></Column>
          </Row>
          <Row>
            <Column><Text style={label}>Fecha</Text></Column>
            <Column align="right"><Text style={value}>{orderDate ? new Date(orderDate).toLocaleString('es') : new Date().toLocaleString('es')}</Text></Column>
          </Row>
        </Section>

        <Section style={card}>
          <Heading as="h2" style={h2}>Datos del cliente</Heading>
          <Row><Column><Text style={label}>Nombre</Text></Column><Column align="right"><Text style={value}>{customerName || '—'}</Text></Column></Row>
          <Row><Column><Text style={label}>Correo</Text></Column><Column align="right"><Text style={value}>{customerEmail || '—'}</Text></Column></Row>
          <Row><Column><Text style={label}>Teléfono</Text></Column><Column align="right"><Text style={value}>{customerPhone || '—'}</Text></Column></Row>
          <Row><Column><Text style={label}>País</Text></Column><Column align="right"><Text style={value}>{customerCountry || '—'}</Text></Column></Row>
        </Section>

        <Text style={footer}>Notificación automática · hola@ilinguerelax.com</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) =>
    `🛒 Venta #${d.orderNumber || 'ILR'} · ${d.productName || 'pedido'} · ${fmtMoney(d.amount, d.currency)}`,
  displayName: 'Aviso de venta (admin)',
  to: 'hola@ilinguerelax.com',
  previewData: {
    orderNumber: 'ILR-ST-20260710-ABC123',
    customerName: 'María Pérez',
    customerEmail: 'maria@example.com',
    customerPhone: '+51 987 654 321',
    customerCountry: 'PE',
    productName: '1,000 Verbos en Inglés',
    amount: 15,
    currency: 'USD',
    provider: 'stripe',
    orderDate: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, color: '#111827' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }
const header = { borderBottom: '2px solid #0f766e', paddingBottom: '12px', marginBottom: '20px' }
const brand = { margin: 0, fontSize: '12px', color: '#0f766e', letterSpacing: '1px', fontWeight: 'bold' as const }
const h1 = { fontSize: '22px', color: '#111827', margin: '8px 0 4px' }
const orderTag = { margin: 0, fontSize: '12px', color: '#6b7280', letterSpacing: '1px' }
const card = { border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }
const h2 = { fontSize: '15px', color: '#111827', margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const label = { margin: '4px 0', fontSize: '13px', color: '#6b7280' }
const value = { margin: '4px 0', fontSize: '14px', color: '#111827', fontWeight: 'bold' as const }
const amountVal = { margin: '4px 0', fontSize: '18px', color: '#0f766e', fontWeight: 'bold' as const }
const hr = { borderColor: '#f3f4f6', margin: '8px 0' }
const footer = { textAlign: 'center' as const, color: '#9ca3af', fontSize: '12px', margin: '8px 0 0' }
