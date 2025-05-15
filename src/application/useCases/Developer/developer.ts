import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { PropertyBaseUtils } from '../utils'
import { PropertyCount } from '@shared/types/repoTypes'
import { IInspectionRepository } from '@interfaces/IInspectionRepository'
import { IEnquiresRepository } from '@interfaces/IEnquiresRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ITransaction } from '@interfaces/ITransactionRepository'
import { SeekPaginationOption } from '@shared/types/paginate'
import { PropertyFilters } from '@validators/propertyValidator'

export class ManageDeveloper {
  private propertyRepository: IPropertyRepository
  private readonly utilsProperty: PropertyBaseUtils
  private inspectionRepository: IInspectionRepository
  private enquiryRepository: IEnquiresRepository
  private userRepository: IUserRepository
  private transactionRepository: ITransaction

  constructor(
    propertyRepo: IPropertyRepository,
    inspectionrepo: IInspectionRepository,
    enquiryRepo: IEnquiresRepository,
    userRepository: IUserRepository,
    transactionRepo: ITransaction,
  ) {
    this.propertyRepository = propertyRepo
    this.enquiryRepository = enquiryRepo
    this.userRepository = userRepository
    this.inspectionRepository = inspectionrepo
    this.transactionRepository = transactionRepo
    this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
  }

  public async PropertyStats(developer_id: string): Promise<PropertyCount> {
    const propertyData =
      await this.propertyRepository.getAllUserPropertyCount(developer_id)
    return propertyData
  }

  public async markAsSold(developer_id: string, property_id: string) {
    await this.utilsProperty.findIfPropertyBelongsToUser(
      property_id,
      developer_id,
    )
    await this.propertyRepository.updateProperty(developer_id, {
      is_sold: true,
    })
  }

  public async getAllLeads(developer_id: string, filters: PropertyFilters) {
    const enquiries =
      await this.enquiryRepository.getAllUserEnquiries(developer_id)
    const property_ids = await this.propertyRepository
      .findPropertiesByDeveloperOrg(developer_id, filters)
      .then((properties) => properties.result.map((p) => p.id))
    const inspection =
      await this.inspectionRepository.getSchedulesInspectionForProperty(
        property_ids,
      )

    return { enquiries, inspection }
  }

  public async getLeadInfo(
    developer_id: string,
    lead_id: string,
    lead_type: 'inspection' | 'enquiry',
  ) {
    let customerInfo = {}
    let leadInfo: any

    let user_id: string
    let property_id: string

    switch (lead_type) {
      case 'inspection':
        const inspection =
          await this.inspectionRepository.getScheduleInspectionById(lead_id)
        user_id = inspection.user_id
        property_id = inspection.property_id
        leadInfo = inspection
        break
      case 'enquiry':
        const enquiry = await this.enquiryRepository.getEnquiry(lead_id)
        // user_id = enquiry.customer_id
        property_id = enquiry.property_id
        leadInfo = enquiry
        break
    }

    const user = await this.userRepository.findById(user_id)
    await this.utilsProperty.findIfPropertyBelongsToUser(
      property_id,
      developer_id,
    )
    const property =
      await this.propertyRepository.findPropertyByUser(property_id)

    customerInfo = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      image: user.image,
    }

    return { customerInfo, property, lead: leadInfo }
  }

  public async getAllClient(
    developer_id: string,
    paginate?: SeekPaginationOption,
  ) {
    const property_ids = await this.propertyRepository
      .findPropertiesByDeveloperOrg(developer_id)
      .then((properties) => properties.result.map((p) => p.id))
    const users =
      this.transactionRepository.fetchUserFromTransactionByPaymentIds(
        property_ids,
        paginate,
      )
    return users
  }

  public async getAllPayments(
    developer_id: string,
    paginate?: SeekPaginationOption,
  ) {
    const property_ids = await this.propertyRepository
      .findPropertiesByDeveloperOrg(developer_id)
      .then((properties) => properties.result.map((p) => p.id))

    const transactions =
      await this.transactionRepository.getAlltransactionbyIds(
        property_ids,
        paginate,
      )

    return transactions
  }

  public async getPaymentsInfo(developer_id: string, payment_id: string) {
    const transaction =
      await this.transactionRepository.getTransactionById(payment_id)
    await this.utilsProperty.findIfPropertyBelongsToUser(
      transaction.property_id,
      developer_id,
    )
    return transaction
  }
}
