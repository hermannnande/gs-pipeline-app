import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import ValidatedOrders from './ValidatedOrders';
import Deliveries from './Deliveries';
import Stats from './Stats';
import ClientDatabase from '../common/ClientDatabase';
import CallerSupervision from '../common/CallerSupervision';
import AppelantOrders from '../appelant/Orders';
import ExpeditionsExpress from '../admin/ExpeditionsExpress';
import ExpressAgence from './ExpressAgence';
import AllOrders from '../admin/Orders';
import Users from '../admin/Users';
import RDV from '../appelant/RDV';

export default function GestionnaireDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="to-call" element={<AppelantOrders />} />
      <Route path="rdv" element={<RDV />} />
      <Route path="all-orders" element={<AllOrders />} />
      <Route path="validated" element={<ValidatedOrders />} />
      <Route path="expeditions" element={<ExpeditionsExpress />} />
      <Route path="express-agence" element={<ExpressAgence />} />
      <Route path="deliveries" element={<Deliveries />} />
      <Route path="users" element={<Users />} />
      <Route path="database" element={<ClientDatabase />} />
      <Route path="supervision" element={<CallerSupervision />} />
      <Route path="stats" element={<Stats />} />
    </Routes>
  );
}

