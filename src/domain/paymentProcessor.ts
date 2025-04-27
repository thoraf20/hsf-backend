import axios from 'axios'

import https from 'https'
import PaymentProcessor from './interfaces/IPaymentProcessor'
import { Payment } from './entities/Payment'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const axiosInstance = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  httpsAgent: new https.Agent({ keepAlive: true }),
}) // Enable keep-alive

export class PaystackProcessor implements PaymentProcessor {
  constructor() {}

  async createProcess(input: Payment): Promise<any> {
    try {
      const requestBody = {
        ...input,
        amount: Number(input.amount) * 100,
        currency: 'NGN',
      }

      const response = await axiosInstance.post(
        '/transaction/initialize',
        requestBody,
      )
      if (response.data.status) {
        return response.data.data
      }

      throw new Error('Payment initialization failed')
    } catch (error) {
      console.error('Paystack Payment Error:', error)
      throw new Error('Payment processing failed')
    }
  }

  async verifyPayment(
    reference: string,
  ): Promise<{ status: string; reference?: string; message?: string }> {
    const response = await axiosInstance.get(`transaction/verify/${reference}`)
    if (response.data.status) {
      const data: VerifyPaymentResponse = response.data.data

      return {
        reference: data.reference,
        status: data.status,
      }
    }

    throw new Error('Payment initialization failed')
  }
}

type VerifyPaymentResponse = {
  id: number
  domain: string
  status: string // Consider using the PaymentStatus enum from the previous example
  reference: string
  receipt_number: string | null
  amount: number
  message: string | null
  gateway_response: string
  paid_at: string // Assuming it's an ISO date string
  created_at: string // Assuming it's an ISO date string
  channel: string
  currency: string
  ip_address: string
  metadata: string // Based on the example, this should be a string, not an object
  fees: number
  fees_split: any | null // Or a more specific type if you know the structure of `fees_split`
  plan: any | null // Or a more specific type if you know the structure of `plan`
  split: Record<string, any> // Allow empty object
  order_id: any | null // Or a more specific type if you know the structure of `order_id`
  paidAt: string // Assuming it's an ISO date string
  createdAt: string // Assuming it's an ISO date string
  requested_amount: number
  pos_transaction_data: any | null // Or a more specific type
  source: any | null // Or a more specific type
  fees_breakdown: any | null // Or a more specific type
  connect: any | null // Or a more specific type
  transaction_date: string // Assuming it's an ISO date string
  plan_object: Record<string, any> //empty object
  subaccount: Record<string, any> // empty object
}
