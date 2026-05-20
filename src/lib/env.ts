/**
 * Environment variable validation utility.
 *
 * Required env vars are validated at module import time.
 * If any are missing, a descriptive error is thrown immediately,
 * preventing silent failures at runtime.
 */

interface EnvVarSpec {
  name: string
  description: string
}

const REQUIRED_ENV_VARS: EnvVarSpec[] = [
  {
    name: 'MIMO_API_KEY',
    description: 'API key for the MIMO AI service (name generation, analysis, chat)',
  },
]

function validateEnvVars() {
  const missing: string[] = []

  for (const { name, description } of REQUIRED_ENV_VARS) {
    if (!process.env[name]) {
      missing.push(`${name} — ${description}`)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((m) => `  - ${m}`).join('\n')}\n\n` +
        `Please add these to your .env.local file. See .env.example for reference.`,
    )
  }
}

// Validate at module load time
validateEnvVars()

/**
 * Safely get a required environment variable.
 * Throws if the variable is not set.
 */
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Please add it to your .env.local file.`,
    )
  }
  return value
}
