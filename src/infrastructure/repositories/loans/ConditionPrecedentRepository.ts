import { ConditionPrecedent } from '@entities/ConditionPrecedent'
import db from '@infrastructure/database/knex'
import { IConditionPrecedentRepository } from '@interfaces/IConditionPrecedentRepository'

export class ConditionPrecedentRepository
  implements IConditionPrecedentRepository
{
  async create(data: Partial<ConditionPrecedent>): Promise<ConditionPrecedent> {
    const [conditionPrecedent] = await db<ConditionPrecedent>(
      'condition_precedents',
    )
      .insert(data)
      .returning('*')
    return conditionPrecedent
  }

  async findById(id: string): Promise<ConditionPrecedent | null> {
    const conditionPrecedent = await db<ConditionPrecedent>(
      'condition_precedents',
    )
      .where({ id })
      .first()
    return conditionPrecedent || null
  }

  async findByApplicationId(
    applicationId: string,
  ): Promise<ConditionPrecedent[]> {
    const conditionPrecedents = await db<ConditionPrecedent>(
      'condition_precedents',
    ).where({ application_id: applicationId })
    return conditionPrecedents
  }

  async update(
    id: string,
    data: Partial<ConditionPrecedent>,
  ): Promise<ConditionPrecedent | null> {
    const [conditionPrecedent] = await db<ConditionPrecedent>(
      'condition_precedents',
    )
      .where({ id })
      .update(data)
      .returning('*')
    return conditionPrecedent || null
  }

  async delete(id: string): Promise<boolean> {
    const result = await db<ConditionPrecedent>('condition_precedents')
      .where({ id })
      .del()
    return result > 0
  }
}
