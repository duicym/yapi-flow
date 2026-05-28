// ============================================================
// @yapi-flow/generator - Public API
// ============================================================

// Engine
export { CodegenEngine } from './engine'
export type { GenerateOptions } from './engine'

// Normalizer
export {
  normalizeInterfaces,
  pathToName,
  inferType,
  parseJsonSchema,
} from './normalizer'
export type {
  NormalizedInterface,
  NormalizedParam,
  NormalizedField,
} from './normalizer'

// TypeScript generators
export { generate as generateTypeScript } from './languages/typescript'
export type { TypeScriptGenerateOptions } from './languages/typescript'
export {
  generateInterface,
  generateTypeDefinitions,
} from './languages/typescript/interface-generator'
export {
  generateAxiosClient,
  generateFetchClient,
} from './languages/typescript/client-generator'
