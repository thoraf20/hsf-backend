import { Enquires, EnquiryMsg, Enquiry } from "@entities/Enquires";


 

export interface IEnquiresRepository {
    newMessageEnquiry (enquiry: Enquires, message: EnquiryMsg) : Promise<Enquiry>
    closeEnquiry (id: string): Promise<Enquires>
    continueEnquiry (id: string,  message: EnquiryMsg): Promise<Enquiry>
    getEnquiry (enquiry_id: string): Promise<Enquiry>
    getAllUserEnquiries (user_id: string): Promise<Enquires[]>
    getUserEnquiryOfProduct (property_id: string, user_id : string): Promise<Enquiry>
}