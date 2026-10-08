import { supabase } from "@/lib/supabase"

export interface TorobSettings {
  enabled: boolean
  siteUrl: string
  apiEndpoint: string
  lastSyncAt: string | null
  productCount: number | null
}

export async function fetchTorobSettings(): Promise<TorobSettings> {
  const { data, error } = await supabase
    .from("torob_settings")
    .select("key, value")

  if (error) throw error

  const settingsMap = new Map<string, unknown>()
  for (const row of data ?? []) {
    settingsMap.set(row.key, row.value)
  }

  return {
    enabled: settingsMap.get("enabled") === true,
    siteUrl: (settingsMap.get("site_url") as string) ?? "",
    apiEndpoint: (settingsMap.get("api_endpoint") as string) ?? "",
    lastSyncAt: (settingsMap.get("last_sync_at") as string) ?? null,
    productCount: (settingsMap.get("product_count") as number) ?? null,
  }
}

export async function updateTorobSettings(settings: Partial<TorobSettings>): Promise<void> {
  const entries: { key: string; value: unknown }[] = []

  if (settings.enabled !== undefined) {
    entries.push({ key: "enabled", value: settings.enabled })
  }
  if (settings.siteUrl !== undefined) {
    entries.push({ key: "site_url", value: settings.siteUrl })
  }
  if (settings.apiEndpoint !== undefined) {
    entries.push({ key: "api_endpoint", value: settings.apiEndpoint })
  }

  for (const entry of entries) {
    const { error } = await supabase
      .from("torob_settings")
      .upsert({ key: entry.key, value: entry.value, updated_at: new Date().toISOString() })
    if (error) throw error
  }
}

export async function testTorobConnection(siteUrl: string): Promise<{
  success: boolean
  productCount?: number
  error?: string
}> {
  try {
    const apiUrl = `${siteUrl}/torob_api/v3/products`
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: 1, sort: "date_added_desc" }),
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const data = await response.json()
    if (data.api_version !== "torob_api_v3") {
      return { success: false, error: "Invalid API version in response" }
    }

    return { success: true, productCount: data.total ?? 0 }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
