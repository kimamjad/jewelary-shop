export const ENV = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
} as const

export function getEnvVar(key: string): string | undefined {
  return import.meta.env[key] as string | undefined
}
