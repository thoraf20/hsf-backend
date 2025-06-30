import { DocumentDeclineEvent } from '@entities/DeclineRequest/DocumentDeclineEvent'
import db from '@infrastructure/database/knex'
import { IDocumentDeclineEventRepository } from '@interfaces/IDocumentDeclineEventRepository'
import { Knex } from 'knex'

export class DocumentDeclineEventRepository
  implements IDocumentDeclineEventRepository
{
  private readonly tableName = 'document_decline_events'
  private knex: Knex

  constructor() {
    this.knex = db
  }

  async create(
    data: Omit<
      DocumentDeclineEvent,
      'id' | 'created_at' | 'updated_at' | 'declined_at'
    >,
  ): Promise<DocumentDeclineEvent> {
    const [documentDeclineEvent] = await this.knex(this.tableName)
      .insert(data)
      .returning('*')
    return documentDeclineEvent
  }

  async findById(id: string): Promise<DocumentDeclineEvent | undefined> {
    return this.knex(this.tableName).where({ id }).first()
  }

  async findByApplicationDocumentEntryId(
    applicationDocumentEntryId: string,
  ): Promise<DocumentDeclineEvent[]> {
    return this.knex(this.tableName)
      .where({ application_document_entry_id: applicationDocumentEntryId })
      .select('*')
  }

  async update(
    id: string,
    data: Partial<
      Omit<
        DocumentDeclineEvent,
        'id' | 'created_at' | 'updated_at' | 'declined_at'
      >
    >,
  ): Promise<DocumentDeclineEvent | undefined> {
    const [updatedDocumentDeclineEvent] = await this.knex(this.tableName)
      .where({ id })
      .update(data)
      .returning('*')
    return updatedDocumentDeclineEvent
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await this.knex(this.tableName).where({ id }).del()
    return deletedCount > 0
  }
}
