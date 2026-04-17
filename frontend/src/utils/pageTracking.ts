import axios from 'axios';

const API_URL = '/api';
const VISITOR_KEY = 'gs_visitor_id';
const SESSION_KEY = 'gs_session_id';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const VIEWED_SLUGS_KEY = 'gs_viewed_slugs';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 12);
}

function getOrCreateVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

function getOrCreateSessionId(): { sessionId: string; isNewSession: boolean } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const now = Date.now();
    if (raw) {
      const { id, lastActivity } = JSON.parse(raw);
      if (now - lastActivity < SESSION_TIMEOUT) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, lastActivity: now }));
        return { sessionId: id, isNewSession: false };
      }
    }
    const newId = generateId();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: newId, lastActivity: now }));
    return { sessionId: newId, isNewSession: true };
  } catch {
    return { sessionId: generateId(), isNewSession: true };
  }
}

function isFirstViewOfSlug(slug: string): boolean {
  try {
    const raw = localStorage.getItem(VIEWED_SLUGS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (list.includes(slug)) return false;
    list.push(slug);
    localStorage.setItem(VIEWED_SLUGS_KEY, JSON.stringify(list.slice(-50)));
    return true;
  } catch {
    return true;
  }
}

function getQueryParam(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

export function trackPageView(slug: string, company?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const visitorId = getOrCreateVisitorId();
    const { sessionId, isNewSession } = getOrCreateSessionId();
    const isUnique = isFirstViewOfSlug(slug);

    const co = company || getQueryParam('company') || 'ci';

    axios.post(`${API_URL}/public/pageview`, {
      slug,
      path: window.location.pathname + window.location.search,
      company: co,
      visitorId,
      sessionId,
      isUnique,
      isNewSession,
      referrer: document.referrer || null,
      utmSource: getQueryParam('utm_source'),
      utmMedium: getQueryParam('utm_medium'),
      utmCampaign: getQueryParam('utm_campaign'),
      fbclid: getQueryParam('fbclid'),
      gclid: getQueryParam('gclid'),
    }).catch(() => {});
  } catch {}
}
