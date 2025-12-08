import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { WorkspacePage } from './components/workspace/WorkspacePage';
import { WorkspaceDetailPage } from './components/workspace/WorkspaceDetailPage';
import { ProjectPage } from './components/project/ProjectPage';
import { ProjectDetailPage } from './components/project/ProjectDetailPage';
import { DatasetPage } from './components/dataset/DatasetPage';
import { DatasetDetailPage } from './components/dataset/DatasetDetailPage';
import { ImageManagementPage } from './components/image/ImageManagementPage';
import { AnnotationPage } from './components/annotation/AnnotationPage';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

function App() {
  const { isAuthenticated } = useAuthStore();

  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
  };

  const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <DashboardPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/workspaces" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <WorkspacePage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/workspaces/:workspaceId" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <WorkspaceDetailPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/workspaces/:workspaceId/projects" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <ProjectPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/workspaces/:workspaceId/projects/:projectId" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <ProjectDetailPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/workspaces/:workspaceId/projects/:projectId/annotate" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <AnnotationPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/workspaces/:workspaceId/datasets" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <DatasetPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/workspaces/:workspaceId/datasets/:datasetId" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <DatasetDetailPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/:projectId/images" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <ImageManagementPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <NotificationsPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <SettingsPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />

          {/* Redirect root to appropriate page */}
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />

          {/* Catch all route */}
          <Route 
            path="*" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
