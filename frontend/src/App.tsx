import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardHome from './pages/DashboardHome';
import DatasetDetail from './pages/DatasetDetail';
import DatasetList from './pages/DatasetList';
import ImportDataset from './pages/ImportDataset';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/datasets" element={<DatasetList />} />
        <Route path="/datasets/:id" element={<DatasetDetail />} />
        <Route path="/import" element={<ImportDataset />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout>
  );
}
