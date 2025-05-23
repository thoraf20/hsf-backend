import { EligibilityStatus } from '@domain/enums/prequalifyEnum'
import { PrequalificationInput } from '@entities/PrequalificationInput'
import {
  Eligibility,
  employmentInformation,
  payment_calculator,
  personalinformation,
  preQualify,
  PreQualifyDIP,
} from '@entities/prequalify/prequalify'
import { User } from '@entities/User'
import db, { createUnion } from '@infrastructure/database/knex'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SearchType } from '@shared/types/repoTypes'
import { addQueryUnionFilter } from '@shared/utils/helpers'
import { applyPagination } from '@shared/utils/paginate'
import {
  PreQualifierEligibleInput,
  PreQualifierStatusQuery,
  PreQualifyFilters,
} from '@validators/prequalifyValidation'
import { Knex } from 'knex'
import { userInfo } from 'node:os'

export class PrequalifyRepository implements IPreQualify {
  public async storePersonaInfo(
    input: personalinformation,
  ): Promise<personalinformation> {
    const [personalInformation] = await db('prequalify_personal_information')
      .insert(input)
      .returning('*')
    return new personalinformation(personalInformation)
      ? personalInformation
      : null
  }

  public async storeEmploymentInfo(
    input: employmentInformation,
  ): Promise<employmentInformation> {
    const [employment] = await db('prequalify_other_info')
      .insert(input)
      .returning('*')
    return new employmentInformation(employment) ? employment : null
  }

  public async storePaymentCalculator(
    input: payment_calculator,
  ): Promise<payment_calculator> {
    const [paymentCalculator] = await db('prequalify_payment_calculator')
      .insert(input)
      .returning('*')
    return new payment_calculator(paymentCalculator) ? paymentCalculator : null
  }

  public async findIfApplyForLoanAlready(loaner_id: string): Promise<any> {
    return await db('prequalify_status')
      .where('loaner_id', loaner_id)
      .where('is_prequalify_requested', true)
      .first()
  }

  public async addEligibility(input: Eligibility): Promise<Eligibility> {
    const [eligiblity] = await db('eligibility').insert(input).returning('*')
    return new Eligibility(eligiblity) ? eligiblity : null
  }

  public async IsHomeBuyerEligible(
    property_id: string,
    user_id: string,
  ): Promise<Eligibility> {
    const eligible = await db('eligibility')
      .select('*')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .andWhere('is_eligible', true)
      .first()
    return new Eligibility(eligible) ? eligible : null
  }

  public async findEligiblity(
    property_id: string,
    user_id: string,
  ): Promise<Eligibility> {
    const eligible = await db('eligibility')
      .select('*')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .orderBy('created_at', 'desc')
      .first()
    return new Eligibility(eligible) ? eligible : null
  }

  public async updateEligibility(
    input: PreQualifierEligibleInput,
  ): Promise<Eligibility> {
    const [updated] = await db('eligibility')
      .update({
        eligiblity_status: input.is_eligible
          ? EligibilityStatus.APPROVED
          : EligibilityStatus.DELINCED,
        is_eligible: input.is_eligible,
      })
      .where('eligibility_id', input.eligibility_id)
      .returning('*')

    return updated
  }

  public async updatePrequalifyStatus(
    loaner_id: string,
    input: Partial<preQualify>,
  ): Promise<void> {
    await db('prequalify_status').update(input).where('loaner_id', loaner_id)
  }

  public async getPreQualifyRequest(): Promise<any[]> {
    const prequalify = await db('prequalify_status as ps')
      .join(
        'prequalify_personal_information as ppi',
        'ps.personal_information_id',
        'ppi.personal_information_id',
      )
      .join('users as u', 'ps.loaner_id', 'u.id')
      .select(
        'ps.*',
        'ppi.*',
        'u.full_name as loaner_name',
        'u.email as loaner_email',
      )
    return prequalify
  }

  public async getPreQualifyRequestByUser(
    user_id: string,
    query: PreQualifierStatusQuery,
  ): Promise<PrequalificationInput> {
    let baseQuery = db('prequalification_inputs as pi').where(
      'pi.user_id',
      user_id,
    )

    if (query.property_id) {
      baseQuery = baseQuery
        .leftJoin('eligibility as e', (qb) => {
          qb.on('e.prequalifier_input_id', 'pi.id').andOnVal(
            'e.property_id',
            query.property_id,
          )
        })
        .select('pi.*', db.raw('row_to_json(e) as eligible'))
    }

    console.log({ sql: baseQuery.toSQL().sql, query })

    const preQualify = await baseQuery.first()
    return preQualify
  }

  public async getPreQualifyRequestById(id: string): Promise<preQualify> {
    const prequalify = await db('prequalify_status as ps')
      .join(
        'prequalify_personal_information as ppi',
        'ps.personal_information_id',
        'ppi.personal_information_id',
      )
      .join(
        'prequalify_other_info as info',
        'ps.personal_information_id',
        'info.personal_information_id',
      )
      .join('users as u', 'ps.loaner_id', 'u.id')
      .where('ps.status_id', id)
      .select('ps.*', 'ppi.*', 'info.*')
      .first()

    return prequalify
  }

  public async checkDuplicateEmail(identifier: string): Promise<User> {
    const user = await db('prequalify_personal_information')
      .where('email', identifier)
      .first()
    return user ? new User(user) : null
  }
  public async checkDuplicatePhone(identifier: string): Promise<User> {
    const user = await db('prequalify_personal_information')
      .where('phone_number', identifier)
      .first()
    return user ? new User(user) : null
  }

  usePreQualiferFilter(
    q: Knex.QueryBuilder<any, any[]>,
    filters: PreQualifyFilters,
  ) {
    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.status) {
      add(q).whereRaw(
        db.raw(addQueryUnionFilter('ps.status', [filters.status])),
      )
    }

    return q
  }

  getAllPreQualifiers(
    filters: PreQualifyFilters,
  ): Promise<SeekPaginationResult<PreQualifyDIP>> {
    let baseQuery = db('prequalify_status as ps')
      .innerJoin(
        'prequalify_personal_information as ppi',
        'ps.personal_information_id',
        'ppi.personal_information_id',
      )
      .innerJoin(
        'prequalify_other_info as info',
        'ps.personal_information_id',
        'info.personal_information_id',
      )

    baseQuery = this.usePreQualiferFilter(baseQuery, filters)

    return applyPagination<PreQualifyDIP>(baseQuery)
  }

  async storePreQualificationInput(
    input: PrequalificationInput,
  ): Promise<PrequalificationInput> {
    const payload: PrequalificationInput = {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone_number: input.phone_number,
      gender: input.gender,
      marital_status: input.marital_status,
      house_number: input.house_number,
      street_address: input.street_address,
      state: input.street_address,
      city: input.city,
      user_id: input.user_id,
      employment_confirmation: input.employment_confirmation,
      employment_position: input.employment_position,
      years_to_retirement: input.years_to_retirement,
      employer_name: input.employer_name,
      employer_address: input.employer_address,
      net_income: input.net_income,
      employment_type: input.employment_type,
      existing_loan_obligation: input.existing_loan_obligation,
      employer_state: input.employer_state,
      industry_type: input.industry_type,
    }
    if (input.id) {
      let existing = db<PrequalificationInput>('prequalification_inputs')
        .select()
        .where({ user_id: input.user_id })
        .first()

      if (existing) {
        const [updated] = await db<PrequalificationInput>(
          'prequalification_inputs',
        )
          .update(payload)
          .where({ user_id: input.user_id })
          .returning('*')

        return updated
      }
    }
    const [newly] = await db<PrequalificationInput>('prequalification_inputs')
      .insert(payload)
      .returning('*')

    return newly
  }
}
