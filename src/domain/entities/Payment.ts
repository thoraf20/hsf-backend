import { PartialInstantiable } from '@shared/types/partials'

export class Payment extends PartialInstantiable<Payment> {
    id?: string;
    userId?: string;
    amount: number;
    email: string;
    currency?: string;
    status?: "pending" | "success" | "failed";
    metaData?: Record<string, any>
    createdAt?: Date;
    updatedAt?: Date;

    constructor(data: Partial<Payment>) {
      super(data)
      if (data) {
        Object.assign(this, data);
      }
    }
  }
  