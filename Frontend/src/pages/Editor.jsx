import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    tags: [],
    status: 'draft'
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditing = !!id;

  // Utiliser useCallback pour éviter les warnings de dépendances
  const loadPost = useCallback(async () => {
    try {
      const data = await api.posts.getPost(id);
      setFormData({
        title: data.post.title,
        content: data.post.content,
        author: data.post.author,
        tags: data.post.tags || [],
        status: data.post.status
      });
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    if (isEditing) {
      loadPost();
    } else {
      setFormData(prev => ({ ...prev, author: currentUser.name }));
    }
  }, [currentUser, navigate, isEditing, loadPost]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddTag(e);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await api.posts.updatePost(id, formData);
      } else {
        await api.posts.createPost(formData);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSubmitButtonText = () => {
    if (loading) return 'Enregistrement...';
    return isEditing ? 'Mettre à jour' : 'Créer';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {isEditing ? 'Modifier l\'article' : 'Nouvel Article'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="title">
            Titre
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Titre de l'article"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="content">
            Contenu
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows="15"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Écrivez votre article ici..."
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="tagInput">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              id="tagInput"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ajouter un tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-blue-600 hover:text-blue-800 text-lg font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="status">
            Statut
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {getSubmitButtonText()}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default Editor;