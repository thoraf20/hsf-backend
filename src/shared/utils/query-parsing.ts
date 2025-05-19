import { z } from 'zod'

const QueryParamSchema = z.object({
  field: z.string(),
  operator: z.enum([
    'eq',
    'ne',
    'gt',
    'lt',
    'gte',
    'lte',
    'contains',
    'startsWith',
    'endsWith',
    'in',
  ]),
  value: z.any(),
})

const QuerySchema = z.array(QueryParamSchema)

export function parseQueryString(
  queryString: string,
): z.infer<typeof QuerySchema> {
  const params = queryString.split('&')
  const parsedParams = params.map((param) => {
    const [key, value] = param.split('=')
    const [field, operator] = key.split('~')

    let actualOperator = operator || 'eq'

    return {
      field: field,
      operator: actualOperator,
      value: value,
    }
  })

  const validatedParams = QuerySchema.parse(parsedParams)
  return validatedParams
}

export function translateToSQL(
  parsedQuery: z.infer<typeof QuerySchema>,
  tableName: string,
): string {
  const whereClauses: string[] = []

  for (const param of parsedQuery) {
    let sqlOperator: string
    let sqlValue: string

    switch (param.operator) {
      case 'eq':
        sqlOperator = '='
        sqlValue =
          typeof param.value === 'string'
            ? `'${param.value}'`
            : param.value.toString()
        break
      case 'ne':
        sqlOperator = '!='
        sqlValue =
          typeof param.value === 'string'
            ? `'${param.value}'`
            : param.value.toString()
        break
      case 'gt':
        sqlOperator = '>'
        sqlValue =
          typeof param.value === 'string'
            ? `'${param.value}'`
            : param.value.toString()
        break
      case 'lt':
        sqlOperator = '<'
        sqlValue =
          typeof param.value === 'string'
            ? `'${param.value}'`
            : param.value.toString()
        break
      case 'gte':
        sqlOperator = '>='
        sqlValue =
          typeof param.value === 'string'
            ? `'${param.value}'`
            : param.value.toString()
        break
      case 'lte':
        sqlOperator = '<='
        sqlValue =
          typeof param.value === 'string'
            ? `'${param.value}'`
            : param.value.toString()
        break
      case 'contains':
        sqlOperator = 'LIKE'
        sqlValue = `'%${param.value}%'`
        break
      case 'startsWith':
        sqlOperator = 'LIKE'
        sqlValue = `'${param.value}%'`
        break
      case 'endsWith':
        sqlOperator = 'LIKE'
        sqlValue = `'%${param.value}'`
        break
      case 'in':
        const values = param.value
          .split(',')
          .map((v: string) => `'${v.trim()}'`)
          .join(', ')
        sqlOperator = 'IN'
        sqlValue = `(${values})`
        break
      default:
        throw new Error(`Unsupported operator: ${param.operator}`)
    }

    whereClauses.push(`${param.field} ${sqlOperator} ${sqlValue}`)
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
  return `SELECT * FROM ${tableName} ${whereClause}`
}
