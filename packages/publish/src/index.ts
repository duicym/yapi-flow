import type {
  YApiConfig,
  PublishConfig,
  YApiImportResult,
  Logger,
  YApiCategory,
} from '@yapi-flow/shared'
import { logger as defaultLogger } from '@yapi-flow/shared'
import { YApiClient } from './yapi-client'
import { validateSwagger, diffSummary } from './merger'

/**
 * Publish a Swagger/OpenAPI specification to YApi.
 *
 * Workflow:
 * 1. Parse the Swagger JSON (string or object)
 * 2. Validate the spec structure
 * 3. Snapshot existing YApi state via listMenu
 * 4. Import the spec into YApi using the configured merge strategy
 * 5. Snapshot new YApi state and show diff
 * 6. Return the import result
 */
export async function publishToYApi(
  config: YApiConfig & PublishConfig,
  swaggerJson: string | object,
  log?: Logger,
): Promise<YApiImportResult> {
  const _log = log ?? defaultLogger

  // Step 1: Parse swaggerJson if it's a string
  let spec: any
  if (typeof swaggerJson === 'string') {
    try {
      spec = JSON.parse(swaggerJson)
    } catch (e: any) {
      _log.error('Failed to parse Swagger JSON:', e.message)
      return { errcode: -1, errmsg: `Invalid JSON: ${e.message}` }
    }
  } else {
    spec = swaggerJson
  }

  // Step 2: Validate the spec
  _log.info('Validating Swagger specification...')
  const validation = validateSwagger(spec)
  if (!validation.valid) {
    _log.error('Validation failed:')
    for (const err of validation.errors) {
      _log.error(`  - ${err}`)
    }
    return {
      errcode: -1,
      errmsg: `Validation failed: ${validation.errors.join('; ')}`,
    }
  }
  _log.info('Validation passed.')

  // Step 3: Create client and snapshot existing state
  const client = new YApiClient(config.serverUrl, config.token)

  let beforeCategories: YApiCategory[] = []
  try {
    _log.info('Fetching existing YApi state...')
    const beforeRes = await client.listMenu(config.projectId)
    if (beforeRes.errcode === 0 && Array.isArray(beforeRes.data)) {
      beforeCategories = beforeRes.data
    }
  } catch (e: any) {
    _log.warn('Could not fetch before state:', e.message)
  }

  // Step 4: Import the spec
  _log.info(`Publishing to YApi (merge: ${config.mergeStrategy})...`)
  const jsonString = JSON.stringify(spec)

  let result: YApiImportResult
  try {
    result = await client.importData({
      type: 'swagger',
      merge: config.mergeStrategy,
      json: jsonString,
    })
  } catch (e: any) {
    _log.error('Import failed:', e.message)
    return { errcode: -1, errmsg: `Import failed: ${e.message}` }
  }

  if (result.errcode !== 0) {
    _log.error(`YApi import error: ${result.errmsg}`)
    return result
  }

  _log.info('Import completed successfully.')

  // Step 5: Snapshot new state and show diff
  try {
    _log.info('Fetching updated YApi state...')
    const afterRes = await client.listMenu(config.projectId)
    if (afterRes.errcode === 0 && Array.isArray(afterRes.data)) {
      const diff = diffSummary(beforeCategories, afterRes.data)
      _log.info(diff)
    }
  } catch (e: any) {
    _log.warn('Could not compute diff:', e.message)
  }

  return result
}

// Re-export for consumers
export { YApiClient } from './yapi-client'
export { validateSwagger, diffSummary } from './merger'
