/**
 * Appels API publics avec repli automatique vers Vercel si le proxy
 * WordPress (/api) renvoie 403 (comportement connu sur obrille.com).
 */
const PROXY_API_URL = import.meta.env.VITE_API_URL || '/api';
const DIRECT_API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

export interface PublicProduct {
  id: number;
  code: string;
  nom?: string;
  description?: string;
  prixUnitaire?: number;
  prix2Unites?: number;
  prix3Unites?: number;
  imageUrl?: string | null;
}

async function fetchPublic(path: string, init?: RequestInit): Promise<Response> {
  const bases = [PROXY_API_URL, DIRECT_API_URL];
  let lastRes: Response | null = null;
  for (const base of bases) {
    const res = await fetch(`${base}${path}`, init);
    lastRes = res;
    if (res.status !== 403) return res;
  }
  return lastRes!;
}

export async function getPublicProducts(company: string): Promise<PublicProduct[]> {
  const q = `?company=${encodeURIComponent(company)}`;
  const res = await fetchPublic(`/public/products${q}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`GET /public/products -> ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data?.products) ? data.products : [];
}

export async function postPublicOrder(payload: Record<string, unknown>): Promise<{ data: any; status: number }> {
  const body = JSON.stringify(payload);
  const res = await fetchPublic('/public/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const err: any = new Error(typeof data === 'object' && data?.error ? data.error : `HTTP ${res.status}`);
    err.response = { status: res.status, data };
    throw err;
  }
  return { data, status: res.status };
}
