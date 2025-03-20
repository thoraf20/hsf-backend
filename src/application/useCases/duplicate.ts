import { ApplicationCustomError } from "../../middleware/errors/customError";
import { IUserRepository } from "../../domain/interfaces/IUserRepository";
import { StatusCodes } from "http-status-codes";



export class ExistingUsers {
    private userRepository: IUserRepository
    constructor(userRepository: IUserRepository) { 
        this.userRepository = userRepository
    }
      public async beforeCreate(
        email: string,
        phone_number: string,
      ): Promise<void> {
        const [existingUser, existingPhone] = await Promise.all([
          this.userRepository.findByEmail(email),
          this.userRepository.findByPhone(phone_number),
        ])
    
        if (existingUser) {
          throw new ApplicationCustomError(
            StatusCodes.CONFLICT,
            'Email is already in use.',
          )
        }
    
        if (existingPhone) {
          throw new ApplicationCustomError(
            StatusCodes.CONFLICT,
            'Phone number is already in use.',
          )
        }
      }
}