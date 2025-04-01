import { ApplicationCustomError } from '@middleware/errors/customError'
import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { StatusCodes } from 'http-status-codes'
import { IPropertyRepository } from '@domain/interfaces/IPropertyRepository'
import { Properties } from '@domain/entities/Property'
import { IInspectionRepository } from '@domain/interfaces/IInspectionRepository'
import { Inspection } from '@domain/entities/Inspection'
import { IEnquiresRepository } from '@interfaces/IEnquiresRepository'
import { Enquiry } from '@entities/Enquires'

export class ExistingUsers {
  private userRepository: IUserRepository

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository
  }
  public async beforeCreatePhone(phone_number: string): Promise<void> {
    const existingPhone = await this.userRepository.findByPhone(phone_number)

    if (existingPhone) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Phone number is already in use.',
      )
    }
  }
  public async beforeCreateEmail(email: string): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email)
    console.log(email)
    if (existingUser) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Email is already in use.',
      )
    }
  }
}

export class PropertyBaseUtils {
  private propertyRepository: IPropertyRepository

  constructor(propertyRepository: IPropertyRepository) {
    this.propertyRepository = propertyRepository
  }

  public async findIfPropertyExist(id: string): Promise<Properties> {
    const properties = (await this.propertyRepository.findPropertyById(
      id,
    )) as Properties
    if (!properties) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Property does not exist',
      )
    }
    return properties
  }

  public async findIfPropertyExistByName(
    property_name: string,
  ): Promise<Properties> {
    const properties = (await this.propertyRepository.findPropertiesName(
      property_name,
    )) as Properties
    if (properties) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Property Name existed already',
      )
    }
    return properties
  }

  public async findIfPropertyBelongsToUser(
    property_id: string,
    user_id: string,
  ): Promise<Properties> {
    const properties = (await this.propertyRepository.findPropertyById(
      property_id,
    )) as Properties
    if (properties) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Property does not exist',
      )
    }

    if (properties.user_id != user_id) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Property does not exist',
      )
    }

    return properties
  }

  public async findIfWatchListIsAdded(
    property_id: string,
    user_id: string,
  ): Promise<Properties> {
    const watchlist =
      await this.propertyRepository.getIfWatchListPropertyIsAdded(
        property_id,
        user_id,
      )
    if (watchlist) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'WatchList added already',
      )
    }
    return watchlist
  }
}

export class InspectionBaseUtils {
  private inspectionRepo: IInspectionRepository
  constructor(inspectionRepo: IInspectionRepository) {
    this.inspectionRepo = inspectionRepo
  }

  public async findALreadyScheduledInspection(
    property_id: string,
    user_id: string,
  ): Promise<Inspection> {
    const findInpection =
      await this.inspectionRepo.getAlreadySchedulesInspection(
        property_id,
        user_id,
      )
    if (findInpection) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'You have requested for Inspection already',
      )
    }
    return findInpection
  }
}

export class EnquiryBaseUtils {
  private enquiryRepository: IEnquiresRepository
  private propertyRepository: IPropertyRepository
  constructor(
    enquiryRepo: IEnquiresRepository,
    propertyRepo: IPropertyRepository,
  ) {
    this.enquiryRepository = enquiryRepo
    this.propertyRepository = propertyRepo
  }

  public async confirmEnquiryExist(
    enquiry_id: string,
    user_id: string,
  ): Promise<Enquiry> {
    const enquiry = await this.enquiryRepository.getEnquiry(enquiry_id)

    if (!enquiry) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Enquiry doesnt exist',
      )
    }
    return enquiry
  }

  public async confirmEnquiryExistForUser(
    enquiry_id: string,
    user_id: string,
  ): Promise<Enquiry> {
    const enquiry = await this.enquiryRepository.getEnquiry(enquiry_id)

    if (!enquiry) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Enquiry doesnt exist',
      )
    }

    if (enquiry.customer_id != user_id && enquiry.developer_id != user_id)
      return enquiry
  }

  public async confirmEnquiryDoesntExist(
    property_id: string,
    user_id: string,
  ): Promise<void> {
    const enquiry = await this.enquiryRepository.getUserEnquiryOfProduct(
      property_id,
      user_id,
    )

    if (enquiry != null) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Enquiry already exist',
      )
    }
  }

  public async checkPropertyExist(property_id: string) {
    const property = await this.propertyRepository.findPropertyById(property_id)

    if (property == null) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        "property doesn't exist",
      )
    }

    return property
  }
}
