import { Knex } from 'knex'
import * as uuid from 'uuid'
import dotenv from 'dotenv'
import path from 'path'
import { User } from '../../src/domain/entities/User'
import { OrganizationType } from '../../src/domain/enums/organizationEnum'
import { UserStatus } from '../../src/domain/enums/userEum'
import bcrypt from 'bcryptjs'

const uuidv4 = uuid.v4
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// --- Configuration for HSF Staff ---
const HSF_ORGANIZATION_NAME = 'HSF'
const HSF_ORGANIZATION_TYPE_ENUM = OrganizationType.HSF_INTERNAL
const SUPER_ADMIN_ROLE_NAME = 'super_admin'
const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL || 'ayomidelawal700@hsf.com'
const DEFAULT_PASSWORD = process.env.DEFAULT_SEED_PASSWORD || 'Password123!' // Store hashed version

// Placeholder for your actual password hashing function
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(Number(process.env.APP_KEY))
  return bcrypt.hashSync(password, salt)
}

export async function seed(knex: Knex): Promise<void> {
  const HASHED_DEFAULT_PASSWORD = await hashPassword(DEFAULT_PASSWORD)

  // --- 1. Upsert HSF Organization ---
  let hsfOrganization = await knex('organizations')
    .where({ name: HSF_ORGANIZATION_NAME, type: HSF_ORGANIZATION_TYPE_ENUM })
    .first()

  if (!hsfOrganization) {
    console.log(`Creating HSF organization: ${HSF_ORGANIZATION_NAME}`)
    const [newOrg] = await knex('organizations')
      .insert({
        id: uuidv4(),
        name: HSF_ORGANIZATION_NAME,
        type: HSF_ORGANIZATION_TYPE_ENUM,
      })
      .returning('*')
    hsfOrganization = newOrg
  } else {
    console.log(`HSF organization '${HSF_ORGANIZATION_NAME}' already exists.`)
  }
  if (!hsfOrganization) {
    console.error(
      'Fatal: Failed to create or find HSF organization. Aborting HSF staff seed.',
    )
    return
  }

  // --- Helper Function to Seed User and Assign to HSF Org ---
  const seedHsfUser = async (
    email: string | undefined,
    firstName: string,
    lastName: string,
    hsfRoleName: string,
  ) => {
    if (!email) {
      console.warn(
        `Email not provided for ${firstName} ${lastName} (${hsfRoleName}). Skipping user seeding.`,
      )
      return null
    }

    let user = await knex('users').where({ email }).first()
    const hsfRole = await knex('roles').where({ name: hsfRoleName }).first()

    if (!hsfRole) {
      console.error(
        `Role '${hsfRoleName}' not found. Cannot seed user ${email}.`,
      )
      return null
    }

    if (!user) {
      console.log(`Creating HSF user: ${email} with role ${hsfRoleName}`)
      const [newUser] = await knex<User>('users')
        .insert({
          id: uuidv4(),
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: HASHED_DEFAULT_PASSWORD,
          is_mfa_enabled: true,
          is_email_verified: false,
          status: UserStatus.Active, // Adjust to your UserStatus enum
          role_id: hsfRole.id, // Optional: set a global default role from 'roles' table
        })
        .returning('*')
      user = newUser
    } else {
      console.log(`HSF user ${email} already exists.`)
    }

    if (!user) {
      console.error(`Failed to create or find HSF user ${email}.`)
      return null
    }

    // Assign user to HSF Organization with the specified HSF role
    const existingMembership = await knex('user_organization_memberships')
      .where({
        user_id: user.id,
        organization_id: hsfOrganization!.id, // hsfOrganization is guaranteed to exist here
        role_id: hsfRole.id,
      })
      .first()

    if (!existingMembership) {
      console.log(
        `Assigning user '${user.email}' as '${hsfRole.name}' to HSF organization '${hsfOrganization!.name}'.`,
      )
      await knex('user_organization_memberships').insert({
        id: uuidv4(),
        user_id: user.id,
        organization_id: hsfOrganization!.id,
        role_id: hsfRole.id,
      })
    } else {
      console.log(
        `User '${user.email}' already '${hsfRole.name}' in HSF organization '${hsfOrganization!.name}'.`,
      )
    }
    return user
  }

  // --- 2. Seed Super Admin for HSF ---
  const superAdminUser = await seedHsfUser(
    SUPER_ADMIN_EMAIL,
    'Ayomide',
    'Lawal',
    SUPER_ADMIN_ROLE_NAME,
  )
  // If Super Admin is successfully created/found and is the designated owner of HSF Org:
  if (superAdminUser && !hsfOrganization.owner_user_id) {
    await knex('organizations')
      .where({ id: hsfOrganization.id })
      .update({ owner_user_id: superAdminUser.id })
    console.log(
      `Set user '${superAdminUser.email}' as owner of HSF organization.`,
    )
  }

  // // --- 3. Seed General HSF Admin ---
  // await seedHsfUser(HSF_ADMIN_EMAIL, 'HSF', 'GeneralAdmin', HSF_ADMIN_ROLE_NAME)

  // // --- 4. Seed HSF Loan Officer ---
  // await seedHsfUser(
  //   HSF_LOAN_OFFICER_EMAIL,
  //   'HSF',
  //   'LoanPro',
  //   HSF_LOAN_OFFICER_ROLE_NAME,
  // )

  // // --- Add more HSF staff as needed ---
  // // Example:
  // // const HSF_COMPLIANCE_EMAIL = process.env.TEST_HSF_COMPLIANCE_EMAIL || "hsfcompliance@homestate.finance";
  // // const HSF_COMPLIANCE_ROLE_NAME = "compliance officer"; // Ensure this role name exists
  // // await seedHsfUser(HSF_COMPLIANCE_EMAIL, "HSF", "ComplianceExpert", HSF_COMPLIANCE_ROLE_NAME);

  // console.log('HSF organization and staff seeding completed.')
}
