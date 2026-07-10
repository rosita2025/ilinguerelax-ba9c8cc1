import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  customerEmail?: string
  productName?: string
  amount?: number
  currency?: string
  provider?: string
}

const Email = ({
  customerName,
  customerEmail,
  productName,
  amount,
  currency,
  provider,
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Nueva venta en ILINGUE RELAX</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={h1}>🛒 Nueva venta</Heading>
          <Text style={p}><strong>Proveedor:</strong> {provider || '—'}</Text>
          <Text style={p}><strong>Cliente:</strong> {customerName || '—'}</Text>
          <Text style={p}><strong>Email:</strong> {customerEmail || '—'}</Text>
          <Text style={p}><strong>Producto:</strong> {productName || '—'}</Text>
          {amount ? (
            <Text style={p}>
              <strong>Monto:</strong> {Number(amount).toFixed(2)}{' '}
              {(currency || 'USD').toUpperCase()}
            </Text>
          ) : null}
          <Text style={p}><strong>Fecha:</strong> {new Date().toLocaleString()}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Props) =>
    `🛒 Nueva venta (${data.provider || 'web'}) — ${data.productName || 'pedido'}`,
  displayName: 'Aviso de venta (admin)',
  to: 'hola@ilinguerelax.com',
  previewData: {
    customerName: 'María',
    customerEmail: 'maria@example.com',
    productName: '1,000 Verbos en Inglés',
    amount: 15,
    currency: 'USD',
    provider: 'stripe',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '600px', margin: '0 auto', padding: '32px 20px' }
const card = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }
const h1 = { color: '#0f766e', margin: '0 0 16px', fontSize: '22px' }
const p = { fontSize: '15px', color: '#111827', margin: '6px 0' }
