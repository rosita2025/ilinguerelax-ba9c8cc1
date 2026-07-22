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
  clabeNumber?: string
  clabeHolder?: string
  clabeBank?: string
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
  clabeNumber,
  clabeHolder,
  clabeBank,
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
            Recibimos tu pedido con pago por <strong>{method || 'Yape / Plin / Binance Pay / SPEI (CLABE)'}</strong>.
            Para completar la verificación, por favor <strong>envíanos tu comprobante de pago</strong> (captura o PDF) al correo{' '}
            <strong>hola@ilinguerelax.com</strong> indicando tu número de pedido <strong>#{orderNumber || '—'}</strong>.
          </Text>
          <Text style={hiLine}>
            Nuestra supervisora <strong>Rosa</strong> lo revisará y confirmará en un plazo{' '}
            <strong>máximo de 24 horas</strong>. Una vez validado, te enviaremos el enlace de descarga de tu material digital.
          </Text>
          <Text style={hiLine}>
            Métodos aceptados: <strong>Yape</strong>, <strong>Plin</strong>, <strong>Binance Pay</strong> y <strong>SPEI / CLABE (México)</strong>.
          </Text>
          <Text style={hiLine}>
            Guarda este correo — es tu comprobante en caso de que se cierre la página o tu batería se apague. No necesitas hacer nada más aparte de enviarnos tu captura.
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
            <Column align="right">
              <Text style={amountVal}>{fmtMoney(amount, currency)}</Text>
              {amountUsd != null && (currency || '').toUpperCase() !== 'USD' && (
                <Text style={usdSub}>≈ USD ${Number(amountUsd).toFixed(2)}</Text>
              )}
            </Column>
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

        {(() => {
          const m = (method || '').toLowerCase()
          const isBinance = m.includes('binance')
          const isClabe = m.includes('spei') || m.includes('clabe') || m.includes('mexic')
          const isYape = m.includes('yape') || m.includes('plin')
          // Only render one block, matching the method chosen by the customer.
          if (isBinance && (binancePayId || binanceAddress)) {
            return (
              <Section style={binanceBox}>
                <Text style={binanceTitle}>🔐 Datos de Binance Pay (por si pierdes la captura)</Text>
                {binancePayId && (<Text style={binanceLine}><strong>Pay ID:</strong> {binancePayId}</Text>)}
                {binanceAddress && (<Text style={binanceLine}><strong>Dirección:</strong> {binanceAddress}</Text>)}
                {binanceNetwork && (<Text style={binanceLine}><strong>Red:</strong> {binanceNetwork}</Text>)}
                <Text style={binanceHint}>Puedes usar tu Pay ID o hash de la transacción como referencia al escribirnos.</Text>
              </Section>
            )
          }
          if (isClabe && (clabeNumber || clabeHolder)) {
            return (
              <Section style={binanceBox}>
                <Text style={binanceTitle}>🏦 Datos SPEI / CLABE (México)</Text>
                {clabeNumber && (<Text style={binanceLine}><strong>CLABE:</strong> {clabeNumber}</Text>)}
                {clabeHolder && (<Text style={binanceLine}><strong>Titular:</strong> {clabeHolder}</Text>)}
                {clabeBank && (<Text style={binanceLine}><strong>Banco:</strong> {clabeBank}</Text>)}
                <Text style={binanceHint}>Si aún no has transferido, usa estos datos desde tu app bancaria (SPEI) por el monto exacto en MXN. Guarda el comprobante como referencia.</Text>
              </Section>
            )
          }
          if (isYape) {
            return (
              <Section style={binanceBox}>
                <Text style={binanceTitle}>📱 Datos Yape / Plin (Perú)</Text>
                <Text style={binanceLine}><strong>Titular:</strong> Carmen Rosa Aliaga Domínguez</Text>
                <Text style={binanceLine}><strong>Número:</strong> +51 972 119 741</Text>
                <Text style={binanceHint}>Envía tu captura de Yape o Plin a hola@ilinguerelax.com con tu número de pedido.</Text>
              </Section>
            )
          }
          return null
        })()}





        <Section style={nextBox}>
          <Text style={nextTitle}>¿Qué sigue?</Text>
          <Text style={nextLine}>1️⃣ Envíanos tu comprobante de pago a <strong>hola@ilinguerelax.com</strong> con tu pedido <strong>#{orderNumber || '—'}</strong>.</Text>
          <Text style={nextLine}>2️⃣ Rosa verifica tu pago (Yape, Plin, Binance o SPEI) — máximo 24 h.</Text>
          <Text style={nextLine}>3️⃣ Recibirás un correo con el enlace de descarga de tu material digital.</Text>
          <Text style={nextLine}>4️⃣ Si necesitas ayuda urgente, escríbenos a hola@ilinguerelax.com.</Text>
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
const usdSub = { margin: '2px 0 0', fontSize: '12px', color: '#6b7280', fontWeight: 'normal' as const }
const binanceBox = { backgroundColor: '#fefce8', border: '1px solid #eab308', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }
const binanceTitle = { margin: '0 0 8px', fontSize: '14px', color: '#854d0e', fontWeight: 'bold' as const }
const binanceLine = { margin: '4px 0', fontSize: '13px', color: '#713f12', lineHeight: '1.5', wordBreak: 'break-all' as const }
const binanceHint = { margin: '8px 0 0', fontSize: '12px', color: '#a16207', fontStyle: 'italic' as const }
