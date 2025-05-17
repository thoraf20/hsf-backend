import { ApplicationCustomError } from '@middleware/errors/customError'
import { createResponse } from '@presentation/response/responseType'
import { AddressService } from '@use-cases/User/Address'
import {
  CreateAddressInput,
  UpdateAddressInput,
} from '@validators/addressValidator'
import { StatusCodes } from 'http-status-codes'

export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  async createByUser(userId: string, input: CreateAddressInput) {
    const address = await this.addressService.createByUser(userId, input)

    return createResponse(StatusCodes.CREATED, 'Address created successfully', {
      address,
    })
  }

  async getByUser(userId: string) {
    const address = await this.addressService.getByUser(userId)

    return createResponse(StatusCodes.OK, 'Address retrieved succesfully', {
      address,
    })
  }

  async getOneByUserId(id: string, userId: string) {
    const address = await this.addressService.findByUser(id, userId)

    if (!address) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Address not found',
      )
    }

    return createResponse(StatusCodes.OK, 'Address retrieved succesfully', {
      address,
    })
  }

  async updateByUser(id: string, userId: string, input: UpdateAddressInput) {
    const foundAddress = await this.addressService.findByUser(id, userId)

    if (!foundAddress) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Address not found',
      )
    }

    const updatedAddress = await this.addressService.updateByUser(id, input)

    return createResponse(StatusCodes.OK, 'Address updated successfully', {
      address: updatedAddress,
    })
  }

  async deleteByUser(id: string, userId: string) {
    const address = await this.addressService.deleteByUser(id, userId)

    if (!address) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Address not found',
      )
    }

    return createResponse(StatusCodes.OK, 'Address deleted successfully', {
      id: address.id,
    })
  }
}
