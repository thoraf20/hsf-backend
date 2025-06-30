import { DeclineReasonCategory } from '@domain/enums/declineReasonCategoryEnum'
import { DeclineReason } from '@entities/DeclineRequest/DeclineReason'

export interface IDeclineReasonRepository {
  create(
    data: Omit<DeclineReason, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<DeclineReason>
  findById(id: string): Promise<DeclineReason | undefined>
  findByCategory(category: DeclineReasonCategory): Promise<DeclineReason[]>
  findByValue(value: string): Promise<DeclineReason | undefined>
  findAll(): Promise<DeclineReason[]>
  update(
    id: string,
    data: Partial<Omit<DeclineReason, 'id' | 'created_at' | 'updated_at'>>,
  ): Promise<DeclineReason | undefined>
  delete(id: string): Promise<boolean>
}
