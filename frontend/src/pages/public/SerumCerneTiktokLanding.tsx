/**
 * Landing Serum Anti-Cernes — canal TikTok Ads (slug serum-cerne-tiktok).
 * Clone visuel de serum-cerne ; tracking separe (productCode SERUM_CERNE_TIKTOK, sans pixel FB).
 */
import { SerumCerneLandingPage, SERUM_CERNE_TIKTOK_CONFIG } from './SerumCerneLanding';

export default function SerumCerneTiktokLanding() {
  return <SerumCerneLandingPage config={SERUM_CERNE_TIKTOK_CONFIG} />;
}
