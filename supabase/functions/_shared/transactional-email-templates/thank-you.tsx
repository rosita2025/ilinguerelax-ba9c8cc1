import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
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
  if (amount == null) return null
  const c = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('es', { style: 'currency', currency: c }).format(Number(amount))
  } catch {
    return `${Number(amount).toFixed(2)} ${c}`
  }
}

const fmtDate = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date()
  try {
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return d.toDateString()
  }
}

const providerLabel = (p?: string) =>
  p === 'stripe' ? 'Tarjeta (Stripe)' : p === 'paypal' ? 'PayPal' : p === 'mercadopago' ? 'Mercado Pago' : (p || '—')

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
}: Props) => {
  const money = fmtMoney(amount, currency)
  const name = customerName?.trim() || 'Cliente'
  const product = productName || 'Tu pedido ILINGUE RELAX'
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Pedido {orderNumber || ''} confirmado — ILINGUE RELAX</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brand}>ILINGUE RELAX</Text>
            <Text style={orderTag}>PEDIDO #{orderNumber || '—'}</Text>
          </Section>

          <Section style={hero}>
            <Heading style={h1}>¡Gracias por tu compra!</Heading>
            <Text style={heroSub}>
              En breve recibirás un correo con los enlaces de acceso a tu producto.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading as="h2" style={h2}>Resumen del pedido</Heading>
            <Row style={itemRow}>
              <Column>
                <Text style={itemName}>{product}</Text>
                <Text style={itemMeta}>Cantidad: 1</Text>
              </Column>
              <Column align="right">
                <Text style={itemPrice}>{money || '—'}</Text>
              </Column>
            </Row>

            <Hr style={hrLight} />

            <Row>
              <Column><Text style={totalLabel}>Subtotal</Text></Column>
              <Column align="right"><Text style={totalVal}>{money || '—'}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={totalLabel}>Envío</Text></Column>
              <Column align="right"><Text style={totalVal}>Gratis (digital)</Text></Column>
            </Row>
            <Row>
              <Column><Text style={grandLabel}>Total</Text></Column>
              <Column align="right"><Text style={grandVal}>{money || '—'}</Text></Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading as="h2" style={h2}>Información del cliente</Heading>
            <Row>
              <Column style={infoCol}>
                <Text style={infoLabel}>Nombre</Text>
                <Text style={infoVal}>{name}</Text>
                <Text style={infoLabel}>Correo</Text>
                <Text style={infoVal}>{customerEmail || '—'}</Text>
              </Column>
              <Column style={infoCol}>
                <Text style={infoLabel}>Teléfono</Text>
                <Text style={infoVal}>{customerPhone || '—'}</Text>
                <Text style={infoLabel}>País</Text>
                <Text style={infoVal}>{customerCountry || '—'}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={infoLabel}>Método de pago</Text>
                <Text style={infoVal}>{providerLabel(provider)}</Text>
              </Column>
              <Column align="right">
                <Text style={infoLabel}>Fecha</Text>
                <Text style={infoVal}>{fmtDate(orderDate)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={support}>
              ¿Alguna duda? Responde este correo o escríbenos a{' '}
              <Link href="mailto:hola@ilinguerelax.com" style={link}>hola@ilinguerelax.com</Link>{' '}
              · WhatsApp{' '}
              <Link href="https://wa.me/12512724704" style={link}>+1 251 272 4704</Link>.
            </Text>
            <Text style={footer}>
              © {new Date().getFullYear()} ILINGUE RELAX · ilinguerelax.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) => `Pedido #${d.orderNumber || 'ILR'} confirmado — ILINGUE RELAX`,
  displayName: 'Gracias por tu compra',
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
const brandBar = { borderBottom: '2px solid #0f766e', paddingBottom: '12px', marginBottom: '24px' }
const brand = { margin: 0, fontSize: '20px', fontWeight: 'bold' as const, color: '#0f766e', letterSpacing: '1px' }
const orderTag = { margin: '4px 0 0', fontSize: '12px', color: '#6b7280', letterSpacing: '1px' }
const hero = { padding: '8px 0 4px' }
const h1 = { fontSize: '26px', color: '#111827', margin: '0 0 8px' }
const heroSub = { fontSize: '15px', color: '#4b5563', margin: 0 }
const h2 = { fontSize: '16px', color: '#111827', margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const hrLight = { borderColor: '#f3f4f6', margin: '12px 0' }
const itemRow = { padding: '4px 0' }
const itemName = { margin: 0, fontSize: '15px', fontWeight: 'bold' as const, color: '#111827' }
const itemMeta = { margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }
const itemPrice = { margin: 0, fontSize: '15px', color: '#111827', fontWeight: 'bold' as const }
const totalLabel = { margin: '4px 0', fontSize: '14px', color: '#4b5563' }
const totalVal = { margin: '4px 0', fontSize: '14px', color: '#111827' }
const grandLabel = { margin: '8px 0 0', fontSize: '16px', color: '#111827', fontWeight: 'bold' as const }
const grandVal = { margin: '8px 0 0', fontSize: '18px', color: '#0f766e', fontWeight: 'bold' as const }
const infoCol = { verticalAlign: 'top' as const, paddingRight: '12px' }
const infoLabel = { margin: '8px 0 2px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const infoVal = { margin: 0, fontSize: '14px', color: '#111827' }
const support = { fontSize: '14px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#0f766e', textDecoration: 'underline' }
const footer = { textAlign: 'center' as const, color: '#9ca3af', fontSize: '12px', margin: '16px 0 0' }
