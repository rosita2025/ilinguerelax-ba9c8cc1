import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  productName?: string
  amount?: number
  currency?: string
  provider?: string
}

const Email = ({
  customerName,
  productName,
  amount,
  currency,
  provider,
}: Props) => {
  const name = customerName?.trim() || 'Cliente'
  const product = productName || 'tu pedido'
  const amountStr = amount
    ? `${Number(amount).toFixed(2)} ${(currency || 'USD').toUpperCase()}`
    : null

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>¡Gracias por tu compra en ILINGUE RELAX!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>¡Gracias por tu compra! 🎉</Heading>
          </Section>
          <Section style={card}>
            <Text style={p}>Hola {name},</Text>
            <Text style={p}>
              Hemos recibido tu pago correctamente. ¡Bienvenido/a a la familia{' '}
              <strong>ILINGUE RELAX</strong>!
            </Text>
            <Section style={detail}>
              <Text style={detailTitle}>Detalle del pedido</Text>
              <Text style={detailLine}>
                <strong>Producto:</strong> {product}
              </Text>
              {amountStr ? (
                <Text style={detailLine}>
                  <strong>Monto:</strong> {amountStr}
                </Text>
              ) : null}
              {provider ? (
                <Text style={detailLine}>
                  <strong>Método:</strong> {provider}
                </Text>
              ) : null}
            </Section>
            <Text style={p}>
              En breve recibirás un correo con los enlaces y accesos a tu
              producto. Si necesitas ayuda, escríbenos a{' '}
              <Link href="mailto:hola@ilinguerelax.com" style={link}>
                hola@ilinguerelax.com
              </Link>{' '}
              o por WhatsApp al{' '}
              <Link href="https://wa.me/12512724704" style={link}>
                +1 251 272 4704
              </Link>
              .
            </Text>
            <Hr style={hr} />
            <Text style={signature}>
              Un abrazo,
              <br />
              <strong>El equipo de ILINGUE RELAX</strong>
            </Text>
          </Section>
          <Text style={footer}>
            © {new Date().getFullYear()} ILINGUE RELAX · ilinguerelax.com
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: '🎉 ¡Gracias por tu compra en ILINGUE RELAX!',
  displayName: 'Gracias por tu compra',
  previewData: {
    customerName: 'María',
    productName: '1,000 Verbos en Inglés',
    amount: 15,
    currency: 'USD',
    provider: 'stripe',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }
const header = {
  background: 'linear-gradient(135deg,#0ea5a4 0%,#0f766e 100%)',
  borderRadius: '16px 16px 0 0',
  padding: '32px',
  textAlign: 'center' as const,
}
const h1 = { color: '#ffffff', margin: 0, fontSize: '26px' }
const card = {
  background: '#ffffff',
  padding: '32px',
  borderRadius: '0 0 16px 16px',
  border: '1px solid #e5e7eb',
  borderTop: 'none',
}
const p = { fontSize: '16px', color: '#111827', lineHeight: '1.6', margin: '0 0 16px' }
const detail = {
  background: '#f0fdfa',
  borderLeft: '4px solid #0ea5a4',
  padding: '16px 20px',
  borderRadius: '8px',
  margin: '20px 0',
}
const detailTitle = { margin: '0 0 6px', color: '#0f766e', fontWeight: 'bold' as const }
const detailLine = { margin: '6px 0', color: '#4b5563', fontSize: '15px' }
const link = { color: '#0ea5a4', textDecoration: 'underline' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const signature = { fontSize: '15px', color: '#4b5563' }
const footer = { textAlign: 'center' as const, padding: '20px', color: '#9ca3af', fontSize: '12px' }
