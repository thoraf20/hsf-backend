import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Enable Row Level Security
  await knex.raw('ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;')

  // Create function to check organization type unchanged
  await knex.raw(`
    CREATE OR REPLACE FUNCTION is_organization_type_unchanged()
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN (OLD.type IS NOT DISTINCT FROM NEW.type);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `)

  // Create function to check HSF_INTERNAL uniqueness
  await knex.raw(`
    CREATE OR REPLACE FUNCTION check_hsf_internal_unique()
    RETURNS BOOLEAN AS $$
    BEGIN
      IF NEW.type = 'HSF_INTERNAL' THEN
        RETURN NOT EXISTS (SELECT 1 FROM organizations WHERE type = 'HSF_INTERNAL');
      END IF;
      RETURN true;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `)

  // Drop existing policies if they exist
  await knex.raw(
    'DROP POLICY IF EXISTS prevent_organization_type_update ON organizations;',
  )
  await knex.raw(
    'DROP POLICY IF EXISTS prevent_multiple_hsf_internal ON organizations;',
  )

  // Create update policy with proper reference to NEW/OLD
  await knex.raw(`
    CREATE POLICY prevent_organization_type_update ON organizations
    FOR UPDATE
    USING (true)
    WITH CHECK (is_organization_type_unchanged());
  `)

  // Create insert policy with proper logic
  await knex.raw(`
    CREATE POLICY prevent_multiple_hsf_internal ON organizations
    FOR INSERT
    WITH CHECK (check_hsf_internal_unique());
  `)

  // Create triggers as backup for superuser bypass
  await knex.raw(`
    CREATE OR REPLACE FUNCTION enforce_organization_policies()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'UPDATE' AND NEW.type IS DISTINCT FROM OLD.type THEN
        RAISE EXCEPTION 'Organization type cannot be changed';
      ELSIF TG_OP = 'INSERT' AND NEW.type = 'HSF_INTERNAL' AND
            EXISTS (SELECT 1 FROM organizations WHERE type = 'HSF_INTERNAL') THEN
        RAISE EXCEPTION 'Only one HSF_INTERNAL organization allowed';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS organization_policies_trigger ON organizations;
    CREATE TRIGGER organization_policies_trigger
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION enforce_organization_policies();
  `)
}

export async function down(knex: Knex): Promise<void> {
  // Drop trigger
  await knex.raw(
    'DROP TRIGGER IF EXISTS organization_policies_trigger ON organizations;',
  )

  // Drop functions
  await knex.raw('DROP FUNCTION IF EXISTS enforce_organization_policies();')
  await knex.raw('DROP FUNCTION IF EXISTS is_organization_type_unchanged();')
  await knex.raw('DROP FUNCTION IF EXISTS check_hsf_internal_unique();')

  // Drop policies
  await knex.raw(
    'DROP POLICY IF EXISTS prevent_organization_type_update ON organizations;',
  )
  await knex.raw(
    'DROP POLICY IF EXISTS prevent_multiple_hsf_internal ON organizations;',
  )
}
