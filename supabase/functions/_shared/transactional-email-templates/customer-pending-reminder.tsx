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
 * Recordatorio de pago pendiente (días 1, 3, 7, 10 y 15).
 *
 * Se envía SOLO mientras el pedido siga sin pagar. Cuando el pago se acredita
 * (transferencia, efectivo, billetera digital o aceptación manual del admin)
 * la secuencia se detiene automáticamente.
 */
interface Props {
  orderNumber?: string
  customerName?: string
  customerEmail?: string
  productName?: string
  amount?: number
  currency?: string
  method?: string
  day?: number
  isLast?: boolean
}

const trackingUrl = (orderNumber?: string, customerEmail?: string) => {
  const base = 'https://www.ilinguerelax.com/mi-pedido'
  const params: string[] = []
  if (orderNumber) params.push(`order=${encodeURIComponent(orderNumber)}`)
  if (customerEmail) params.push(`email=${encodeURIComponent(customerEmail)}`)
  return params.length ? `${base}?${params.join('&')}` : base
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

const dayMessage = (day?: number, isLast?: boolean) => {
  if (isLast) {
    return 'Este es nuestro último recordatorio. Si ya realizaste el pago, envíanos tu comprobante y lo activamos de inmediato; si prefieres cancelar, no tienes que hacer nada.'
  }
  switch (day) {
    case 1:
      return 'Ayer reservamos tu pedido y todavía no vemos el pago acreditado. Si ya pagaste con transferencia o en efectivo, puede tardar unas horas: envíanos tu comprobante y lo confirmamos al instante.'
    case 3:
      return 'Han pasado 3 días y tu pedido sigue pendiente de pago. Tu material está reservado y listo para enviarse apenas confirmemos el pago.'
    case 7:
      return 'Ya pasó una semana desde tu pedido. Aún puedes completar el pago con transferencia, efectivo o billetera digital y recibir tu material el mismo día.'
    case 10:
      return 'Tu pedido lleva 10 días esperando el pago. Si tuviste algún problema con la transferencia o el pago en efectivo, escríbenos y te ayudamos paso a paso.'
    default:
      return 'Tu pedido sigue pendiente de pago. Complétalo cuando quieras y recibirás tu material digital apenas confirmemos el pago.'
  }
}

const Email = ({
  orderNumber,
  customerName,
  customerEmail,
  productName,
  amount,
  currency,
  method,
  day,
  isLast,
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>
      Tu pedido {orderNumber || ''} sigue pendiente de pago — te ayudamos a completarlo
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>ILINGUE RELAX</Text>
          <Heading style={h1}>⏳ Tu pago sigue pendiente</Heading>
          <Text style={orderTag}>PEDIDO #{orderNumber || '—'}</Text>
        </Section>

        <Section style={cardHi}>
          <Text style={hiTitle}>¡Hola {customerName || ''}! 👋</Text>
          <Text style={hiLine}>{dayMessage(day, isLast)}</Text>
          <Text style={hiLine}>
            Envía tu comprobante a <strong>hola@ilinguerelax.com</strong> indicando tu pedido{' '}
            <strong>#{orderNumber || '—'}</strong>. Nuestra supervisora <strong>Rosa</strong> lo verifica
            y te enviamos el enlace de tu material.
          </Text>
        </Section>

        <Section style={card}>
          <Row>
            <Column><Text style={label}>Producto</Text></Column>
            <Column align="right"><Text style={value}>{productName || 'Tu pedido ILINGUE RELAX'}</Text></Column>
          </Row>
          <Hr style={hr} />
          <Row>
            <Column><Text style={label}>Total</Text></Column>
            <Column align="right"><Text style={amountVal}>{fmtMoney(amount, currency)}</Text></Column>
          </Row>
          <Row>
            <Column><Text style={label}>Método</Text></Column>
            <Column align="right"><Text style={value}>{method || 'Transferencia / efectivo / billetera digital'}</Text></Column>
          </Row>
        </Section>

        <Section style={trackBox}>
          <Text style={trackTitle}>📦 Revisa el estado de tu pedido</Text>
          <Text style={{ textAlign: 'center' as const, margin: '12px 0' }}>
            <a href={trackingUrl(orderNumber, customerEmail)} style={trackBtn}>Ver estado de mi pedido</a>
          </Text>
          <Text style={trackHint}>
            www.ilinguerelax.com/mi-pedido — ingresa tu pedido <strong>#{orderNumber || '—'}</strong> y tu correo.
          </Text>
        </Section>

        <Text style={footer}>Si ya pagaste, ignora este correo: lo confirmaremos en cuanto se acredite 💛</Text>
        <Text style={footer}>hola@ilinguerelax.com · www.ilinguerelax.com/mi-pedido</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) =>
    d.isLast
      ? `Último aviso: tu pedido #${d.orderNumber || 'ILR'} sigue pendiente de pago`
      : `⏳ Tu pedido #${d.orderNumber || 'ILR'} sigue pendiente de pago`,
  displayName: 'Recordatorio de pago pendiente (cliente)',
  previewData: {
    orderNumber: 'ILR-DL-1234',
    customerName: 'María',
    customerEmail: 'maria@ejemplo.com',
    productName: '1,000 Verbos en Inglés',
    amount: 19,
    currency: 'USD',
    method: 'Transferencia bancaria',
    day: 3,
    isLast: false,
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
const footer = { textAlign: 'center' as const, color: '#9ca3af', fontSize: '12px', margin: '8px 0 0' }
const trackBox = { backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '10px', padding: '16px', margin: '18px 0' }
const trackTitle = { margin: '0 0 6px', fontSize: '15px', fontWeight: 'bold' as const, color: '#0f766e' }
const trackBtn = { backgroundColor: '#0d9488', color: '#ffffff', textDecoration: 'none', padding: '11px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' as const, display: 'inline-block' }
const trackHint = { margin: '6px 0 0', fontSize: '12px', color: '#0f766e', textAlign: 'center' as const }
