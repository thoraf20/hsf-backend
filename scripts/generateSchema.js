// TODO: 
// import fs from 'fs'
// interface FieldConfig {
//   type: string
//   primary?: boolean
//   notNullable?: boolean
//   nullable?: boolean
//   defaultTo?: string
//   references?: { table: string; column: string }
// }
// export interface EntitySchema {
//   className: string
//   tableName: string
//   fields: Record<string, FieldConfig>
// }
// export function generateKnexTableCode(entity: EntitySchema): string {
//   let code = `export async function up(knex) {
//   return knex.schema.createTable('${entity.tableName}', function (table) {\n`
//   for (const [field, config] of Object.entries(entity.fields)) {
//     let line = `    table.${config.type}('${field}')`
//     if (config.primary) line += '.primary()'
//     if (config.notNullable) line += '.notNullable()'
//     if (config.nullable) line += '.nullable()'
//     if (config.defaultTo === 'now') line += `.defaultTo(knex.fn.now())`
//     if (config.references) {
//       line += `.references('${config.references.column}').inTable('${config.references.table}')`
//     }
//     line += '\n'
//     code += line
//   }
//   code += `  })
// }
// export async function down(knex) {
//   return knex.schema.dropTableIfExists('${entity.tableName}')
// }
// `
//   return code
// }
// export function injectSchemaIntoMigration(filePath: string, entity: EntitySchema) {
//   const code = generateKnexTableCode(entity)
//   fs.writeFileSync(filePath, code)
//   console.log(`✅ Injected schema for '${entity.className}' → table '${entity.tableName}' into ${filePath}`)
// }
