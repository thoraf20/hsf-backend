import { LoanRepaymentSchedule } from '@entities/Loans'
import db from '@infrastructure/database/knex'
import { ILoanRepaymentScheduleRepository } from '@interfaces/ILoanRepaymentScheduleRepository'

export class LoanRepaymentScheduleRepository
  implements ILoanRepaymentScheduleRepository
{
  private readonly tableName = 'loan_repayment_schedules'

  async getLoanRepaymentScheduleById(
    schedule_id: string,
  ): Promise<LoanRepaymentSchedule | null> {
    const schedule = await db(this.tableName).where({ schedule_id }).first()
    return schedule ? new LoanRepaymentSchedule(schedule) : null
  }

  async createLoanRepaymentSchedule(
    loanRepaymentSchedule: LoanRepaymentSchedule,
  ): Promise<LoanRepaymentSchedule> {
    const [newSchedule] = await db(this.tableName)
      .insert(loanRepaymentSchedule)
      .returning('*')
    return new LoanRepaymentSchedule(newSchedule)
  }

  async updateLoanRepaymentSchedule(
    schedule_id: string,
    loanRepaymentSchedule: Partial<LoanRepaymentSchedule>,
  ): Promise<LoanRepaymentSchedule | null> {
    await db(this.tableName)
      .where({ schedule_id })
      .update(loanRepaymentSchedule)
    const updatedSchedule = await this.getLoanRepaymentScheduleById(schedule_id)
    return updatedSchedule
  }

  async deleteLoanRepaymentSchedule(schedule_id: string): Promise<void> {
    await db(this.tableName).where({ schedule_id }).del()
  }
}
