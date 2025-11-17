import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, canCreatePosts } = useAuth();
  const [allPosts, setAllPosts] = useState([]);
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    } else {
      loadPosts();
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    filterPosts();
  }, [statusFilter, allPosts]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await api.posts.getAllPosts();
      const user = api.auth.getCurrentUser();
      if (user) {
        const userPosts = response.posts.filter(p => p.authorEmail === user.email);
        setAllPosts(userPosts);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Erreur lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    if (statusFilter === 'all') {
      setDisplayedPosts(allPosts);
    } else {
      setDisplayedPosts(allPosts.filter(post => post.status === statusFilter));
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

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Publié
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        Brouillon
      </span>
    );
  };

  const stats = {
    all: allPosts.length,
    published: allPosts.filter(p => p.status === 'published').length,
    draft: allPosts.filter(p => p.status === 'draft').length
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white mb-2">Mes articles</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {stats.all} article{stats.all !== 1 ? 's' : ''} au total
          </p>
        </div>
        
        {canCreatePosts() && (
          <Link 
            to="/editor" 
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Tous</span>
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                {stats.all}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setStatusFilter('published')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              statusFilter === 'published'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Publiés</span>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                {stats.published}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setStatusFilter('draft')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              statusFilter === 'draft'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Brouillons</span>
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                {stats.draft}
              </span>
            </div>
          </button>
        </div>
      </div>

      {displayedPosts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <svg 
            className="w-16 h-16 mx-auto mb-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
            {statusFilter === 'all' && "Aucun article pour le moment."}
            {statusFilter === 'published' && "Aucun article publié."}
            {statusFilter === 'draft' && "Aucun brouillon."}
          </p>
          {canCreatePosts() && (
            <Link 
              to="/editor"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer votre premier article
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayedPosts.map(post => (
              <li 
                key={post.postId} 
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link 
                        to={`/posts/${post.postId}`} 
                        className="font-semibold text-lg hover:text-blue-600 dark:text-white dark:hover:text-blue-400 transition-colors"
                      >
                        {post.title}
                      </Link>
                      {getStatusBadge(post.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(post.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      
                      {post.views > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{post.views} vues</span>
                        </div>
                      )}
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span>{post.tags.length} tag{post.tags.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {canCreatePosts() && (
                    <div className="flex gap-2 ml-4">
                      <Link 
                        to={`/editor/${post.postId}`} 
                        className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button 
                        onClick={() => handleDelete(post.postId)} 
                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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