import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import Orders from './Orders';
import MyProcessedOrders from './MyProcessedOrders';
import Stats from './Stats';
import ClientDatabase from '../common/ClientDatabase';

export default function AppelantDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="orders" element={<Orders />} />
      <Route path="processed" element={<MyProcessedOrders />} />
      <Route path="database" element={<ClientDatabase />} />
      <Route path="stats" element={<Stats />} />
    </Routes>
  );
}

