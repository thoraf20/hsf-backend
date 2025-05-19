// /dev/null/query_utils.ts
import { z } from 'zod'

// Utility function to parse an enum
export function parseEnum<T extends string>(
  enumObj: { [key: string]: T },
  value: string,
  fieldName: string,
): T {
  const enumValues = Object.values(enumObj)
  if (!enumValues.includes(value as T)) {
    throw new Error(
      `Invalid value for field ${fieldName}.  Allowed values are: ${enumValues.join(
        ', ',
      )}`,
    )
  }
  return value as T
}

// Utility function to create a number query parser
export function numberQuery(fieldName: string) {
  const validOperators = ['eq', 'ne', 'gt', 'lt', 'gte', 'lte']
  return (operator: string, value: string) => {
    if (!validOperators.includes(operator)) {
      throw new Error(
        `Invalid operator for number field ${fieldName}. Allowed operators are: ${validOperators.join(
          ', ',
        )}`,
      )
    }
    const numberValue = z.coerce.number().parse(value)
    return `${fieldName} ${operatorToSQL(operator)} ${numberValue}`
  }
}

// Utility function to create a string query parser
export function stringQuery(fieldName: string) {
  const validOperators = [
    'eq',
    'ne',
    'contains',
    'startsWith',
    'endsWith',
    'in',
  ]
  return (operator: string, value: string) => {
    if (!validOperators.includes(operator)) {
      throw new Error(
        `Invalid operator for string field ${fieldName}. Allowed operators are: ${validOperators.join(
          ', ',
        )}`,
      )
    }
    return `${fieldName} ${operatorToSQL(operator)} ${formatStringValue(value, operator)}`
  }
}

// Utility function to format a string value based on the operator
function formatStringValue(value: string, operator: string): string {
  switch (operator) {
    case 'contains':
      return `LIKE '%${value}%'`
    case 'startsWith':
      return `LIKE '${value}%'`
    case 'endsWith':
      return `LIKE '%${value}'`
    case 'eq':
    case 'ne':
      return `= '${value}'`
    case 'in':
      const values = value
        .split(',')
        .map((v: string) => `'${v.trim()}'`)
        .join(', ')
      return `IN (${values})`
    default:
      throw new Error(`Unsupported operator: ${operator}`)
  }
}

function operatorToSQL(operator: string): string {
  switch (operator) {
    case 'eq':
      return '='
    case 'ne':
      return '!='
    case 'gt':
      return '>'
    case 'lt':
      return '<'
    case 'gte':
      return '>='
    case 'lte':
      return '<='
    default:
      return operator
  }
}
