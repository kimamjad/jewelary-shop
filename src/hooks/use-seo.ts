import { useEffect } from "react"

// ============================================================
// SEO Meta Tag Management
// ============================================================

interface SEOOptions {
  title?: string
  description?: string
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: "website" | "article" | "product"
  ogUrl?: string
  twitterCard?: "summary" | "summary_large_image"
  noindex?: boolean
  keywords?: string
  structuredData?: Record<string, unknown> | Record<string, unknown>[]
}

function upsertMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement("link")
    el.setAttribute("rel", rel)
    document.head.appendChild(el)
  }
  el.setAttribute("href", href)
}

function upsertScript(id: string, content: Record<string, unknown> | Record<string, unknown>[]) {
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`)
  if (!el) {
    el = document.createElement("script")
    el.setAttribute("type", "application/ld+json")
    el.setAttribute("data-seo-id", id)
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(content)
}

function removeScript(id: string) {
  const el = document.head.querySelector(`script[data-seo-id="${id}"]`)
  if (el) el.remove()
}

const SITE_NAME = "جواهرات لوکس"
const DEFAULT_DESCRIPTION = "فروشگاه آنلاین جواهرات و سنگ‌های قیمتی"

export function useSEO(options: SEOOptions) {
  useEffect(() => {
    const {
      title,
      description = DEFAULT_DESCRIPTION,
      canonical,
      ogTitle = title,
      ogDescription = description,
      ogImage,
      ogType = "website",
      ogUrl = canonical,
      twitterCard = "summary_large_image",
      noindex = false,
      keywords,
      structuredData,
    } = options

    if (title) {
      document.title = `${title} | ${SITE_NAME}`
    }

    upsertMeta("description", description)
    if (keywords) upsertMeta("keywords", keywords)
    if (noindex) {
      upsertMeta("robots", "noindex, nofollow")
    } else {
      upsertMeta("robots", "index, follow")
    }

    // Canonical
    if (canonical) {
      upsertLink("canonical", canonical)
    }

    // Open Graph
    upsertMeta("og:site_name", SITE_NAME, "property")
    if (ogTitle) upsertMeta("og:title", ogTitle, "property")
    if (ogDescription) upsertMeta("og:description", ogDescription, "property")
    if (ogImage) upsertMeta("og:image", ogImage, "property")
    upsertMeta("og:type", ogType, "property")
    if (ogUrl) upsertMeta("og:url", ogUrl, "property")
    upsertMeta("og:locale", "fa_IR", "property")

    // Twitter
    upsertMeta("twitter:card", twitterCard)
    if (ogTitle) upsertMeta("twitter:title", ogTitle)
    if (ogDescription) upsertMeta("twitter:description", ogDescription)
    if (ogImage) upsertMeta("twitter:image", ogImage)

    // Structured data
    if (structuredData) {
      const id = Array.isArray(structuredData) ? "multi" : "page"
      if (Array.isArray(structuredData)) {
        upsertScript(id, structuredData)
      } else {
        upsertScript(id, structuredData)
      }
    }

    return () => {
      removeScript("page")
      removeScript("multi")
    }
  }, [options])
}

// ============================================================
// Structured Data Builders
// ============================================================

export function buildBreadcrumbStructuredData(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildProductStructuredData(params: {
  name: string
  description: string
  image?: string
  sku: string
  price: number
  currency?: string
  availability: "InStock" | "OutOfStock"
  brand?: string
  category?: string
  url: string
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: params.name,
    description: params.description,
    image: params.image ?? undefined,
    sku: params.sku,
    brand: params.brand ? { "@type": "Brand", name: params.brand } : undefined,
    category: params.category,
    url: params.url,
    offers: {
      "@type": "Offer",
      price: params.price,
      priceCurrency: params.currency ?? "IRR",
      availability: `https://schema.org/${params.availability}`,
    },
  }
}

export function buildArticleStructuredData(params: {
  title: string
  description: string
  image?: string
  author: string
  datePublished: string
  url: string
  section?: string
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.title,
    description: params.description,
    image: params.image ?? undefined,
    author: { "@type": "Person", name: params.author },
    datePublished: params.datePublished,
    dateModified: params.datePublished,
    url: params.url,
    publisher: { "@type": "Organization", name: SITE_NAME },
    articleSection: params.section,
    inLanguage: "fa-IR",
  }
}

export function buildWebsiteStructuredData(url: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    inLanguage: "fa-IR",
  }
}
