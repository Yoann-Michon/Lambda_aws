import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SearchBar from '../components/SearchBar';

const PublicPost = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.posts.getAllPosts('published');
      
      const postsWithSignedUrls = await Promise.all(
        data.posts.map(async (post) => {
          if (post.mediaUrls?.length > 0) {
            try {
              const signedData = await api.media.getSignedUrls([post.mediaUrls[0]], 86400);
              return {
                ...post,
                coverImageUrl: signedData.signedUrls[0]?.signedUrl || null
              };
            } catch (imgErr) {
              console.error('Error getting signed URL for post:', post.postId, imgErr);
              return { ...post, coverImageUrl: null };
            }
          }
          return { ...post, coverImageUrl: null };
        })
      );
      
      setAllPosts(postsWithSignedUrls);
      setDisplayedPosts(postsWithSignedUrls);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query || query.trim().length === 0) {
      setDisplayedPosts(allPosts);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    
    const filtered = allPosts.filter(post => {
      const titleMatch = post.title?.toLowerCase().includes(searchTerm);
      const contentMatch = post.content?.toLowerCase().includes(searchTerm);
      const authorMatch = post.authorName?.toLowerCase().includes(searchTerm);
      const tagsMatch = post.tags?.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );

      return titleMatch || contentMatch || authorMatch || tagsMatch;
    });

    const sorted = filtered.sort((a, b) => {
      const aTitle = a.title?.toLowerCase() || '';
      const bTitle = b.title?.toLowerCase() || '';
      
      const aTitleExact = aTitle === searchTerm;
      const bTitleExact = bTitle === searchTerm;
      
      if (aTitleExact && !bTitleExact) return -1;
      if (!aTitleExact && bTitleExact) return 1;
      
      const aTitleStarts = aTitle.startsWith(searchTerm);
      const bTitleStarts = bTitle.startsWith(searchTerm);
      
      if (aTitleStarts && !bTitleStarts) return -1;
      if (!aTitleStarts && bTitleStarts) return 1;
      
      return b.createdAt - a.createdAt;
    });

    setDisplayedPosts(sorted);
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-600">{part}</mark>
      ) : (
        part
      )
    );
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          Articles Publics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Découvrez nos derniers articles
        </p>
        
        <div className="flex justify-center mb-6">
          <SearchBar onSearch={handleSearch} />
        </div>

        {searchQuery && (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {displayedPosts.length} résultat{displayedPosts.length !== 1 ? 's' : ''} pour "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {displayedPosts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {searchQuery ? (
            <>
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                Aucun résultat trouvé
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Essayez avec d'autres mots-clés
              </p>
            </>
          ) : (
            <>
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
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Aucun article publié pour le moment.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPosts.map(post => (
            <Link
              key={post.postId}
              to={`/posts/${post.postId}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
            >
              {post.coverImageUrl ? (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.classList.add('bg-gray-200', 'dark:bg-gray-700');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg 
                    className="w-16 h-16 text-white opacity-50" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                </div>
              )}

              <div className="p-6">
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {searchQuery ? highlightText(post.title, searchQuery) : post.title}
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 text-sm">
                  {searchQuery ? highlightText(post.content, searchQuery) : post.content}
                </p>

                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                      >
                        #{searchQuery ? highlightText(tag, searchQuery) : tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="px-2 py-1 text-gray-500 text-xs">
                        +{post.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{post.authorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(post.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicPost;