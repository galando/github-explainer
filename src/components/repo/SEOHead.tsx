import { useEffect } from 'react'

interface SEOHeadProps {
  title: string
  description?: string
  ogImage?: string
  canonicalUrl?: string
}

export function SEOHead({ title, description, ogImage, canonicalUrl }: SEOHeadProps) {
  useEffect(() => {
    document.title = title

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    if (description) {
      setMeta('description', description)
      setMeta('og:description', description, true)
      setMeta('twitter:description', description)
    }

    setMeta('og:title', title, true)
    setMeta('twitter:title', title)
    setMeta('twitter:card', 'summary_large_image')

    if (ogImage) {
      setMeta('og:image', ogImage, true)
      setMeta('twitter:image', ogImage)
    }

    if (canonicalUrl) {
      setMeta('og:url', canonicalUrl, true)
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = canonicalUrl
    }
  }, [title, description, ogImage, canonicalUrl])

  return null
}
