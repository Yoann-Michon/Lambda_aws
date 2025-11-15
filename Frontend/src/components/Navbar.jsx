import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout, isAdmin, canCreatePosts } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      navigate('/login');
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Blogify
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/posts"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
            >
              Articles
            </Link>

            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
                >
                  Tableau de bord
                </Link>
                
                {canCreatePosts() && (
                  <Link
                    to="/editor"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
                  >
                    Nouvel article
                  </Link>
                )}
                
                {isAdmin() && (
                  <Link
                    to="/users"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
                  >
                    Utilisateurs
                  </Link>
                )}

                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400 block">
                      {currentUser.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {currentUser.groups?.join(', ')}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;