/**
 * Entry point for the template library.
 * Replace or extend these exports when starting a real package.
 */

export interface LibraryMetadata {
  name: string
  version: string
  description?: string
}

export interface HealthStatus {
  ok: boolean
  message: string
  timestamp: string
}

/**
 * Returns a deterministic health payload useful for smoke tests and examples.
 */
export const getHealthStatus = (message = 'library-ready'): HealthStatus => {
  return {
    ok: true,
    message,
    timestamp: new Date().toISOString()
  }
}

/**
 * Creates a metadata object for consumers and documentation examples.
 */
export const createLibraryMetadata = (name: string, version: string, description?: string): LibraryMetadata => {
  return {
    name,
    version,
    description
  }
}
