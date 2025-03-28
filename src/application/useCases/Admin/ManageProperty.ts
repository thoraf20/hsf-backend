import { Properties } from "../../../domain/entities/Property"
import { propertyApprovalStatus } from "../../../domain/enums/propertyEnum"
import { IPropertyRepository } from "../../../domain/interfaces/IPropertyRepository"
import { PropertyBaseUtils } from "../utils"



export class manageProperty {
      private propertyRepository: IPropertyRepository
      private readonly utilsProperty: PropertyBaseUtils
      constructor(propertyRepository: IPropertyRepository) {
        this.propertyRepository = propertyRepository
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

      public async GetPropertyToBeApprove (): Promise<Properties[]> {
          return await this.propertyRepository.getAllPropertiesTobeApproved()
      }
}

