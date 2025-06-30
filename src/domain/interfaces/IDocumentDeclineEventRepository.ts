import { DocumentDeclineEvent } from '@entities/DeclineRequest/DocumentDeclineEvent'

export interface IDocumentDeclineEventRepository {
  create(
    data: Omit<
      DocumentDeclineEvent,
      'id' | 'created_at' | 'updated_at' | 'declined_at'
    >,
  ): Promise<DocumentDeclineEvent>
  findById(id: string): Promise<DocumentDeclineEvent | undefined>
  findByApplicationDocumentEntryId(
    applicationDocumentEntryId: string,
  ): Promise<DocumentDeclineEvent[]>
  update(
    id: string,
    data: Partial<
      Omit<
        DocumentDeclineEvent,
        'id' | 'created_at' | 'updated_at' | 'declined_at'
      >
    >,
  ): Promise<DocumentDeclineEvent | undefined>
  delete(id: string): Promise<boolean>
}
