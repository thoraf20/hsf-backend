import { DocumentDeclineReason } from '@entities/DeclineRequest/DocumentDeclineReason'

export interface IDocumentDeclineReasonRepository {
  create(
    data: Omit<DocumentDeclineReason, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<DocumentDeclineReason>
  findById(id: string): Promise<DocumentDeclineReason | undefined>
  findByDocumentDeclineEventId(
    documentDeclineEventId: string,
  ): Promise<DocumentDeclineReason[]>
  findByDeclineReasonId(
    declineReasonId: string,
  ): Promise<DocumentDeclineReason[]>
  findByDocumentDeclineEventIdAndDeclineReasonId(
    documentDeclineEventId: string,
    declineReasonId: string,
  ): Promise<DocumentDeclineReason | undefined>
  delete(id: string): Promise<boolean>
}
