import { Enquires, EnquiryMsg } from '@entities/Enquires'
import { IEnquiresRepository } from '@interfaces/IEnquiresRepository'
import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { EnquiryBaseUtils } from '@use-cases/utils'

export class EnquiryService {
  private enquiryRepository: IEnquiresRepository
  private utilsEnquiry: EnquiryBaseUtils
  private propertyRepository: IPropertyRepository

  constructor(
    enquiryRepository: IEnquiresRepository,
    propertyRepository: IPropertyRepository,
  ) {
    this.enquiryRepository = enquiryRepository
    this.propertyRepository = propertyRepository
    this.utilsEnquiry = new EnquiryBaseUtils(
      this.enquiryRepository,
      this.propertyRepository,
    )
  }

  public async makeAnEnquiry(
    property_id: string,
    user_id: string,
    message: string,
  ) {
    await this.utilsEnquiry.confirmEnquiryDoesntExist(property_id, user_id)
    const property = await this.utilsEnquiry.checkPropertyExist(property_id)
    let developer_id = property.organization_id
    let enquiry = new Enquires({
      property_id: property.id,
      developer_id: developer_id,
    })
    let enquiryMsg = new EnquiryMsg({
      owner_id: user_id,
      message: message,
    })
    const enquiryTrail = await this.enquiryRepository.newMessageEnquiry(
      enquiry,
      enquiryMsg,
    )
    return enquiryTrail
  }

  public async respondToEnquiry(
    enquiry_id: string,
    user_id: string,
    message: string,
  ) {
    let enquiryTrail = await this.utilsEnquiry.confirmEnquiryExistForUser(
      enquiry_id,
      user_id,
    )
    let enquiryMsg = new EnquiryMsg({
      owner_id: user_id,
      message: message,
    })
    enquiryTrail = await this.enquiryRepository.continueEnquiry(
      enquiryTrail.id,
      enquiryMsg,
    )
    return enquiryTrail
  }

  public async closeEnquiry(enquiry_id: string, user_id: string) {
    let enquiryTrail = await this.utilsEnquiry.confirmEnquiryExistForUser(
      enquiry_id,
      user_id,
    )
    let enquiry = await this.enquiryRepository.closeEnquiry(enquiryTrail.id)
    return { ...enquiryTrail, ...enquiry }
  }

  public async getAllEnquiry(user_id: string) {
    const enquiries = await this.enquiryRepository.getAllUserEnquiries(user_id)
    return enquiries
  }

  public async getEnquiryById(user_id: string, enquiry_id: string) {
    let enquiryTrail = await this.utilsEnquiry.confirmEnquiryExistForUser(
      enquiry_id,
      user_id,
    )
    return enquiryTrail
  }
}
