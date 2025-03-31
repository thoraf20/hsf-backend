import { ApiResponse, createResponse } from "@presentation/response/responseType";
import { EnquiryService } from "@use-cases/Properties/enquiries";
import { StatusCodes } from "http-status-codes";




export class EnquiryController {
      constructor(private readonly enquiryService: EnquiryService) {}

      public async closeEnquiry(user_id: string, enquiry_id: string): Promise<ApiResponse<any>>{
        const enquiry = this.enquiryService.closeEnquiry(enquiry_id, user_id)
        return createResponse(
            StatusCodes.ACCEPTED,
            'enquiry closed successfully',
            enquiry,
        )
      }

      public async startEnquiryTrail(user_id: string, payload: EnquiryRequest): Promise<ApiResponse<any>>{
        const enquiry = this.enquiryService.makeAnEnquiry(payload.product_id, user_id, payload.message)
        return createResponse(
            StatusCodes.CREATED,
            'enquiry created successfully',
            enquiry,
        )
      }

      public async continueEnquiryTrail(user_id: string, payload: EnquiryRequest): Promise<ApiResponse<any>>{
        const enquiry = this.enquiryService.respondToEnquiry(payload.enquiry_id, user_id, payload.message)
        return createResponse(
            StatusCodes.CREATED,
            'enquiry created successfully',
            enquiry,
        )
      }

      public async getEnquiries(user_id: string){
        const enquiries = await this.enquiryService.getAllEnquiry(user_id)

        return createResponse(
            StatusCodes.OK,
            'success',
            enquiries,
        )
      }


      public async getEnquiryInfo(user_id: string, enquiry_id: string){
        const enquiryTrail = await this.enquiryService.getEnquiryById(user_id, enquiry_id)

        return createResponse(
            StatusCodes.OK,
            'success',
            enquiryTrail,
        )
      }


}

export type EnquiryRequest = {
    message?: string;
    product_id?: string;
    enquiry_id?: string;
}