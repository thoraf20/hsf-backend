export class Payment {
    id?: string;
    userId: string;
    amount: number;
    currency: string;
    status?: "pending" | "success" | "failed";
    metaData?: Record<string, any>
    createdAt?: Date;
    updatedAt?: Date;
  
    constructor(data: Partial<Payment>) {
      Object.assign(this, {
          inspection_fee_paid: false,
          created_at: new Date(),
          updated_at: new Date(),
          ...data
      });
  }
  }
  