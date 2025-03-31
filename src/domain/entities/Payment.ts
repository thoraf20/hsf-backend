import { PartialEntity } from '@shared/types/partials'

export class Payment extends PartialEntity<Payment> {
    id?: string;
    userId: string;
    amount: number;
    currency: string;
    status?: "pending" | "success" | "failed";
    metaData?: Record<string, any>
    createdAt?: Date;
    updatedAt?: Date;
  }
  