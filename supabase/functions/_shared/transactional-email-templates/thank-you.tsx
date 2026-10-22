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
  /** 'it' para clientes italianos; cualquier otro valor = español (comportamiento anterior). */
  lang?: string
}

const fmtMoney = (amount?: number, currency?: string, locale = 'es') => {
  if (amount == null) return null
  const c = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: c }).format(Number(amount))
  } catch {
    return `${Number(amount).toFixed(2)} ${c}`
  }
}

const fmtDate = (iso?: string, locale = 'es') => {
  const d = iso ? new Date(iso) : new Date()
  try {
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return d.toDateString()
  }
}

const providerLabel = (p?: string, it = false) => {
  const k = (p || '').toLowerCase().replace(/[-\s]/g, '_')
  if (k === 'stripe') return it ? 'Carta (Stripe)' : 'Tarjeta (Stripe)'
  if (k === 'paypal') return 'PayPal'
  if (k === 'mercadopago') return 'Mercado Pago'
  if (k === 'yape') return 'Yape'
  if (k === 'plin') return 'Plin'
  if (k === 'yape_plin') return 'Yape / Plin'
  if (k === 'binance' || k === 'binance_pay') return 'Binance Pay'
  if (k === 'manual') return it ? 'Pagamento manuale' : 'Pago manual'
  return p || '—'
}

const badge = (kind?: string, it = false) => {
  if (kind === 'upsell') return { label: it ? 'AGGIUNTIVO' : 'ADICIONAL', bg: '#fef3c7', color: '#92400e' }
  if (kind === 'bonus') return { label: it ? 'BONUS GRATUITO' : 'BONO GRATIS', bg: '#dcfce7', color: '#166534' }
  return { label: it ? 'PRINCIPALE' : 'PRINCIPAL', bg: '#e0f2fe', color: '#075985' }
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
  lang,
}: Props) => {
  const it = lang === 'it'
  const locale = it ? 'it' : 'es'
  const money = fmtMoney(amount, currency, locale)
  const name = customerName?.trim() || (it ? 'Cliente' : 'Cliente')
  const X = it
    ? {
        preview: 'confermato — iLingue Relax',
        order: 'ORDINE',
        thanks: 'Grazie per il tuo acquisto',
        sub: 'Abbiamo ricevuto correttamente il tuo ordine. Tra pochi minuti riceverai una seconda email con i link per il download.',
        products: "Prodotti dell'ordine",
        noDetail: 'Nessun dettaglio dei prodotti.',
        qty: 'Quantità',
        free: 'GRATIS',
        subtotal: 'Subtotale',
        shipping: 'Spedizione',
        freeDigital: 'Gratis (digitale)',
        total: 'Totale',
        customer: 'Informazioni sul cliente',
        nameL: 'Nome',
        emailL: 'Email',
        phoneL: 'Telefono',
        countryL: 'Paese',
        addressL: 'Indirizzo',
        noAddress: 'Consegna digitale — non serve alcun indirizzo',
        methodL: 'Metodo di pagamento',
        dateL: "Data dell'ordine",
        doubts: 'Hai dubbi? Rispondi a questa email o scrivici a',
      }
    : {
        preview: 'confirmado — iLingue Relax',
        order: 'PEDIDO',
        thanks: '¡Gracias por tu compra',
        sub: 'Hemos recibido tu pedido correctamente. En unos minutos recibirás un segundo correo con los enlaces de descarga.',
        products: 'Productos del pedido',
        noDetail: 'Sin detalle de productos.',
        qty: 'Cantidad',
        free: 'GRATIS',
        subtotal: 'Subtotal',
        shipping: 'Envío',
        freeDigital: 'Gratis (digital)',
        total: 'Total',
        customer: 'Información del cliente',
        nameL: 'Nombre',
        emailL: 'Correo',
        phoneL: 'Teléfono',
        countryL: 'País',
        addressL: 'Dirección',
        noAddress: 'Entrega digital — no requiere dirección',
        methodL: 'Método de pago',
        dateL: 'Fecha del pedido',
        doubts: '¿Alguna duda? Responde este correo o escríbenos a',
      }

  // Build the line-items list. If caller passed `items`, use them.
  // Otherwise synthesize from productName + bonuses[].
  const lineItems: Item[] = items && items.length > 0
    ? items
    : [
        ...(productName ? [{ name: productName, kind: 'main' as const, qty: 1, price: amount }] : []),
        ...((bonuses || []).map((b) => ({ name: b, kind: 'bonus' as const, price: 0 }))),
      ]

  return (
    <Html lang={it ? 'it' : 'es'} dir="ltr">
      <Head />
      <Preview>{it ? 'Ordine' : 'Pedido'} {orderNumber || ''} {X.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brand}>iLingue Relax</Text>
            <Text style={orderTag}>{X.order} #{orderNumber || '—'}</Text>
          </Section>

          <Section style={hero}>
            <Heading style={h1}>{X.thanks}, {name}!</Heading>
            <Text style={heroSub}>
              {X.sub}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* PRODUCTS */}
          <Section>
            <Heading as="h2" style={h2}>{X.products}</Heading>
            {lineItems.length === 0 ? (
              <Text style={itemMeta}>{X.noDetail}</Text>
            ) : (
              lineItems.map((li, i) => {
                const b = badge(li.kind, it)
                const p = fmtMoney(li.price, currency, locale)
                return (
                  <Row key={i} style={itemRow}>
                    <Column>
                      <Text style={itemName}>{li.name}</Text>
                      <Text style={badgePill(b.bg, b.color)}>{b.label}</Text>
                      <Text style={itemMeta}>{X.qty}: {li.qty ?? 1}</Text>
                    </Column>
                    <Column align="right">
                      <Text style={itemPrice}>
                        {li.kind === 'bonus' ? X.free : (p || '—')}
                      </Text>
                    </Column>
                  </Row>
                )
              })
            )}

            <Hr style={hrLight} />

            <Row>
              <Column><Text style={totalLabel}>{X.subtotal}</Text></Column>
              <Column align="right"><Text style={totalVal}>{money || '—'}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={totalLabel}>{X.shipping}</Text></Column>
              <Column align="right"><Text style={totalVal}>{X.freeDigital}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={grandLabel}>{X.total}</Text></Column>
              <Column align="right"><Text style={grandVal}>{money || '—'}</Text></Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* CUSTOMER */}
          <Section>
            <Heading as="h2" style={h2}>{X.customer}</Heading>
            <Row>
              <Column style={infoCol}>
                <Text style={infoLabel}>{X.nameL}</Text>
                <Text style={infoVal}>{name}</Text>
                <Text style={infoLabel}>{X.emailL}</Text>
                <Text style={infoVal}>{customerEmail || '—'}</Text>
                <Text style={infoLabel}>{X.phoneL}</Text>
                <Text style={infoVal}>{customerPhone || '—'}</Text>
              </Column>
              <Column style={infoCol}>
                <Text style={infoLabel}>{X.countryL}</Text>
                <Text style={infoVal}>{customerCountry || '—'}</Text>
                <Text style={infoLabel}>{X.addressL}</Text>
                <Text style={infoVal}>{customerAddress || X.noAddress}</Text>
                <Text style={infoLabel}>{X.methodL}</Text>
                <Text style={infoVal}>{providerLabel(provider, it)}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={infoLabel}>{X.dateL}</Text>
                <Text style={infoVal}>{fmtDate(orderDate, locale)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={support}>
              {X.doubts}{' '}
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
  subject: (d: Props) => d.lang === 'it'
    ? `Ordine #${d.orderNumber || 'ILR'} confermato — iLingue Relax`
    : `Pedido #${d.orderNumber || 'ILR'} confirmado — iLingue Relax`,
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
