import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import Tournees from './Tournees';
import Products from './Products';
import Movements from './Movements';
import ClientDatabase from '../common/ClientDatabase';
// Stock management dashboard

export default function StockDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="tournees" element={<Tournees />} />
      <Route path="products" element={<Products />} />
      <Route path="movements" element={<Movements />} />
      <Route path="database" element={<ClientDatabase />} />
    </Routes>
  );
}

