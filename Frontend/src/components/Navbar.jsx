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
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          <Link
            to="/"
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text"
          >
            Blogify
          </Link>

          <div className="flex items-center gap-6">

            <Link
              to="/posts"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Articles
            </Link>

            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Tableau de bord
                </Link>

                {canCreatePosts() && (
                  <Link
                    to="/editor"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Nouvel article
                  </Link>
                )}

                {isAdmin() && (
                  <Link
                    to="/users"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Utilisateurs
                  </Link>
                )}

                <div className="flex items-center gap-4 pl-4 border-l border-gray-300 dark:border-gray-600">

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base shadow">
                    {currentUser.name?.[0]?.toUpperCase()}
                  </div>

                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {currentUser.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {currentUser.groups?.join(", ")}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="ml-2 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 active:scale-95 transition-all shadow"
                  >
                    Déconnexion
                  </button>

                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Connexion
                </Link>

                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
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