import { DocumentDeclineReason } from '@entities/DeclineRequest/DocumentDeclineReason'
import db from '@infrastructure/database/knex'
import { IDocumentDeclineReasonRepository } from '@interfaces/IDocumentDeclineReasonRepository'
import { Knex } from 'knex'

export class DocumentDeclineReasonRepository
  implements IDocumentDeclineReasonRepository
{
  private readonly tableName = 'document_decline_reasons'
  private knex: Knex

  constructor() {
    this.knex = db
  }

  async create(
    data: Omit<DocumentDeclineReason, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<DocumentDeclineReason> {
    const [documentDeclineReason] = await this.knex(this.tableName)
      .insert(data)
      .returning('*')
    return documentDeclineReason
  }

  async findById(id: string): Promise<DocumentDeclineReason | undefined> {
    return this.knex(this.tableName).where({ id }).first()
  }

  async findByDocumentDeclineEventId(
    documentDeclineEventId: string,
  ): Promise<DocumentDeclineReason[]> {
    return this.knex(this.tableName)
      .where({ document_decline_event_id: documentDeclineEventId })
      .select('*')
  }

  async findByDeclineReasonId(
    declineReasonId: string,
  ): Promise<DocumentDeclineReason[]> {
    return this.knex(this.tableName)
      .where({ decline_reason_id: declineReasonId })
      .select('*')
  }

  async findByDocumentDeclineEventIdAndDeclineReasonId(
    documentDeclineEventId: string,
    declineReasonId: string,
  ): Promise<DocumentDeclineReason | undefined> {
    return this.knex(this.tableName)
      .where({
        document_decline_event_id: documentDeclineEventId,
        decline_reason_id: declineReasonId,
      })
      .first()
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await this.knex(this.tableName).where({ id }).del()
    return deletedCount > 0
  }
}
