import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import Orders from './Orders';
import Users from './Users';
import Stats from './Stats';
import ClientDatabase from '../common/ClientDatabase';
import CallerSupervision from '../common/CallerSupervision';
import AppelantOrders from '../appelant/Orders';
import Tournees from '../stock/Tournees';
import Products from '../stock/Products';
import Movements from '../stock/Movements';
import LiveraisonEnCours from '../stock/LiveraisonEnCours';
import ExpeditionsExpress from './ExpeditionsExpress';
import Deliveries from '../gestionnaire/Deliveries';
import ValidatedOrders from '../gestionnaire/ValidatedOrders';
import Accounting from './Accounting';
import ExpressAgence from '../gestionnaire/ExpressAgence';
import RDV from '../appelant/RDV';
import Chat from '../common/Chat';
import ChatSupervision from './ChatSupervision';

export default function AdminDashboard() {
  return (
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
      <Route path="stats" element={<Stats />} />
      <Route path="accounting" element={<Accounting />} />
      <Route path="chat" element={<Chat />} />
      <Route path="chat-supervision" element={<ChatSupervision />} />
    </Routes>
  );
}

