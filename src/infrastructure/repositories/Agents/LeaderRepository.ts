import { Lender, LenderProfile } from "@entities/Leader"
import db from "@infrastructure/database/knex"
import { ILenderRepository } from "@interfaces/ILenderRepository"


export class LenderRepository implements ILenderRepository {
  private readonly tableName = 'lender_profile'

  async createLender(lender: Lender): Promise<LenderProfile> {
    const [createdLender] = await db(this.tableName).insert(lender).returning('*')
    return new Lender(createdLender) ? createdLender : null
  }

  async getLenderById(id: string): Promise<Lender | null> {
    const lender = await db(this.tableName).where({ id }).first()
    return lender ? new Lender(lender) : null
  }

    async getAllLenders(): Promise<Lender[]> {
        const lenders = await db(this.tableName).select('*')
        return lenders.map((lender) => new Lender(lender))
    }

    async updateLender(id: string, lender: Partial<Lender>): Promise<Lender | null> {
        const [updatedLender] = await db(this.tableName).where({ id }).update(lender).returning('*')
        return updatedLender ? new Lender(updatedLender) : null
    }

    async deleteLender(id: string): Promise<void> {
        await db(this.tableName).where({ id }).delete()
    }

    async findLenderByName(lender_name: string): Promise<Lender | null> {
        const lender = await db(this.tableName).where({ lender_name }).first()
        return lender ? new Lender(lender) : null
    }

    async findLenderByCac(cac: string): Promise<Lender | null> {
        const lender = await db(this.tableName).where({ cac }).first()
        return lender ? new Lender(lender) : null
    }

  }