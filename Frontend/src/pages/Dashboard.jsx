import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = api.auth.getCurrentUser();
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    loadPosts();
  }, [navigate]);

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
    // Utilisation de globalThis au lieu de window
    if (!globalThis.confirm('Supprimer cet article ?')) {
      return;
    }

    try {
      await api.posts.deletePost(postId);
      // Recharger la liste
      loadPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      globalThis.alert('Erreur lors de la suppression: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-8">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes articles</h1>
        <Link 
          to="/editor" 
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Nouvel article
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {posts.length === 0 ? (
        <p>Aucun article pour le moment.</p>
      ) : (
        <ul>
          {posts.map(post => (
            <li 
              key={post.postId} 
              className="py-2 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between"
            >
              <div>
                <Link 
                  to={`/posts/${post.postId}`} 
                  className="font-semibold hover:underline"
                >
                  {post.title}
                </Link>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  [{post.status === 'published' ? 'Publié' : 'Brouillon'}]
                </span>
                {post.views > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    {post.views} vues
                  </span>
                )}
              </div>
              <div>
                <Link 
                  to={`/editor/${post.postId}`} 
                  className="text-blue-500 hover:underline mr-4"
                >
                  Modifier
                </Link>
                <button 
                  onClick={() => handleDelete(post.postId)} 
                  className="text-red-500 hover:underline"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;