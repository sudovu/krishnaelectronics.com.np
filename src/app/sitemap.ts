import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { krishnaElectronicsManifest } from '@/business/krishna-electronics/manifest';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://krishnaelectronics.com.np';
  const now = new Date();

  // 1. Static Core Marketing & Informational Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/offers`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/policies/warranty-and-returns`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/policies/privacy-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/policies/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Dynamic Product Pages
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    });

    if (products.length > 0) {
      productRoutes = products.map((p) => ({
        url: `${baseUrl}/products/${p.slug}`,
        lastModified: p.updatedAt || now,
        changeFrequency: 'weekly',
        priority: 0.85,
      }));
    } else {
      // Fallback from declarative manifest
      productRoutes = krishnaElectronicsManifest.products.map((p) => ({
        url: `${baseUrl}/products/${p.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.85,
      }));
    }
  } catch (_) {
    productRoutes = krishnaElectronicsManifest.products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    }));
  }

  // 3. Dynamic Service Pages
  let serviceRoutes: MetadataRoute.Sitemap = [];
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    if (services.length > 0) {
      serviceRoutes = services.map((s) => ({
        url: `${baseUrl}/services/${s.slug}`,
        lastModified: s.updatedAt || now,
        changeFrequency: 'monthly',
        priority: 0.8,
      }));
    } else {
      serviceRoutes = krishnaElectronicsManifest.services.map((s) => ({
        url: `${baseUrl}/services/${s.slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.8,
      }));
    }
  } catch (_) {
    serviceRoutes = krishnaElectronicsManifest.services.map((s) => ({
      url: `${baseUrl}/services/${s.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    }));
  }

  // 4. Product Category Filters
  const categoryRoutes: MetadataRoute.Sitemap = krishnaElectronicsManifest.categories.map((cat) => ({
    url: `${baseUrl}/products?category=${cat.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...serviceRoutes];
}
