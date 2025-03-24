import axios from "axios";

import https from "https";
import PaymentProcessor from "./interfaces/IPaymentProcessor";
import { Payment } from "./entities/Payment";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

// Create an Axios instance with Keep-Alive
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

  async createProcess(input: Payment): Promise<Payment> {
    try {
      const requestBody = {
        ...input,
        amount: input.amount * 100, // Convert amount to kobo
        currency: "NGN",
      
      };

      const response = await axiosInstance.post("/transaction/initialize", requestBody);

      if (response.data.status) {
        return new Payment({ ...input});
      }

      throw new Error("Payment initialization failed");
    } catch (error) {
      console.error("Paystack Payment Error:", error);
      throw new Error("Payment processing failed");
    }
  }
}
