const API_BASE = 'http://localhost:8080/api';

export interface SearchProductItem {
  id: string | number;
  externalProductId?: number;
  name: string;
  slug: string;
  description?: string;
  gender: string;
  masterCategory: string;
  subCategory?: string;
  articleType: string;
  baseColour: string;
  season?: string;
  releaseYear?: number;
  usageCategory?: string;
  basePrice: number;
  compareAtPrice?: number;
  imageUrl: string;
  images: string[];
  availableSizes: string[];
  inventory: number;
  badge?: string | null;
  status: string;
}

export interface SearchResponseData {
  content: SearchProductItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  fallback: boolean;
  correctedQuery?: string | null;
}

export interface SearchParams {
  q?: string;
  gender?: string;
  masterCategory?: string;
  subCategory?: string;
  articleType?: string;
  baseColour?: string;
  usage?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export async function searchProductsApi(params: SearchParams): Promise<SearchResponseData> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.gender && params.gender !== 'ALL') query.set('gender', params.gender);
  if (params.masterCategory && params.masterCategory !== 'ALL') query.set('masterCategory', params.masterCategory);
  if (params.subCategory && params.subCategory !== 'ALL') query.set('subCategory', params.subCategory);
  if (params.articleType && params.articleType !== 'ALL') query.set('articleType', params.articleType);
  if (params.baseColour && params.baseColour !== 'ALL') query.set('baseColour', params.baseColour);
  if (params.usage && params.usage !== 'ALL') query.set('usage', params.usage);
  if (params.minPrice) query.set('minPrice', params.minPrice.toString());
  if (params.maxPrice) query.set('maxPrice', params.maxPrice.toString());
  if (params.page !== undefined) query.set('page', params.page.toString());
  if (params.size !== undefined) query.set('size', params.size.toString());
  if (params.sort) query.set('sort', params.sort);

  const res = await fetch(`${API_BASE}/products/search?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Search request failed with status ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function getSearchSuggestionsApi(q: string): Promise<string[]> {
  if (!q || q.trim().length < 2) return [];
  const res = await fetch(`${API_BASE}/products/search/suggestions?q=${encodeURIComponent(q.trim())}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}
