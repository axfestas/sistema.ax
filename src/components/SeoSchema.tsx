'use client';

import { useEffect, useState } from 'react';

interface SiteSettings {
  company_name: string;
  company_description: string;
  phone: string;
  email: string;
  address: string;
  facebook_url?: string;
  instagram_url?: string;
  whatsapp_url?: string;
}

/**
 * Renders a JSON-LD LocalBusiness structured data script in the document head.
 * This helps Google (and other search engines) display up-to-date business info
 * such as phone number, address, and description in search results.
 *
 * Because this site is statically exported, the <title> and <meta name="description">
 * in the built HTML are hardcoded. This component also updates those tags dynamically
 * after loading settings, so Googlebot (which runs JavaScript) will index the
 * most recent values saved in Configurações.
 */
export default function SeoSchema() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: any) => {
        if (data && !data.error) {
          const s = data as SiteSettings;
          setSettings(s);

          // Dynamically update <title> and <meta name="description"> so that
          // search engines crawling with JS enabled pick up the live values.
          if (s.company_name) {
            document.title = s.company_description
              ? `${s.company_name} - ${s.company_description}`
              : s.company_name;

            const descMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
            if (descMeta) {
              descMeta.setAttribute('content', s.company_description || s.company_name);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!settings) return null;

  const sameAs: string[] = [];
  if (settings.facebook_url) sameAs.push(settings.facebook_url);
  if (settings.instagram_url) sameAs.push(settings.instagram_url);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: settings.company_name,
    description: settings.company_description,
    telephone: settings.phone,
    email: settings.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressCountry: 'BR',
    },
    url: typeof window !== 'undefined' ? window.location.origin : 'https://axfestas.com.br',
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
