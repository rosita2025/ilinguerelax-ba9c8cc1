import { template as thankYou } from './thank-you.tsx'
import { template as adminSale } from './admin-sale.tsx'
import { template as materialDelivery } from './material-delivery.tsx'
import { template as adminManualPending } from './admin-manual-pending.tsx'
import { template as customerManualPending } from './customer-manual-pending.tsx'
import { template as customerPendingReminder } from './customer-pending-reminder.tsx'

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
  'material-delivery': materialDelivery,
  'admin-manual-pending': adminManualPending,
  'customer-manual-pending': customerManualPending,
  'customer-pending-reminder': customerPendingReminder,
}
