import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);

  private readonly siteName = "VC'S Store";
  private readonly defaultDescription = 'Tu tienda de moda urbana. Descubre las últimas tendencias en ropa con estilo único y personalidad. Envíos a todo México.';

  update(data: SeoData): void {
    const fullTitle = `${data.title} | ${this.siteName}`;
    this.title.setTitle(fullTitle);

    const description = data.description || this.defaultDescription;

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: data.ogTitle || data.title });
    this.meta.updateTag({ property: 'og:description', content: data.ogDescription || description });
    this.meta.updateTag({ name: 'twitter:title', content: data.ogTitle || data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.ogDescription || description });

    if (data.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: data.ogImage });
      this.meta.updateTag({ name: 'twitter:image', content: data.ogImage });
    }

    if (data.ogUrl) {
      this.meta.updateTag({ property: 'og:url', content: data.ogUrl });
    }

    if (data.canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', data.canonicalUrl);
    }
  }

  setProductJsonLd(product: {
    name: string;
    description: string;
    image: string;
    price: number;
    currency?: string;
    availability: boolean;
    sku?: number;
  }): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'product-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'MXN',
        availability: product.availability
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
      sku: product.sku?.toString(),
    });
    this.removeProductJsonLd();
    document.head.appendChild(script);
  }

  removeProductJsonLd(): void {
    const existing = document.getElementById('product-jsonld');
    if (existing) existing.remove();
  }

  setBreadcrumbJsonLd(items: { name: string; url: string }[]): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'breadcrumb-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    });
    this.removeBreadcrumbJsonLd();
    document.head.appendChild(script);
  }

  removeBreadcrumbJsonLd(): void {
    const existing = document.getElementById('breadcrumb-jsonld');
    if (existing) existing.remove();
  }

  reset(): void {
    this.title.setTitle(this.siteName);
    this.meta.updateTag({ name: 'description', content: this.defaultDescription });
    this.meta.updateTag({ property: 'og:title', content: this.siteName });
    this.meta.updateTag({ property: 'og:description', content: this.defaultDescription });
    this.meta.updateTag({ name: 'twitter:title', content: this.siteName });
    this.meta.updateTag({ name: 'twitter:description', content: this.defaultDescription });
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('name="twitter:image"');
    this.meta.removeTag('property="og:url"');
    this.removeProductJsonLd();
    this.removeBreadcrumbJsonLd();
  }
}
