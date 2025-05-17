import { Address } from '@entities/User'
import { IAddressRepository } from '@interfaces/IAddressRepository'
import {
  CreateAddressInput,
  UpdateAddressInput,
} from '@validators/addressValidator'

export class AddressService {
  private readonly addressRepository: IAddressRepository

  constructor(addressRepository: IAddressRepository) {
    this.addressRepository = addressRepository
  }

  async createByUser(
    userId: string,
    input: CreateAddressInput,
  ): Promise<Address> {
    return this.addressRepository.create(
      new Address({
        user_id: userId,
        address_type: input.address_type,
        city: input.city,
        state: input.state,
        street_address: input.street_address,
        country: input.country,
        postal_code: input.postal_code,
      }),
    )
  }

  async getByUser(userId: string) {
    const addresses = await this.addressRepository.getUserAddresses(userId)
    return addresses
  }

  async deleteByUser(id: string, userId: string) {
    return this.addressRepository.deleteByUser(id, userId)
  }

  async findByUser(id: string, userId: string) {
    const address = await this.addressRepository.findById(id)
    if (!(address && address.user_id === userId)) {
      return null
    }

    return address
  }

  async updateByUser(id: string, input: UpdateAddressInput) {
    return this.addressRepository.update(id, input)
  }
}
