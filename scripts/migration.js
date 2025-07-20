// TODO:
// import { execSync } from 'child_process'
// import { existsSync } from 'fs'
// import { resolve } from 'path'
// import { injectSchemaIntoMigration } from './generateSchema.js'
// import fs from 'fs';
// import path from 'path';

// import { UserTestSchemaMap } from './schemaMaps/UserTestSchemaMap.js'

// const entity = UserTestSchemaMap
// const migrationName = `create_${entity.tableName}_table`


// if (!/^[a-zA-Z0-9_-]+$/.test(migrationName)) {
//   console.error(
//     '❌ Invalid migration name. Use only letters, numbers, underscores, or hyphens.',
//   )
//   process.exit(1)
// }

// const migrationsDir = resolve('database/migrations')
// const knexfilePath = resolve('database/knexfile.ts')

// if (!existsSync(knexfilePath)) {
//   console.error(`❌ knexfile.ts not found at: ${knexfilePath}`)
//   process.exit(1)
// }

// const before = fs.readdirSync(migrationsDir);

// const command = `npx knex migrate:make ${migrationName} --knexfile=${knexfilePath}`

// console.log(`🚀 Creating migration: ${migrationName}`)
// execSync(command, { stdio: 'inherit' })

// const after = fs.readdirSync(migrationsDir)
// const newFile = after.find((f) => !before.includes(f))

// if (!newFile) {
//   console.error('❌ Could not find newly created migration file.')
//   process.exit(1)
// }

// const filePath = path.join(migrationsDir, newFile)
// injectSchemaIntoMigration(filePath, entity)



import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'

const userInput = process.argv[2]

// Generate a fallback name using timestamp if none is provided
const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
const migrationName = userInput?.trim() || `migration_${timestamp}`

if (!/^[a-zA-Z0-9_-]+$/.test(migrationName)) {
  console.error('❌ Invalid migration name. Use only letters, numbers, underscores, or hyphens.')
  process.exit(1)
}

const knexfilePath = resolve('database/knexfile.ts')
if (!existsSync(knexfilePath)) {
  console.error(`❌ knexfile.ts not found at: ${knexfilePath}`)
  process.exit(1)
}

const command = `npx knex migrate:make ${migrationName} --knexfile=${knexfilePath}`

console.log(`🚀 Creating migration: ${migrationName}`)
execSync(command, { stdio: 'inherit' })
