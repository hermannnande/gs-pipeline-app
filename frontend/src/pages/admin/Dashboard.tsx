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

export default function AdminDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="orders" element={<Orders />} />
      <Route path="to-call" element={<AppelantOrders />} />
      <Route path="users" element={<Users />} />
      <Route path="tournees" element={<Tournees />} />
      <Route path="products" element={<Products />} />
      <Route path="movements" element={<Movements />} />
      <Route path="database" element={<ClientDatabase />} />
      <Route path="supervision" element={<CallerSupervision />} />
      <Route path="stats" element={<Stats />} />
    </Routes>
  );
}

