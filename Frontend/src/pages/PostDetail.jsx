import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const [post, setPost] = useState(null);
  const [signedImageUrls, setSignedImageUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState('');

  const loadPost = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.posts.getPost(id);
      setPost(data.post);

      // Obtenir les URLs pré-signées pour les images
      if (data.post.mediaUrls && data.post.mediaUrls.length > 0) {
        setLoadingImages(true);
        try {
          const expiresIn = data.post.status === 'published' ? 86400 : 3600; // 24h pour publié, 1h pour brouillon
          const signedData = await api.media.getSignedUrls(data.post.mediaUrls, expiresIn);
          setSignedImageUrls(signedData.signedUrls || []);
        } catch (imgErr) {
          console.error('Error loading images:', imgErr);
          setSignedImageUrls([]);
        } finally {
          setLoadingImages(false);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }

    try {
      await api.posts.deletePost(id);
      navigate('/dashboard');
    } catch (err) {
      alert('Erreur lors de la suppression : ' + err.message);
    }
  };

  const canEdit = currentUser && post && (
    currentUser.email === post.authorEmail || isAdmin()
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error || 'Article non trouvé'}
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <span>Par {post.authorName}</span>
          <span>•</span>
          <span>{new Date(post.createdAt).toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
          {post.views > 0 && (
            <>
              <span>•</span>
              <span>{post.views} vues</span>
            </>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {post.status === 'draft' && (
          <div className="mb-6 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            Cet article est en brouillon
          </div>
        )}

        {canEdit && (
          <div className="flex gap-4 mb-6">
            <Link
              to={`/editor/${post.postId}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Modifier
            </Link>
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Supprimer
            </button>
          </div>
        )}

        {/* Images avec URLs pré-signées - AVANT le contenu */}
        {signedImageUrls.length > 0 && (
          <div className="mb-8 space-y-6">
            {loadingImages ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              signedImageUrls.map((urlData, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                  {urlData.signedUrl && !urlData.error ? (
                    <img
                      src={urlData.signedUrl}
                      alt={`Image ${index + 1}`}
                      className="w-full rounded-lg shadow-md"
                      onError={(e) => {
                        console.error('Image failed to load:', urlData.originalKey);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
                      ⚠️ Erreur de chargement de l'image
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Contenu de l'article */}
        <div className="prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
            {post.content}
          </div>
        </div>
      </article>

      <div className="mt-6">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>
      </div>
    </div>
  );
};

export default PostDetail;