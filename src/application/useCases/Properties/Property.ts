import { Properties, shareProperty } from '@domain/entities/Property'
import { IPropertyRepository } from '@domain/interfaces/IPropertyRepository'
import { PropertyBaseUtils } from '../utils'
import { SeekPaginationResult } from '@shared/types/paginate'
import emailTemplates from '@infrastructure/email/template/constant'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { Application } from '@entities/Application'
import {
  CreatePropertyInput,
  PropertyFilters,
} from '@validators/propertyValidator'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { ILenderRepository } from '@interfaces/ILenderRepository'
import { getLenderClientView } from '@entities/Lender'
import { IUserRepository } from '@interfaces/IUserRepository'
import { getUserClientView, UserClientView } from '@entities/User'
import {
  DeveloperClientView,
  getDeveloperClientView,
} from '@entities/Developer'
import { IDeveloperRepository } from '@interfaces/IDeveloperRespository'
import { IDocumentRepository } from '@interfaces/IDocumentRepository'
import { DocumentGroupKind } from '@domain/enums/documentEnum'
import { ApplicationPurchaseType } from '@domain/enums/propertyEnum'
export class PropertyService {
  private propertyRepository: IPropertyRepository
  private readonly utilsProperty: PropertyBaseUtils
  private readonly applicationRepository: IApplicationRespository
  private readonly organizationRepository: IOrganizationRepository
  private readonly lenderRepository: ILenderRepository
  private readonly userRepository: IUserRepository
  private readonly developerRepository: IDeveloperRepository
  private readonly documentRepository: IDocumentRepository
  constructor(
    propertyRepository: IPropertyRepository,
    applicationRepository: IApplicationRespository,
    organizationRepository: IOrganizationRepository,
    lenderRepository: ILenderRepository,
    userRepository: IUserRepository,
    developerRepository: IDeveloperRepository,
    documentRepository: IDocumentRepository,
  ) {
    this.propertyRepository = propertyRepository
    this.applicationRepository = applicationRepository
    this.organizationRepository = organizationRepository
    this.lenderRepository = lenderRepository
    this.developerRepository = developerRepository
    this.userRepository = userRepository
    this.documentRepository = documentRepository
    this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
  }

  async createProperty(
    input: CreatePropertyInput,
    organization_id: string,
  ): Promise<Properties> {
    const propertyReportDocGroup =
      await this.documentRepository.findDocumentGroupByTag(
        DocumentGroupKind.PropertyReport,
      )

    if (!propertyReportDocGroup) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Property Reports document group not found. Please check server configuration.',
      )
    }

    const documentGroupTypes =
      await this.documentRepository.findGroupDocumentTypesByGroupId(
        propertyReportDocGroup.id,
      )

    const missingDocType = documentGroupTypes
      .filter((documentGroupType) => documentGroupType.is_user_uploadable)
      .find(
        (documentType) =>
          !input.documents.find(
            (providedDoc) => providedDoc.id === documentType.id,
          ) || documentType.is_required_for_group,
      )

    if (missingDocType) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `Missing document type ${missingDocType.display_label} not uploaded.`,
      )
    }

    input.financial_types = Array.from(
      new Set([...input.financial_types, ApplicationPurchaseType.OUTRIGHT]),
    )

    input.postal_code = ''
    input.payment_duration = ''
    const address = await this.propertyRepository.createProperties(
      new Properties({
        ...input,
        documents: JSON.stringify(input.documents),
        organization_id,
      }),
    )
    return { ...address }
  }

  public async getAllProperties(
    filter?: PropertyFilters,
    userRole?: string,
    userId?: string,
  ): Promise<SeekPaginationResult<Properties>> {
    const fetchProperties = await this.propertyRepository.getAllProperties(
      filter,
      userRole,
      userId,
    )
    return fetchProperties
  }

  public async getPropertyById(id: string, user_id: string, userRole: string) {
    const fetchProperty = await this.utilsProperty.findIfPropertyExist(
      id,
      user_id,
    )

    if (!fetchProperty) {
      return null
    }

    const organization = await this.organizationRepository.getOrganizationById(
      fetchProperty.organization_id,
    )

    let developer: DeveloperClientView = getDeveloperClientView(
      await this.developerRepository.getDeveloperByOrgId(organization.id),
    )

    return { ...fetchProperty, developer, organization }
  }

  public async getPropertyByDeveloperOrg(
    user_id: string,
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    const fetchProperty =
      await this.propertyRepository.findPropertiesByDeveloperOrg(
        user_id,
        filters,
      )
    return fetchProperty
  }

  public async getPropertyByHSFAdmin(
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    const fetchProperty =
      await this.propertyRepository.findPropertiesByHSFAdmin(filters)
    return fetchProperty
  }

  public async updateProperty(
    id: string,
    user_id: string,
    input: Partial<Properties>,
  ): Promise<Properties> {
    await this.utilsProperty.findIfPropertyBelongsToUser(id, user_id)
    const existingProperty = await this.utilsProperty.getIfPropertyExist(id)

    if (input.property_name) {
      await this.utilsProperty.findIfPropertyExistByName(input.property_name)
    }

    const updateData = Object.fromEntries(
      Object.entries({
        ...input,
        financial_types: input.financial_types
          ? JSON.stringify(input.financial_types)
          : undefined,
        documents: input.documents
          ? JSON.stringify(input.documents)
          : undefined,
      }).filter(([_, v]) => v !== undefined), // Remove undefined values
    )

    if (Object.keys(updateData).length > 0) {
      await this.propertyRepository.updateProperty(id, updateData)
    }

    return { ...existingProperty, ...updateData }
  }

  public async deleteProperty(id: string, user_id: string): Promise<boolean> {
    await this.utilsProperty.findIfPropertyBelongsToUser(id, user_id)
    await this.utilsProperty.getIfPropertyExist(id)
    return this.propertyRepository.deleteProperty(id)
  }

  public async softDeleteProperty(
    id: string,
    user_id: string,
  ): Promise<boolean> {
    await this.utilsProperty.findIfPropertyBelongsToUser(id, user_id)
    await this.utilsProperty.getIfPropertyExist(id)
    return await this.propertyRepository.softDeleteProperty(id)
  }

  public async addWatchlistProperty(
    property_id: string,
    user_id: string,
  ): Promise<Record<string, any>> {
    await Promise.all([
      this.utilsProperty.getIfPropertyExist(property_id),
      this.utilsProperty.findIfWatchListIsAdded(property_id, user_id),
    ])
    return await this.propertyRepository.addWatchlistProperty(
      property_id,
      user_id,
    )
  }

  public async getWatchlistProperty(
    user_id: string,
    filters: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    return await this.propertyRepository.getWatchlistProperty(user_id, filters)
  }

  public async removePropertyWatchList(
    property_id: string,
    user_id: string,
  ): Promise<boolean> {
    await this.utilsProperty.getIfPropertyExist(property_id)
    return await this.propertyRepository.removeWatchList(property_id, user_id)
  }

  public async propertyApplication(
    filters: PropertyFilters,
  ): Promise<SeekPaginationResult<any>> {
    return await this.applicationRepository.getAllApplication(filters)
  }

  public async shareProperty(
    input: shareProperty,
    user_id: string,
  ): Promise<void> {
    const property = await this.utilsProperty.getIfPropertyExist(
      input.property_id,
    )

    const shared = await this.propertyRepository.findSharedProperty(
      input.property_id,
      user_id,
    )

    if (shared) {
      this.sharedEmailProperty(
        input.recipient_email,
        input.sender_email,
        input.message,
        {
          property_images: property.property_images,
          property_name: property.property_name,
          street_address: property.street_address,
          city: property.city,
          state: property.state,
          property_price: property.property_price,
          property_type: property.property_type,
          postal_code: property.postal_code,
          property_size: property.property_size,
          numbers_of_bedroom: property.numbers_of_bedroom,
          numbers_of_bathroom: property.numbers_of_bathroom,
        },
      )
      return
    }

    await this.propertyRepository.shareProperty({
      message: input.message,
      property_id: input.property_id,
      sender_email: input.sender_email,
      recipient_email: input.recipient_email,
      user_id,
    })

    this.sharedEmailProperty(
      input.recipient_email,
      input.sender_email,
      input.message,
      {
        property_images: property.property_images,
        property_name: property.property_name,
        street_address: property.street_address,
        city: property.city,
        state: property.state,
        property_price: property.property_price,
        property_type: property.property_type,
        postal_code: property.postal_code,
        property_size: property.property_size,
        numbers_of_bedroom: property.numbers_of_bedroom,
        numbers_of_bathroom: property.numbers_of_bathroom,
      },
    )
  }

  public sharedEmailProperty(
    recipient_email: string,
    sender_email: string,
    message: string,
    input: Partial<Properties>,
  ) {
    return emailTemplates.sharePropertyEmail(
      recipient_email,
      sender_email,
      message || '',
      '',
      input,
    )
  }

  public async viewProperty(
    property_id: string,
    user_id: string,
  ): Promise<void | boolean> {
    await this.utilsProperty.getIfPropertyExist(property_id)
    const checkIfViewsIsRecorded =
      await this.propertyRepository.findIfUserAlreadyViewProperty(
        property_id,
        user_id,
      )
    if (checkIfViewsIsRecorded) {
      return false
    }
    await this.propertyRepository.viewProperty({ property_id, user_id })
  }

  async getApplicationById(application_id: string): Promise<Application> {
    const application =
      await this.applicationRepository.getApplicationById(application_id)
    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Unable to get application`,
      )
    }

    return await this.applicationRepository.getApplicationById(application_id)
  }

  async getLenderBanks() {
    const lenderOrgs = await this.lenderRepository.getAllLenders({
      result_per_page: Number.MAX_SAFE_INTEGER,
    })

    //@ts-ignore
    lenderOrgs.result = await Promise.all(
      lenderOrgs.result.map(async (lender) => {
        const organization =
          await this.organizationRepository.getOrganizationById(
            lender.organization_id,
          )

        let ownerUserView: UserClientView
        if (organization.owner_user_id) {
          const ownerUser = await this.userRepository.findById(
            organization.owner_user_id,
          )

          if (ownerUser) {
            ownerUserView = getUserClientView(ownerUser)
          }
        }

        return {
          ...getLenderClientView(lender),
          owner: ownerUserView ?? null,
          organization,
        }
      }),
    )

    return lenderOrgs
  }

  async getPropertyReportDocs() {
    const developerDocGroup =
      await this.documentRepository.findDocumentGroupByTag(
        DocumentGroupKind.PropertyReport,
      )

    if (!developerDocGroup) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Property Reports document group not found. Please check server configuration.',
      )
    }

    const documentGroupTypes =
      await this.documentRepository.findGroupDocumentTypesByGroupId(
        developerDocGroup.id,
      )

    return {
      ...developerDocGroup,
      documents: documentGroupTypes,
    }
  }
}
