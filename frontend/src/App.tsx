import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import About from './pages/About';
import DashboardHome from './pages/DashboardHome';
import DatasetDetail from './pages/DatasetDetail';
import DatasetList from './pages/DatasetList';
import ImportDataset from './pages/ImportDataset';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/datasets" element={<DatasetList />} />
        <Route path="/datasets/:id" element={<DatasetDetail />} />
        <Route path="/import" element={<ImportDataset />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  );
}
