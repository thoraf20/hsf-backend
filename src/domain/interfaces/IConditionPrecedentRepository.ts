import { ConditionPrecedent } from '@entities/ConditionPrecedent'

export interface IConditionPrecedentRepository {
  create(data: Partial<ConditionPrecedent>): Promise<ConditionPrecedent>
  findById(id: string): Promise<ConditionPrecedent | null>
  findByApplicationId(applicationId: string): Promise<ConditionPrecedent[]>
  update(
    id: string,
    data: Partial<ConditionPrecedent>,
  ): Promise<ConditionPrecedent | null>
  delete(id: string): Promise<boolean>
}
