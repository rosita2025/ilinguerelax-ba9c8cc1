import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  productName?: string
  /** Texto corto de presentación del producto */
  productPitch?: string
  /** Imagen de portada del producto */
  imageUrl?: string
  /** URL pública del producto (/products/<sku>) */
  productUrl?: string
  /** Cupón opcional de lanzamiento */
  coupon?: string
  /** Audiencia: cambia solo la frase de contexto, nunca la oferta */
  audience?: string
}

const AUDIENCE_INTRO: Record<string, string> = {
  buyers: 'Como ya eres cliente de ILINGUE RELAX, te lo contamos antes que a nadie.',
  hotmart: 'Como ya compraste uno de nuestros materiales, queríamos que lo supieras de primero.',
  reviewers: 'Gracias por dejarnos tu reseña — por eso te avisamos antes que al resto.',
  waitlist: 'Pediste que te avisáramos cuando saliera algo nuevo: aquí está.',
  abandoned: 'Dejaste un material pendiente en tu carrito, así que te avisamos de esta novedad.',
  newsletter: 'Estás suscrito a nuestras novedades, así que te lo contamos de primera mano.',
}

const Email = ({ customerName, productName, productPitch, imageUrl, productUrl, coupon, audience }: Props) => {
  const name = customerName?.trim() || 'Hola'
  const product = productName?.trim() || 'Nuevo material ILINGUE RELAX'
  const url = productUrl || 'https://ilinguerelax.com'
  const intro = AUDIENCE_INTRO[audience ?? ''] || AUDIENCE_INTRO.newsletter

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>{`Nuevo lanzamiento: ${product}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brand}>ILINGUE RELAX</Text>
            <Text style={orderTag}>NUEVO LANZAMIENTO</Text>
          </Section>

          <Heading style={h1}>{`¡${name}! Ya está disponible: ${product} 🚀`}</Heading>

          <Text style={introStyle}>{intro}</Text>

          {productPitch && productPitch.trim().length > 0 && (
            <Text style={introStyle}>{productPitch}</Text>
          )}

          {imageUrl && imageUrl.trim().length > 0 && (
            <Section style={{ textAlign: 'center' as const, margin: '4px 0 18px' }}>
              <Link href={url}>
                <Img src={imageUrl} alt={product} width="420" style={cover} />
              </Link>
            </Section>
          )}

          {coupon && coupon.trim().length > 0 && (
            <Section style={bonusBox}>
              <Text style={bonusText}>
                🎁 <strong>Cupón de lanzamiento:</strong> usa <strong>{coupon}</strong> en el checkout.
              </Text>
            </Section>
          )}

          <Section style={{ textAlign: 'center' as const, margin: '24px 0 8px' }}>
            <Button href={url} style={btn}>Ver el material</Button>
          </Section>
          <Text style={small}>Entrega digital inmediata por correo, con tu enlace privado de descarga.</Text>

          <Hr style={hr} />

          <Text style={support}>
            ¿Dudas antes de decidir? Escríbenos a{' '}
            <Link href="mailto:hola@ilinguerelax.com" style={linkA}>hola@ilinguerelax.com</Link>{' '}
            · WhatsApp{' '}
            <Link href="https://wa.me/12512724704" style={linkA}>+1 251 272 4704</Link>.
          </Text>
          <Text style={footer}>© {new Date().getFullYear()} ILINGUE RELAX · ilinguerelax.com</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) => `🚀 Nuevo: ${d.productName || 'material ILINGUE RELAX'} ya está disponible`,
  displayName: 'Lanzamiento de producto nuevo',
  previewData: {
    customerName: 'María',
    productName: '500 Frases de Viaje en Inglés',
    productPitch: 'Un material práctico para hablar con confianza desde el primer día.',
    imageUrl: 'https://ilinguerelax.com/og-image.jpg',
    productUrl: 'https://ilinguerelax.com/products/500-frases-viaje',
    coupon: 'NEW10',
    audience: 'newsletter',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, color: '#111827' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }
const brandBar = { borderBottom: '2px solid #0f766e', paddingBottom: '12px', marginBottom: '24px' }
const brand = { margin: 0, fontSize: '20px', fontWeight: 'bold' as const, color: '#0f766e', letterSpacing: '1px' }
const orderTag = { margin: '4px 0 0', fontSize: '12px', color: '#6b7280', letterSpacing: '1px' }
const h1 = { fontSize: '23px', color: '#111827', margin: '0 0 12px' }
const introStyle = { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const cover = { width: '100%', maxWidth: '420px', height: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb' }
const itemCard = { padding: '16px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '12px' }
const itemName = { margin: '0 0 8px', fontSize: '15px', fontWeight: 'bold' as const, color: '#111827' }
const bullet = { margin: '0 0 6px', fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }
const bonusBox = { padding: '12px 16px', backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '10px', margin: '4px 0 0' }
const bonusText = { margin: 0, fontSize: '14px', color: '#115e59', lineHeight: '1.6' }
const btn = { backgroundColor: '#0f766e', color: '#ffffff', padding: '13px 22px', borderRadius: '8px', textDecoration: 'none', fontSize: '15px', fontWeight: 'bold' as const, display: 'inline-block' }
const small = { fontSize: '13px', color: '#6b7280', lineHeight: '1.6', textAlign: 'center' as const, margin: 0 }
const linkA = { color: '#0f766e', textDecoration: 'underline' }
const support = { fontSize: '14px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { textAlign: 'center' as const, color: '#9ca3af', fontSize: '12px', margin: '16px 0 0' }
