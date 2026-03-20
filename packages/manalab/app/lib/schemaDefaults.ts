import type { SchemaField, EntitySchema, Entity } from '../state/types'
import { generateId } from './idGen'

export function getFieldDefault(fieldDef: SchemaField): unknown {
  if (fieldDef.default !== undefined) return JSON.parse(JSON.stringify(fieldDef.default))

  switch (fieldDef.type) {
    case 'vec3': return [0, 0, 0]
    case 'number': return 0
    case 'string': return ''
    case 'richtext': return ''
    case 'boolean': return false
    case 'enum': return fieldDef.options[0] || ''
    case 'assetRef': return ''
    case 'ref': return null
    case 'ref[]': return []
    case 'enum[]': return []
    case 'object': {
      const obj: Record<string, unknown> = {}
      for (const [key, subField] of Object.entries(fieldDef.fields)) {
        obj[key] = getFieldDefault(subField)
      }
      return obj
    }
    case 'array': return []
    default: return null
  }
}

export function buildDefaultEntity(schema: EntitySchema): Entity {
  const entity: Entity = { id: generateId() }
  for (const [key, fieldDef] of Object.entries(schema)) {
    entity[key] = getFieldDefault(fieldDef)
  }
  return entity
}

export function buildArrayItemDefault(fieldDef: SchemaField & { type: 'array' }): Record<string, unknown> {
  const item: Record<string, unknown> = {}
  for (const [key, subField] of Object.entries(fieldDef.itemFields)) {
    item[key] = getFieldDefault(subField)
  }
  return item
}
