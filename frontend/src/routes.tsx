import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DatasetManagement } from './pages/DatasetManagement';
import { ModelConfiguration } from './pages/ModelConfiguration';
import { Training } from './pages/Training';
import { Evaluation } from './pages/Evaluation';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="datasets" element={<DatasetManagement />} />
        <Route path="models" element={<ModelConfiguration />} />
        <Route path="training" element={<Training />} />
        <Route path="evaluation" element={<Evaluation />} />
      </Route>
    </Routes>
  );
}