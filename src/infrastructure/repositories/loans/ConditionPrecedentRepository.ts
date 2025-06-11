import { ConditionPrecedentStatus } from '@domain/enums/propertyEnum'
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

  async findCompletedConditionPrecedentsWithoutLoan(
    batchSize: number = 100,
  ): Promise<ConditionPrecedent[]> {
    let allCompletedConditionPrecedents: ConditionPrecedent[] = []
    let offset = 0

    while (true) {
      const completedConditionPrecedents = await db<ConditionPrecedent>(
        'condition_precedents',
      )
        .where({ status: ConditionPrecedentStatus.Completed })
        .limit(batchSize)
        .offset(offset)

      if (completedConditionPrecedents.length === 0) {
        break
      }

      // Filter out condition precedents that have associated loans
      const filteredConditionPrecedents = completedConditionPrecedents.filter(
        async (conditionPrecedent) => {
          const existingLoan = await db('loans')
            .where({ application_id: conditionPrecedent.application_id })
            .first()
          return !existingLoan // Keep only if no loan exists
        },
      )

      allCompletedConditionPrecedents = allCompletedConditionPrecedents.concat(
        filteredConditionPrecedents,
      )
      offset += batchSize
    }

    return allCompletedConditionPrecedents
  }
}
