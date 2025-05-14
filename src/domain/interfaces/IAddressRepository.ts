import { Address } from '@entities/User'

export interface IAddressRepository {
  create(address: Address): Promise<Address>
  findById(id: string): Promise<Address | null>
  update(id: string, data: Partial<Address>): Promise<Address>
  deleteByUser(id: string, userId: string): Promise<Address>
  getUserAddresses(userId: string): Promise<Address[]>
}
