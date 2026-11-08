/**
 * Automatic SEO & Keyword Generation Engine for Products
 * Tailored for Krishna Electronics Order & Suppliers (Surkhet & Karnali Province, Nepal)
 */

export interface ProductSeoInput {
  title: string;
  brandName?: string | null;
  categoryName?: string | null;
  subcategoryName?: string | null;
  regularPrice?: number | null;
  offerPrice?: number | null;
  specifications?: Array<{ name: string; value: string }> | string | null;
  warranty?: string | null;
  shortDescription?: string | null;
  location?: string;
}

export interface ProductSeoResult {
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string;
  keywordsList: string[];
}

export function generateProductSeo(input: ProductSeoInput): ProductSeoResult {
  const title = (input.title || '').trim();
  const brand = (input.brandName || '').trim();
  const category = (input.categoryName || '').trim();
  const subcategory = (input.subcategoryName || '').trim();
  const warranty = (input.warranty || '').trim();
  const location = input.location || 'Birendranagar, Surkhet, Nepal';

  const effectivePrice = input.offerPrice && input.offerPrice < (input.regularPrice || 0)
    ? input.offerPrice
    : input.regularPrice;

  const priceText = effectivePrice ? `NPR ${effectivePrice.toLocaleString('en-IN')}` : 'Best Price';

  // 1. Generate High-CTR SEO Meta Title
  const brandPrefix = brand ? `${brand} ` : '';
  const metaTitle = `${title} | ${priceText} in Surkhet Nepal | Krishna Electronics`;

  // 2. Generate High-Converting Meta Description (150-160 characters ideal)
  let metaDescription = `Buy genuine ${title} at Krishna Electronics in ${location}. `;
  if (effectivePrice) {
    metaDescription += `Price: ${priceText}. `;
  }
  if (warranty) {
    metaDescription += `${warranty}. `;
  } else {
    metaDescription += `Official manufacturer warranty. `;
  }
  metaDescription += `Express delivery across Karnali Province, verified tech support & physical store pick-up in Birendranagar.`;
  if (metaDescription.length > 220) {
    metaDescription = metaDescription.slice(0, 217) + '...';
  }

  // 3. Extract keywords from specifications
  const specTerms: string[] = [];
  if (input.specifications) {
    try {
      const parsed = typeof input.specifications === 'string'
        ? JSON.parse(input.specifications)
        : input.specifications;
      if (Array.isArray(parsed)) {
        parsed.forEach((s: any) => {
          if (s.name && typeof s.name === 'string') specTerms.push(s.name.trim());
          if (s.value && typeof s.value === 'string' && s.value.length < 30) specTerms.push(s.value.trim());
        });
      }
    } catch (_) {}
  }

  // 4. Build comprehensive keyword list
  const keywordsSet = new Set<string>();

  // A. Product & Brand Exact Terms
  if (title) {
    keywordsSet.add(title.toLowerCase());
    keywordsSet.add(`${title.toLowerCase()} nepal`);
    keywordsSet.add(`${title.toLowerCase()} surkhet`);
    keywordsSet.add(`${title.toLowerCase()} price`);
    keywordsSet.add(`${title.toLowerCase()} price in nepal`);
  }
  if (brand) {
    keywordsSet.add(brand.toLowerCase());
    keywordsSet.add(`${brand.toLowerCase()} nepal`);
    keywordsSet.add(`${brand.toLowerCase()} surkhet`);
    keywordsSet.add(`${brand.toLowerCase()} store surkhet`);
    if (category) keywordsSet.add(`${brand.toLowerCase()} ${category.toLowerCase()}`);
  }

  // B. Category & Subcategory Terms
  if (category) {
    keywordsSet.add(category.toLowerCase());
    keywordsSet.add(`${category.toLowerCase()} surkhet`);
    keywordsSet.add(`${category.toLowerCase()} nepal`);
    keywordsSet.add(`buy ${category.toLowerCase()} in surkhet`);
  }
  if (subcategory) {
    keywordsSet.add(subcategory.toLowerCase());
    keywordsSet.add(`${subcategory.toLowerCase()} nepal`);
  }

  // C. Local Geographic & Regional Search Terms
  keywordsSet.add('electronics in surkhet');
  keywordsSet.add('krishna electronics surkhet');
  keywordsSet.add('krishna electronics order and suppliers');
  keywordsSet.add('birendranagar electronics shop');
  keywordsSet.add('karnali province electronics store');
  keywordsSet.add('surkhet computer & electronics store');
  keywordsSet.add('surkhet valley hardware order');

  // D. Intent & Commercial Buying Terms
  keywordsSet.add('genuine warranty nepal');
  keywordsSet.add('best price in surkhet');
  keywordsSet.add('cash on delivery surkhet');
  keywordsSet.add('fast delivery karnali');
  keywordsSet.add('buy online surkhet');
  if (effectivePrice) {
    keywordsSet.add(`npr ${effectivePrice}`);
  }

  // E. Technical Specs & Related Service Terms
  specTerms.slice(0, 10).forEach((t) => {
    if (t.length > 2) keywordsSet.add(t.toLowerCase());
  });

  keywordsSet.add('repair & maintenance surkhet');
  keywordsSet.add('technical support surkhet');

  const keywordsList = Array.from(keywordsSet);
  const seoKeywords = keywordsList.join(', ');

  return {
    metaTitle,
    metaDescription,
    seoKeywords,
    keywordsList,
  };
}
