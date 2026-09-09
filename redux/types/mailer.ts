import { IOrder } from '@/app/admin/models/Order';

export type InvoiceTrigger = 'order_placed' | 'status_update' | 'payment_added';

export interface InvoiceContext {
  trigger: InvoiceTrigger;
  order: IOrder & { _id: string };
  /** human-readable change description, e.g. "Status changed to Shipped" */
  changeNote?: string;
}
