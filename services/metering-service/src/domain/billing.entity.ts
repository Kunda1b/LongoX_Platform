export interface PricingTier {
  eventType: string;
  unitPrice: number;
  includedQuantity: number;
  overageUnitPrice: number;
}

export interface InvoiceLineItem {
  eventType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceProps {
  id: number;
  tenantId: number;
  periodStart: Date;
  periodEnd: Date;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Invoice {
  constructor(private props: InvoiceProps) {}

  get id(): number {
    return this.props.id;
  }
  get tenantId(): number {
    return this.props.tenantId;
  }
  get total(): number {
    return this.props.total;
  }
  get status(): string {
    return this.props.status;
  }

  markPaid(): void {
    this.props.status = "paid";
    this.props.paidAt = new Date();
  }

  markOverdue(): void {
    this.props.status = "overdue";
  }

  toJSON() {
    return { ...this.props };
  }
}
