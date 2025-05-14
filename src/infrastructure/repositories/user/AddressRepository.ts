import { Address } from '@entities/User'
import db from '@infrastructure/database/knex'
import { IAddressRepository } from '@interfaces/IAddressRepository'
import { Knex } from 'knex'

export class AddressRepository implements IAddressRepository {
  private readonly db: Knex

  constructor() {
    this.db = db
  }
  async create(address: Address): Promise<Address> {
    const [createdAddress] = await this.db<Address>('addresses')
      .insert({
        street_address: address.street_address,
        city: address.city,
        state: address.state,
        country: address.country,
        postal_code: address.postal_code,
        address_type: address.address_type,
        user_id: address.user_id,
      })
      .returning('*')
    return new Address(createdAddress)
  }

  async update(id: string, update: Partial<Address>): Promise<Address> {
    const [updatedAddress] = await this.db<Address>('addresses')
      .update({
        street_address: update.street_address,
        city: update.city,
        state: update.state,
        country: update.country,
        postal_code: update.postal_code,
        address_type: update.address_type,
        user_id: update.user_id,
      })
      .where({ id })
      .returning('*')

    return new Address(updatedAddress)
  }

  async findById(id: string): Promise<Address | null> {
    const address = await this.db<Address>('addresses').where({ id }).first()
    return address ?? null
  }

  async getUserAddresses(userId: string): Promise<Address[]> {
    const address = await this.db<Address>('addresses').where({
      user_id: userId,
    })
    return address
  }

  async deleteByUser(id: string, userId: string): Promise<Address> {
    const [deleted] = await this.db<Address>('addresses')
      .delete()
      .where({ id, user_id: userId })
      .returning('*')

    return deleted
  }
}
