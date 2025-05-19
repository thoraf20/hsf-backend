import { Knex } from 'knex'
import * as uuid from 'uuid'
// Assuming a hashing utility exists or will be added
// import { hashPassword } from '../utils/authUtils'; // Placeholder
import { OrganizationType } from '../../src/domain/enums/organizationEnum'
import { Organization } from '../../src/domain/entities/Organization'
import { Role } from '../../src/domain/enums/rolesEmun'

const uuidv4 = uuid.v4

export async function seed(knex: Knex): Promise<void> {
  // Placeholder for password hashing function - replace with actual hashing logic
  const hashPassword = async (password: string): Promise<string> => {
    // In a real application, use a library like bcryptjs
    console.warn(
      'Using placeholder password hashing. Replace with a secure method.',
    )
    return `hashed_${password}` // Example placeholder
  }

  // Check if a user with this email already exists to prevent duplicates
  const developerEmail = 'developer.seed@example.com'
  const existingUser = await knex('users')
    .where('email', developerEmail)
    .first()

  if (existingUser) {
    console.log(
      `Developer user with email ${developerEmail} already exists. Skipping seed.`,
    )
    // Optionally, update the existing developer profile instead
    // const developerProfile = { ... };
    // await knex('developers_profile').where('developers_profile_id', existingUser.id).update(developerProfile);
  }

  // Find the 'DEVELOPER' role ID
  // You might need to ensure a 'DEVELOPER' role exists in your roles_and_permissions seed
  const developerRole = await knex('roles')
    .where('name', Role.DEVELOPER_ADMIN)
    .first() // Assuming 'DEVELOPER' is the role name

  if (!developerRole) {
    console.warn('DEVELOPER role not found. Cannot seed developer user.')
    // Depending on your requirements, you might want to create the role here
    // or throw an error.
    return
  }

  // --- Create or Find Developer Organization ---
  const developerOrgName = 'Seeded Developer Organization'
  const developerOrgType = OrganizationType.DEVELOPER_COMPANY // Assuming you have a DEVELOPER type in your enum

  // Check if the organization exists, create it if not
  let developerOrganization = await knex<Organization>('organizations')
    .where({ name: developerOrgName, type: developerOrgType })
    .first()

  if (!developerOrganization) {
    console.log(`Creating Developer organization: ${developerOrgName}`)
    const [newOrg] = await knex<Organization>('organizations')
      .insert({
        id: uuidv4(),
        name: developerOrgName,
        type: developerOrgType,
      })
      .returning('*')
    developerOrganization = newOrg
  } else {
    console.log(`Developer organization '${developerOrgName}' already exists.`)
  }

  if (!developerOrganization) {
    console.error(
      'Fatal: Failed to create or find Developer organization. Aborting seed.',
    )
    return
  }
  // --- Organization Found/Created ---
  //
  if (!developerOrganization.owner_user_id) {
    const userId = uuidv4()
    const hashedPassword = await hashPassword('password123') // Use a strong, random password in production

    // Insert user record
    const [newUser] = await knex('users')
      .insert({
        id: userId,
        first_name: 'Yusuf',
        last_name: 'Lawal',
        email: developerEmail,
        phone_number: '+15551234567', // Replace with a unique phone number
        profile: 'Seeded developer user profile',
        password: hashedPassword,
        is_mfa_enabled: true,
        is_email_verified: false,
        is_phone_verified: false,
        is_default_password: true,
        role_id: developerRole.id, // Link to the global role ID
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*')

    // Insert developer profile record
    await knex('developers_profile').insert({
      profile_id: uuidv4(), // Separate ID for the profile table
      company_name: 'Seed Development Co.',
      company_registration_number: 'REG123456', // Replace with a unique number
      office_address: '123 Seed Street, Developer City',
      company_email: 'company.seed@example.com', // Replace with a unique email
      state: 'CA',
      city: 'San Francisco',
      developer_role: 'Full-Stack Developer',
      years_in_business: '5+',
      specialization: 'Web Development',
      region_of_operation: 'North America',
      company_image: 'https://example.com/company_logo.png', // Placeholder image URL
      documents: JSON.stringify({
        licensing: 'doc1.pdf',
        insurance: 'doc2.pdf',
      }), // Example JSONB data
      organization_id: developerOrganization.id, // Link to the organization ID
      created_at: new Date(),
      updated_at: new Date(),
    })

    // Assign user to the Developer Organization with the specified organization role
    const existingMembership = await knex('user_organization_memberships')
      .where({
        user_id: userId,
        organization_id: developerOrganization.id,
        role_id: developerRole.id, // Link to the organization role ID
      })
      .first()

    if (!existingMembership) {
      console.log(
        `Assigning user '${developerEmail}' as '${developerRole.name}' to organization '${developerOrganization.name}'.`,
      )
      await knex('user_organization_memberships').insert({
        id: uuidv4(),
        user_id: userId,
        organization_id: developerOrganization.id,
        role_id: developerRole.id,
        created_at: new Date(),
        updated_at: new Date(),
      })
    } else {
      console.log(
        `User '${developerEmail}' already '${developerRole.name}' in organization '${developerOrganization.name}'.`,
      )
    }

    if (!developerOrganization.owner_user_id) {
      await knex<Organization>('organizations')
        .update({ owner_user_id: newUser.id })
        .where({ id: developerOrganization.id })
    }

    console.log(
      `Developer user with email ${developerEmail} and associated profile seeded successfully, and linked to organization \'${developerOrganization.name}\'.`,
    )
  }

  // --- Seed Developer Agent Users ---

  // Find the DEVELOPER_AGENT role ID (global and for organization membership)
  const developerAgentRole = await knex('roles')
    .where('name', Role.DEVELOPER_AGENT)
    .first()

  if (!developerAgentRole) {
    console.warn(
      'DEVELOPER_AGENT role not found. Cannot seed developer agent users.',
    )
  } else {
    const numberOfAgentsToSeed = 4
    console.log(
      `Attempting to seed ${numberOfAgentsToSeed} developer agent users...`,
    )

    for (let i = 1; i <= numberOfAgentsToSeed; i++) {
      const agentEmail = `developer.agent.${i}@example.com`
      // Generate a unique phone number. Simple example: +15551234568, +15551234569, ...
      const agentPhoneNumber = `+155512345${60 + i}` // Make sure this range is not used by admin user

      // Check if agent user already exists
      const existingAgentUser = await knex('users')
        .where('email', agentEmail)
        .first()

      if (existingAgentUser) {
        console.log(
          `Developer agent user with email ${agentEmail} already exists. Skipping.`,
        )

        // Optional: Check/add organization membership if user exists but isn't linked
        const existingAgentMembership = await knex(
          'user_organization_memberships',
        )
          .where({
            user_id: existingAgentUser.id,
            organization_id: developerOrganization.id,
            role_id: developerAgentRole.id, // Link to the organization role ID
          })
          .first()

        if (!existingAgentMembership) {
          console.log(
            `Assigning existing user \'${agentEmail}\' as \'${developerAgentRole.name}\' to organization \'${developerOrganization.name}\'.`,
          )
          await knex('user_organization_memberships').insert({
            id: uuidv4(),
            user_id: existingAgentUser.id,
            organization_id: developerOrganization.id,
            role_id: developerAgentRole.id,
            created_at: new Date(),
            updated_at: new Date(),
          })
        } else {
          console.log(
            `User \'${agentEmail}\' already \'${developerAgentRole.name}\' in organization \'${developerOrganization.name}\'.`,
          )
        }
      } else {
        console.log(`Creating developer agent user: ${agentEmail}`)
        const agentUserId = uuidv4()
        const hashedAgentPassword = await hashPassword(`agentpassword${i}`) // Unique password for each agent

        // Insert agent user record
        const [newAgentUser] = await knex('users')
          .insert({
            id: agentUserId,
            first_name: `Agent ${i}`,
            last_name: 'Developer',
            email: agentEmail,
            phone_number: agentPhoneNumber,
            profile: `Seeded developer agent ${i} profile`,
            password: hashedAgentPassword,
            is_mfa_enabled: false,
            is_email_verified: false,
            is_phone_verified: false,
            is_default_password: true,
            role_id: developerAgentRole.id, // Link to the global AGENT role ID
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning('*')

        // Assign agent user to the Developer Organization with the DEVELOPER_AGENT organization role
        console.log(
          `Assigning user \'${newAgentUser.email}\' as \'${developerAgentRole.name}\' to organization \'${developerOrganization.name}\'.`,
        )
        await knex('user_organization_memberships').insert({
          id: uuidv4(),
          user_id: newAgentUser.id,
          organization_id: developerOrganization.id,
          role_id: developerAgentRole.id,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }
    }
    console.log(
      `${numberOfAgentsToSeed} developer agent users seeding process completed.`,
    )
  }

  // Final log message
  console.log(
    `Developer seeding process finished for organization \'${developerOrganization.name}\'.`,
  )
}

export default seed
