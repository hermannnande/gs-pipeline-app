import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Chargement à la demande : chaque page admin = son propre chunk.
// Évite de tout charger d'un coup à l'ouverture de l'admin (perf).
const Overview = lazy(() => import('./Overview'));
const Orders = lazy(() => import('./Orders'));
const Users = lazy(() => import('./Users'));
const Stats = lazy(() => import('./Stats'));
const ClientDatabase = lazy(() => import('../common/ClientDatabase'));
const CallerSupervision = lazy(() => import('../common/CallerSupervision'));
const AppelantOrders = lazy(() => import('../appelant/Orders'));
const Tournees = lazy(() => import('../stock/Tournees'));
const Products = lazy(() => import('../stock/Products'));
const Movements = lazy(() => import('../stock/Movements'));
const LiveraisonEnCours = lazy(() => import('../stock/LiveraisonEnCours'));
const ExpeditionsExpress = lazy(() => import('./ExpeditionsExpress'));
const Deliveries = lazy(() => import('../gestionnaire/Deliveries'));
const ValidatedOrders = lazy(() => import('../gestionnaire/ValidatedOrders'));
const Accounting = lazy(() => import('./Accounting'));
const ExpressAgence = lazy(() => import('../gestionnaire/ExpressAgence'));
const RDV = lazy(() => import('../appelant/RDV'));
const Chat = lazy(() => import('../common/Chat'));
const ChatSupervision = lazy(() => import('./ChatSupervision'));
const ProductAnalytics = lazy(() => import('./ProductAnalytics'));
const Attendances = lazy(() => import('./Attendances'));
const Audit = lazy(() => import('./Audit'));
const WhatsAppInbox = lazy(() => import('./WhatsAppInbox'));
const LandingTemplates = lazy(() => import('./LandingTemplates'));
const LandingAnalytics = lazy(() => import('./LandingAnalytics'));
const WhatsAppSettings = lazy(() => import('./WhatsAppSettings'));

function ContentSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<ContentSpinner />}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="orders" element={<Orders />} />
        <Route path="to-call" element={<AppelantOrders />} />
        <Route path="rdv" element={<RDV />} />
        <Route path="validated" element={<ValidatedOrders />} />
        <Route path="expeditions" element={<ExpeditionsExpress />} />
        <Route path="express-agence" element={<ExpressAgence />} />
        <Route path="users" element={<Users />} />
        <Route path="tournees" element={<Tournees />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="products" element={<Products />} />
        <Route path="livraisons-en-cours" element={<LiveraisonEnCours />} />
        <Route path="movements" element={<Movements />} />
        <Route path="database" element={<ClientDatabase />} />
        <Route path="supervision" element={<CallerSupervision />} />
        <Route path="presences" element={<Attendances />} />
        <Route path="stats" element={<Stats />} />
        <Route path="accounting" element={<Accounting />} />
        <Route path="chat" element={<Chat />} />
        <Route path="chat-supervision" element={<ChatSupervision />} />
        <Route path="product-analytics" element={<ProductAnalytics />} />
        <Route path="audit" element={<Audit />} />
        <Route path="whatsapp" element={<WhatsAppInbox />} />
        <Route path="whatsapp-confirmation" element={<WhatsAppSettings />} />
        <Route path="templates" element={<LandingTemplates />} />
        <Route path="landing-analytics" element={<LandingAnalytics />} />
      </Routes>
    </Suspense>
  );
}
