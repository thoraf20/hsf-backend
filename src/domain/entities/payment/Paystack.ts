

export class Paystack {
    status: boolean;
    message: string;
    data: Record<string, any>
    constructor(data: Partial<Paystack>) {
        Object.assign(this, {
            ...data
        });
    } 
}