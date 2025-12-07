import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import Deliveries from './Deliveries';
import Stats from './Stats';

export default function LivreurDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="deliveries" element={<Deliveries />} />
      <Route path="stats" element={<Stats />} />
    </Routes>
  );
}








