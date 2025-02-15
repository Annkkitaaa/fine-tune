import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { useStore } from './store';
import { ModelsPage } from './pages/ModelsPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { TrainingPage } from './pages/TrainingPage';
import { DeploymentPage } from './pages/DeploymentPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { PipelinePage } from './pages/PipelinePage';
import { HomePage } from './pages/HomePage';

function App() {
  const { theme } = useStore();

  return (
    <Router>
      <div className={theme}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/models/*" element={<ModelsPage />} />
              <Route path="/datasets/*" element={<DatasetsPage />} />
              <Route path="/training/*" element={<TrainingPage />} />
              <Route path="/deployment/*" element={<DeploymentPage />} />
              <Route path="/evaluation" element={<EvaluationPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;