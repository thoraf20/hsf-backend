import { DIP } from "@entities/Mortage";
import { Payment } from "@entities/Payment";



export interface IMortageRespository {
    acceptDip(input: DIP) : Promise<DIP>
    payForMortageProcess(payment: Payment, user_id: string, transaction_id: string): Promise<Payment>
}