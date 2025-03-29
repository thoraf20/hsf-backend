import { ApplicationCustomError } from '../../middleware/errors/customError'
import { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { StatusCodes } from 'http-status-codes'
import { IPropertyRepository } from '../../domain/interfaces/IPropertyRepository'
import { Properties } from '../../domain/entities/Property'
import { IInspectionRepository } from '../../domain/interfaces/IInspectionRepository'
import { Inspection } from '../../domain/entities/Inspection'


export class ExistingUsers {
  private userRepository: IUserRepository

  constructor(
    userRepository: IUserRepository,
  ) {
    this.userRepository = userRepository
  }
  public async beforeCreatePhone(
    phone_number: string,
  ): Promise<void> {
   const existingPhone = await this.userRepository.findByPhone(phone_number)
 

    if (existingPhone) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Phone number is already in use.',
      )
    }
  }
  public async beforeCreateEmail(
    email: string,
  ): Promise<void> {
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
    this.propertyRepository = propertyRepository;
  }

  public async findIfPropertyExist(
    id: string,
  ): Promise<Properties> {
    const properties = await this.propertyRepository.findPropertyById(id) as Properties;
    if (!properties) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Property does not exist',
      )
    }
    return properties;
  }

 
  public async findIfPropertyExistByName(property_name: string): Promise<Properties> {
    const properties = await this.propertyRepository.findPropertiesName(property_name) as Properties;
    if (properties) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Property Name existed already',
      )
    }
    return properties;
  }
     

  public async findIfWatchListIsAdded (property_id: string, user_id: string) : Promise<Properties> {
           const watchlist = await this.propertyRepository.getIfWatchListPropertyIsAdded(property_id, user_id)
           if(watchlist) {
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
      constructor (inspectionRepo: IInspectionRepository) {
         this.inspectionRepo = inspectionRepo
      }

      public async findALreadyScheduledInspection (property_id: string, user_id: string): Promise<Inspection> {
           const findInpection = await this.inspectionRepo.getAlreadySchedulesInspection(property_id, user_id)
           if(findInpection) {
               throw new ApplicationCustomError(
                StatusCodes.CONFLICT,
                'You have requested for Inspection already'
               )
           }
          return findInpection

      }
}