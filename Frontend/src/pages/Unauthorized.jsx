import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8">
          <svg 
            className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Accès Refusé
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          
          <div className="space-y-3">
            <Link 
              to="/dashboard" 
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour au tableau de bord
            </Link>
            
            <Link 
              to="/" 
              className="block w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;