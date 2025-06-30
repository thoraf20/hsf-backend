import { Knex } from 'knex'
import { ContactInformation } from '@domain/entities/ContactInformation'
import db from '@infrastructure/database/knex'
import { IContactInformationRepository } from '@interfaces/IContactInformationRepository'

export class ContactInformationRepository
  implements IContactInformationRepository
{
  private readonly tableName = 'contact_informations'
  private readonly knex: Knex
  constructor() {
    this.knex = db
  }

  async create(data: Partial<ContactInformation>): Promise<ContactInformation> {
    const [result] = await this.knex(this.tableName).insert(data).returning('*')
    return new ContactInformation(result)
  }

  async findById(id: string): Promise<ContactInformation | null> {
    const result = await this.knex(this.tableName).where({ id }).first()
    return result ? new ContactInformation(result) : null
  }

  async findByUserId(userId: string): Promise<ContactInformation | null> {
    const result = await this.knex(this.tableName)
      .where({ user_id: userId })
      .first()
    return result ? new ContactInformation(result) : null
  }

  async update(
    id: string,
    data: Partial<ContactInformation>,
  ): Promise<ContactInformation | null> {
    const [result] = await this.knex(this.tableName)
      .where({ id })
      .update(data)
      .returning('*')
    return result ? new ContactInformation(result) : null
  }

  async delete(id: string): Promise<boolean> {
    const rowsAffected = await this.knex(this.tableName).where({ id }).del()
    return rowsAffected > 0
  }
}
