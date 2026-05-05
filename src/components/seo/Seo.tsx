import { useEffect } from 'react'
import { DEFAULT_SEO } from './seoConstants'

interface SeoProps {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
  ogType?: string
  jsonLd?: object | object[]
  noindex?: boolean
}

const SITE_URL = DEFAULT_SEO.siteUrl
const SITE_NAME = DEFAULT_SEO.siteName
const DEFAULT_DESCRIPTION = DEFAULT_SEO.description
const DEFAULT_OG_IMAGE = DEFAULT_SEO.ogImage

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function removeJsonLd() {
  document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove())
}

function injectJsonLd(data: object | object[]) {
  removeJsonLd()
  const items = Array.isArray(data) ? data : [data]
  items.forEach((item) => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-seo-jsonld', 'true')
    script.textContent = JSON.stringify(item)
    document.head.appendChild(script)
  })
}

export function Seo({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  jsonLd,
  noindex = false,
}: SeoProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
    document.title = fullTitle

    const desc = description ?? DEFAULT_DESCRIPTION
    const canon = canonical ?? SITE_URL + window.location.pathname

    setMeta('description', desc)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setLink('canonical', canon)

    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', desc, 'property')
    setMeta('og:image', ogImage ?? DEFAULT_OG_IMAGE, 'property')
    setMeta('og:url', canon, 'property')
    setMeta('og:type', ogType, 'property')
    setMeta('og:site_name', SITE_NAME, 'property')
    setMeta('og:locale', 'es_ES', 'property')

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle, 'property')
    setMeta('twitter:description', desc, 'property')
    setMeta('twitter:image', ogImage ?? DEFAULT_OG_IMAGE, 'property')

    if (jsonLd) injectJsonLd(jsonLd)

    return () => {
      if (jsonLd) removeJsonLd()
    }
  }, [title, description, canonical, ogImage, ogType, jsonLd, noindex])

  return null
}
