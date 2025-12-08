import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import Orders from './Orders';
import MyProcessedOrders from './MyProcessedOrders';
import Stats from './Stats';
import ClientDatabase from '../common/ClientDatabase';
import ExpeditionsExpress from '../admin/ExpeditionsExpress';
import ExpressAgence from '../gestionnaire/ExpressAgence';
import AllOrders from '../admin/Orders';
import Deliveries from '../gestionnaire/Deliveries';
import RDV from './RDV';

export default function AppelantDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="orders" element={<Orders />} />
      <Route path="all-orders" element={<AllOrders />} />
      <Route path="expeditions" element={<ExpeditionsExpress />} />
      <Route path="express-agence" element={<ExpressAgence />} />
      <Route path="deliveries" element={<Deliveries />} />
      <Route path="rdv" element={<RDV />} />
      <Route path="processed" element={<MyProcessedOrders />} />
      <Route path="database" element={<ClientDatabase />} />
      <Route path="stats" element={<Stats />} />
    </Routes>
  );
}

