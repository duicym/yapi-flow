import type { YApiCategory } from '@yapi-flow/shared'

interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate a Swagger/OpenAPI specification object.
 * Checks for required top-level fields and basic structure.
 */
export function validateSwagger(spec: any): ValidationResult {
  const errors: string[] = []

  if (!spec) {
    return { valid: false, errors: ['Specification is null or undefined'] }
  }

  if (typeof spec !== 'object') {
    return {
      valid: false,
      errors: ['Specification must be an object'],
    }
  }

  // Check required field: openapi
  if (!spec.openapi) {
    errors.push('Missing required field: openapi')
  }

  // Check required field: info
  if (!spec.info || typeof spec.info !== 'object') {
    errors.push('Missing required field: info')
  }

  // Check required field: paths
  if (!spec.paths || typeof spec.paths !== 'object') {
    errors.push('Missing required field: paths')
  } else {
    const pathKeys = Object.keys(spec.paths)
    if (pathKeys.length === 0) {
      errors.push('No paths defined in spec')
    }

    // Validate each operation has method and summary
    for (const [pathUrl, pathItem] of Object.entries(
      spec.paths as Record<string, any>,
    )) {
      if (!pathItem || typeof pathItem !== 'object') {
        errors.push(`Invalid path item at "${pathUrl}": must be an object`)
        continue
      }

      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']
      let hasOperation = false
      for (const method of methods) {
        const operation = (pathItem as any)[method]
        if (operation === undefined) continue
        hasOperation = true

        if (typeof operation.summary !== 'string' && typeof operation.description !== 'string') {
          errors.push(
            `Operation ${method.toUpperCase()} "${pathUrl}" missing summary/description`,
          )
        }
      }

      if (!hasOperation) {
        // Check for parameters (no-operation path items are valid in OpenAPI)
        if (!(pathItem as any).parameters) {
          errors.push(`Path "${pathUrl}" has no valid HTTP operation`)
        }
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Compare two category snapshots and produce a human-readable diff summary.
 */
export function diffSummary(
  before: YApiCategory[],
  after: YApiCategory[],
): string {
  const lines: string[] = []
  const indent = '  '

  // Build maps for lookup
  const beforeByName = new Map<string, YApiCategory>()
  for (const cat of before) {
    beforeByName.set(cat.name, cat)
  }

  const afterByName = new Map<string, YApiCategory>()
  for (const cat of after) {
    afterByName.set(cat.name, cat)
  }

  const allNames = new Set([...beforeByName.keys(), ...afterByName.keys()])

  let totalAdded = 0
  let totalRemoved = 0
  let totalModified = 0

  for (const name of allNames) {
    const beforeCat = beforeByName.get(name)
    const afterCat = afterByName.get(name)

    if (!beforeCat && afterCat) {
      // Category added
      const count = afterCat.list?.length ?? 0
      lines.push(`+ ${name} (${count} interfaces) — new category`)
      totalAdded += count
    } else if (beforeCat && !afterCat) {
      // Category removed
      const count = beforeCat.list?.length ?? 0
      lines.push(`- ${name} (${count} interfaces) — category removed`)
      totalRemoved += count
    } else if (beforeCat && afterCat) {
      // Compare interfaces
      const beforeCount = beforeCat.list?.length ?? 0
      const afterCount = afterCat.list?.length ?? 0

      if (beforeCount !== afterCount) {
        const diff = afterCount - beforeCount
        const sign = diff > 0 ? '+' : ''
        lines.push(
          `${indent}${name}: ${beforeCount} → ${afterCount} (${sign}${diff})`,
        )

        if (diff > 0) totalAdded += diff
        else totalRemoved += Math.abs(diff)
      }

      // Check for modified interfaces by title
      const beforeInterfaces = new Map(
        (beforeCat.list ?? []).map((i) => [i.title, i]),
      )
      const afterInterfaces = new Map(
        (afterCat.list ?? []).map((i) => [i.title, i]),
      )

      let modifiedInCat = 0
      for (const [title, beforeIface] of beforeInterfaces) {
        const afterIface = afterInterfaces.get(title)
        if (afterIface && beforeIface.up_time !== afterIface.up_time) {
          modifiedInCat++
        }
      }

      if (modifiedInCat > 0) {
        lines.push(
          `${indent}${indent}${modifiedInCat} interface(s) modified in ${name}`,
        )
        totalModified += modifiedInCat
      }
    }
  }

  // Build summary header
  const header: string[] = []
  header.push('=== Publish Diff ===')
  if (lines.length === 0) {
    header.push('  No changes detected.')
  } else {
    header.push(`  Added: ${totalAdded}, Removed: ${totalRemoved}, Modified: ${totalModified}`)
  }

  return [...header, ...lines].join('\n')
}
