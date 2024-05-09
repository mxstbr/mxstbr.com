import { prodUrl } from 'app/sitemap'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
      },
    ],
    sitemap: `${prodUrl}/sitemap.xml`,
  }
}
