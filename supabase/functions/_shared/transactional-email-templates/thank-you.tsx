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

interface Item {
  name: string
  qty?: number
  price?: number
  kind?: 'main' | 'upsell' | 'bonus'
}

interface Props {
  orderNumber?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerCountry?: string
  customerAddress?: string
  productName?: string
  items?: Item[]
  bonuses?: string[]
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

const providerLabel = (p?: string) => {
  const k = (p || '').toLowerCase().replace(/[-\s]/g, '_')
  if (k === 'stripe') return 'Tarjeta (Stripe)'
  if (k === 'paypal') return 'PayPal'
  if (k === 'mercadopago') return 'Mercado Pago'
  if (k === 'yape') return 'Yape'
  if (k === 'plin') return 'Plin'
  if (k === 'yape_plin') return 'Yape / Plin'
  if (k === 'binance' || k === 'binance_pay') return 'Binance Pay'
  if (k === 'manual') return 'Pago manual'
  return p || '—'
}

const badge = (kind?: string) => {
  if (kind === 'upsell') return { label: 'ADICIONAL', bg: '#fef3c7', color: '#92400e' }
  if (kind === 'bonus') return { label: 'BONO GRATIS', bg: '#dcfce7', color: '#166534' }
  return { label: 'PRINCIPAL', bg: '#e0f2fe', color: '#075985' }
}

const Email = ({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  customerCountry,
  customerAddress,
  productName,
  items,
  bonuses,
  amount,
  currency,
  provider,
  orderDate,
}: Props) => {
  const money = fmtMoney(amount, currency)
  const name = customerName?.trim() || 'Cliente'

  // Build the line-items list. If caller passed `items`, use them.
  // Otherwise synthesize from productName + bonuses[].
  const lineItems: Item[] = items && items.length > 0
    ? items
    : [
        ...(productName ? [{ name: productName, kind: 'main' as const, qty: 1, price: amount }] : []),
        ...((bonuses || []).map((b) => ({ name: b, kind: 'bonus' as const, price: 0 }))),
      ]

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Pedido {orderNumber || ''} confirmado — iLingue Relax</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brand}>iLingue Relax</Text>
            <Text style={orderTag}>PEDIDO #{orderNumber || '—'}</Text>
          </Section>

          <Section style={hero}>
            <Heading style={h1}>¡Gracias por tu compra, {name}!</Heading>
            <Text style={heroSub}>
              Hemos recibido tu pedido correctamente. En unos minutos recibirás un segundo correo con los enlaces de descarga.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* PRODUCTS */}
          <Section>
            <Heading as="h2" style={h2}>Productos del pedido</Heading>
            {lineItems.length === 0 ? (
              <Text style={itemMeta}>Sin detalle de productos.</Text>
            ) : (
              lineItems.map((it, i) => {
                const b = badge(it.kind)
                const p = fmtMoney(it.price, currency)
                return (
                  <Row key={i} style={itemRow}>
                    <Column>
                      <Text style={itemName}>{it.name}</Text>
                      <Text style={badgePill(b.bg, b.color)}>{b.label}</Text>
                      <Text style={itemMeta}>Cantidad: {it.qty ?? 1}</Text>
                    </Column>
                    <Column align="right">
                      <Text style={itemPrice}>
                        {it.kind === 'bonus' ? 'GRATIS' : (p || '—')}
                      </Text>
                    </Column>
                  </Row>
                )
              })
            )}

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

          {/* CUSTOMER */}
          <Section>
            <Heading as="h2" style={h2}>Información del cliente</Heading>
            <Row>
              <Column style={infoCol}>
                <Text style={infoLabel}>Nombre</Text>
                <Text style={infoVal}>{name}</Text>
                <Text style={infoLabel}>Correo</Text>
                <Text style={infoVal}>{customerEmail || '—'}</Text>
                <Text style={infoLabel}>Teléfono</Text>
                <Text style={infoVal}>{customerPhone || '—'}</Text>
              </Column>
              <Column style={infoCol}>
                <Text style={infoLabel}>País</Text>
                <Text style={infoVal}>{customerCountry || '—'}</Text>
                <Text style={infoLabel}>Dirección</Text>
                <Text style={infoVal}>{customerAddress || 'Entrega digital — no requiere dirección'}</Text>
                <Text style={infoLabel}>Método de pago</Text>
                <Text style={infoVal}>{providerLabel(provider)}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={infoLabel}>Fecha del pedido</Text>
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
              © {new Date().getFullYear()} iLingue Relax · ilinguerelax.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) => `Pedido #${d.orderNumber || 'ILR'} confirmado — iLingue Relax`,
  displayName: 'Gracias por tu compra',
  previewData: {
    orderNumber: 'ILR-ST-20260710-ABC123',
    customerName: 'María Pérez',
    customerEmail: 'maria@example.com',
    customerPhone: '+51 987 654 321',
    customerCountry: 'PE',
    customerAddress: 'Entrega digital — no requiere dirección',
    productName: '1,000 Verbos en Inglés',
    items: [
      { name: '1,000 Verbos en Inglés', kind: 'main', qty: 1, price: 15 },
      { name: '500 Preguntas en Inglés (adicional)', kind: 'upsell', qty: 1, price: 7 },
      { name: 'Bono: Guía de pronunciación UK/USA', kind: 'bonus', price: 0 },
      { name: 'Bono: Diccionario básico PDF', kind: 'bonus', price: 0 },
    ],
    amount: 22,
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
const h1 = { fontSize: '24px', color: '#111827', margin: '0 0 8px' }
const heroSub = { fontSize: '15px', color: '#4b5563', margin: 0, lineHeight: '1.5' }
const h2 = { fontSize: '14px', color: '#111827', margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const hrLight = { borderColor: '#f3f4f6', margin: '12px 0' }
const itemRow = { padding: '10px 0', borderBottom: '1px solid #f3f4f6' }
const itemName = { margin: 0, fontSize: '15px', fontWeight: 'bold' as const, color: '#111827' }
const itemMeta = { margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }
const itemPrice = { margin: 0, fontSize: '15px', color: '#111827', fontWeight: 'bold' as const }
const badgePill = (bg: string, color: string) => ({
  display: 'inline-block',
  margin: '4px 0 0',
  padding: '2px 8px',
  fontSize: '10px',
  fontWeight: 'bold' as const,
  letterSpacing: '0.5px',
  backgroundColor: bg,
  color,
  borderRadius: '4px',
})
const totalLabel = { margin: '4px 0', fontSize: '14px', color: '#4b5563' }
const totalVal = { margin: '4px 0', fontSize: '14px', color: '#111827' }
const grandLabel = { margin: '8px 0 0', fontSize: '16px', color: '#111827', fontWeight: 'bold' as const }
const grandVal = { margin: '8px 0 0', fontSize: '18px', color: '#0f766e', fontWeight: 'bold' as const }
const infoCol = { verticalAlign: 'top' as const, paddingRight: '12px', width: '50%' }
const infoLabel = { margin: '8px 0 2px', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const infoVal = { margin: 0, fontSize: '14px', color: '#111827' }
const support = { fontSize: '14px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#0f766e', textDecoration: 'underline' }
const footer = { textAlign: 'center' as const, color: '#9ca3af', fontSize: '12px', margin: '16px 0 0' }
