import { SeekPaginationResult } from "@shared/types/paginate"
import { Properties } from "@domain/entities/Property"
import { propertyApprovalStatus } from "@domain/enums/propertyEnum"
import { IPropertyRepository } from "@domain/interfaces/IPropertyRepository"
import { PropertyBaseUtils } from "../utils"
import { OfferLetter } from "@entities/PropertyPurchase"
import { IPurchaseProperty } from "@interfaces/IPropertyPurchaseRepository"
import { ApplicationCustomError } from "@middleware/errors/customError"
import { StatusCodes } from "http-status-codes"
import { EscrowInformation } from "@entities/PurchasePayment"



export class manageProperty {
      private readonly propertyRepository: IPropertyRepository
      private readonly purchaseRepository: IPurchaseProperty
      private readonly utilsProperty: PropertyBaseUtils
      constructor(propertyRepository: IPropertyRepository, purchaseRepository: IPurchaseProperty) {
        this.propertyRepository = propertyRepository
        this.purchaseRepository = purchaseRepository
        this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
      }


      public async ApproveOrDisApproveProperty(
        property_id: string,
        status: propertyApprovalStatus,
      ): Promise<{ is_live: boolean }> {
        await this.utilsProperty.findIfPropertyExist(property_id)
        const newPropertyStatus = status === propertyApprovalStatus.APPROVED
        let is_live : boolean
        if(status === propertyApprovalStatus.APPROVED) {
                is_live = true
        }else {
               is_live  = false
        }
        console.log(status)
       
        await this.propertyRepository.ApproveOrDisApproveProperties(property_id, {
          is_live,
          status,
        })
     
        console.log(
          `Property ${property_id} status updated to ${status}: is_live = ${newPropertyStatus}`,
        )
    
        return { is_live: newPropertyStatus }
      }


  
      public async GetPropertyToBeApprove (): Promise<SeekPaginationResult<Properties>> {
          return await this.propertyRepository.getAllPropertiesTobeApproved()
      }

    
      public async setEscrowAttendance(input: EscrowInformation, agent_id: string): Promise<EscrowInformation> {
         const escrow = await this.purchaseRepository.setEscrowAttendance({...input, agent_id})
         return escrow
      } 
    
      public async confirmPropertyPurchase(input: Record<string, any>): Promise<void>{
           await this.purchaseRepository.confirmPropertyPurchase(input.property_id, input.user_id)
      }
    
      public async approvePrequalifyRequest(input: Record<string, any>): Promise<void>  {
         await this.purchaseRepository.approvePrequalifyRequest(input, input.user_id)
      }

        public async changeOfferLetterStatus(
          input: Partial<OfferLetter>
        ): Promise<void> {
          const offerLetter = await this.purchaseRepository.getOfferLetterById(
            input.offer_letter_id,
          )
          if (!offerLetter) {
            throw new ApplicationCustomError(
              StatusCodes.NOT_FOUND,
              'Offer letter not found',
            )
          }
      
          await this.purchaseRepository.updateOfferLetterStatus(
            input.offer_letter_id,
            { ...input },
          )
        }
}

