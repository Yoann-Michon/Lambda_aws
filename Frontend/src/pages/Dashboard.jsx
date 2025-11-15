import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, canCreatePosts } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    } else {
      loadPosts();
    }
  }, [currentUser, navigate]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await api.posts.getAllPosts();
      const user = api.auth.getCurrentUser();
      if (user) {
        const userPosts = response.posts.filter(p => p.authorEmail === user.email);
        setPosts(userPosts);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Erreur lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Supprimer cet article ?')) {
      return;
    }

    try {
      await api.posts.deletePost(postId);
      loadPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      window.alert('Erreur lors de la suppression: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Mes articles</h1>
        {canCreatePosts() && (
          <Link 
            to="/editor" 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Nouvel article
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!canCreatePosts() && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded mb-4">
          Vous avez un accès en lecture seule. Pour créer des articles, contactez un administrateur.
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {canCreatePosts() 
              ? "Aucun article pour le moment." 
              : "Vous n'avez pas encore d'articles."}
          </p>
          {canCreatePosts() && (
            <Link 
              to="/editor"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Créer votre premier article
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {posts.map(post => (
              <li 
                key={post.postId} 
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link 
                      to={`/posts/${post.postId}`} 
                      className="font-semibold text-lg hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className={`px-2 py-1 rounded ${
                        post.status === 'published' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {post.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                      {post.views > 0 && (
                        <span>👁 {post.views} vues</span>
                      )}
                      <span>
                        {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  {canCreatePosts() && (
                    <div className="flex gap-3">
                      <Link 
                        to={`/editor/${post.postId}`} 
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Modifier
                      </Link>
                      <button 
                        onClick={() => handleDelete(post.postId)} 
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;