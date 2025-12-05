import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import ValidatedOrders from './ValidatedOrders';
import Deliveries from './Deliveries';
import Stats from './Stats';
import ClientDatabase from '../common/ClientDatabase';
import CallerSupervision from '../common/CallerSupervision';
import AppelantOrders from '../appelant/Orders';

export default function GestionnaireDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="to-call" element={<AppelantOrders />} />
      <Route path="validated" element={<ValidatedOrders />} />
      <Route path="deliveries" element={<Deliveries />} />
      <Route path="database" element={<ClientDatabase />} />
      <Route path="supervision" element={<CallerSupervision />} />
      <Route path="stats" element={<Stats />} />
    </Routes>
  );
}

