import axios from "axios";

import https from "https";
import PaymentProcessor from "./interfaces/IPaymentProcessor";
import { Payment } from "./entities/Payment";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const axiosInstance = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
  httpsAgent: new https.Agent({ keepAlive: true }), // Enable keep-alive
});
 
export class PaystackProcessor implements PaymentProcessor {
  constructor(public input: Payment) {}

  async createProcess(input: Payment): Promise<any> { 
    try {
      const requestBody = {
        ...input,
        amount: Number(input.amount) * 100, // Convert amount to kobo
        currency: "NGN",
      
      };

      const response = await axiosInstance.post("/transaction/initialize", requestBody);
      if (response.data.status) {
        return response.data.data
      }  

    console.log(requestBody)

      throw new Error("Payment initialization failed");
    } catch (error) {
      console.error("Paystack Payment Error:", error);
      throw new Error("Payment processing failed");
    }
  }
}




