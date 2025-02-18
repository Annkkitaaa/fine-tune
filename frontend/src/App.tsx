// src/App.tsx
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { useThemeStore } from './store/theme';
import { useAuth } from './hooks/useAuth';
import { Loader2, AlertCircle } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthModal } from './components/auth/AuthModal';
import { Alert, AlertDescription } from './components/ui/Alert';
import { formatError } from './components/utils/error';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ModelsPage = React.lazy(() => import('./pages/ModelsPage'));
const DatasetsPage = React.lazy(() => import('./pages/DatasetsPage'));
const TrainingPage = React.lazy(() => import('./pages/TrainingPage'));
const DeploymentPage = React.lazy(() => import('./pages/DeploymentPage'));
const EvaluationPage = React.lazy(() => import('./pages/EvaluationPage'));
const PipelinePage = React.lazy(() => import('./pages/PipelinePage'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
);

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  const { error } = useAuth();

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {formatError(error)}
          </AlertDescription>
        </Alert>
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        
        <Route
          path="/models"
          element={
            <ProtectedRoute>
              <ModelsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/datasets"
          element={
            <ProtectedRoute>
              <DatasetsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/training"
          element={
            <ProtectedRoute>
              <TrainingPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/deployment"
          element={
            <ProtectedRoute>
              <DeploymentPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/evaluation"
          element={
            <ProtectedRoute>
              <EvaluationPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/pipeline"
          element={
            <ProtectedRoute>
              <PipelinePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AuthModal
        isOpen={location.state?.from !== undefined}
        onClose={() => {
          window.history.replaceState({}, document.title);
        }}
      />
    </>
  );
};

function App() {
  const { theme } = useThemeStore();
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <Router>
        <div className={theme}>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Suspense fallback={<LoadingSpinner />}>
                <AppRoutes />
              </Suspense>
            </main>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;