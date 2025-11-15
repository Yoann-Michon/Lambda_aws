import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { lazy, Suspense } from 'react';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Editor = lazy(() => import('./pages/Editor'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const PublicPosts = lazy(() => import('./pages/PublicPost'));
const Users = lazy(() => import('./pages/Users'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

const PageLoader = () => (
  <div className="flex flex-col justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <p className="text-gray-600 dark:text-gray-400">Chargement de la page...</p>
  </div>
);

// PrivateRoute avec vérification de permissions
const PrivateRoute = ({ children, adminOnly = false, editorAccess = false }) => {
  const { currentUser, loading, isAdmin, isEditor } = useAuth();

  if (loading) return <PageLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;
  
  // Si admin uniquement
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si nécessite editor ou admin
  if (editorAccess && !isEditor() && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
  editorAccess: PropTypes.bool
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Pages publiques */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/posts" element={<PublicPosts />} />
              <Route path="/posts/:id" element={<PostDetail />} />

              {/* Pages privées - Tous les utilisateurs connectés */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              {/* Pages privées - Editor et Admin uniquement */}
              <Route
                path="/editor"
                element={
                  <PrivateRoute editorAccess={true}>
                    <Editor />
                  </PrivateRoute>
                }
              />
              <Route
                path="/editor/:id"
                element={
                  <PrivateRoute editorAccess={true}>
                    <Editor />
                  </PrivateRoute>
                }
              />

              {/* Pages admin uniquement */}
              <Route
                path="/users"
                element={
                  <PrivateRoute adminOnly={true}>
                    <Users />
                  </PrivateRoute>
                }
              />

              {/* Accès refusé */}
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;