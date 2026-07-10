import { template as thankYou } from './thank-you.tsx'
import { template as adminSale } from './admin-sale.tsx'

export interface TemplateEntry {
  component: (props: any) => any
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'thank-you': thankYou,
  'admin-sale': adminSale,
}
