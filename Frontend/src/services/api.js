const API_BASE_URL = import.meta.env.VITE_API_URL;

const getAuthToken = () => {
  return localStorage.getItem('idToken');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': token }) // Retirer "Bearer " car Cognito n'en a pas besoin
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Une erreur est survenue' }));
    throw new Error(error.error || error.message || 'Erreur inconnue');
  }
  return response.json();
};

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  // Inscription
  signup: async (email, password, name) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    return handleResponse(response);
  },

  // Connexion
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(response);
    
    // Sauvegarder les tokens
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('idToken', data.idToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Déconnexion complète (avec backend)
  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      // Ne pas lancer d'erreur si la déconnexion backend échoue
      if (response.ok) {
        await handleResponse(response);
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion backend:', error);
      // Continue quand même avec la déconnexion locale
    } finally {
      // Toujours supprimer les tokens locaux
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Récupérer l'utilisateur courant depuis le localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// ============================================
// POSTS API
// ============================================

export const postsAPI = {
  // Récupérer tous les posts
  getAllPosts: async (status = null, limit = 20) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit);
    
    const url = `${API_BASE_URL}/posts${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  },

  // Récupérer un post par ID
  getPost: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  },

  // Créer un nouveau post
  createPost: async (postData) => {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(postData)
    });
    return handleResponse(response);
  },

  // Mettre à jour un post
  updatePost: async (postId, postData) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(postData)
    });
    return handleResponse(response);
  },

  // Supprimer un post
  deletePost: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ============================================
// MEDIA API
// ============================================

export const mediaAPI = {
  // Upload un média
  uploadMedia: async (file) => {
    // Convertir le fichier en base64
    const toBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Retirer le préfixe "data:image/png;base64,"
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });

    const fileData = await toBase64(file);

    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileData: fileData
      })
    });
    return handleResponse(response);
  },

  // Récupérer l'URL d'un média
  getMediaUrl: async (mediaKey) => {
    const encodedKey = encodeURIComponent(mediaKey);
    const response = await fetch(`${API_BASE_URL}/media/${encodedKey}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  }
};

// ============================================
// ADMIN API
// ============================================

export const adminAPI = {
  // Récupérer tous les utilisateurs
  getAllUsers: async (limit = 60, paginationToken = null) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (paginationToken) params.append('paginationToken', paginationToken);
    
    const url = `${API_BASE_URL}/admin/users${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Ajouter un utilisateur à un groupe
  addUserToGroup: async (email, groupName) => {
    const encodedEmail = encodeURIComponent(email);
    const response = await fetch(`${API_BASE_URL}/admin/users/${encodedEmail}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action: 'addToGroup',
        groupName: groupName
      })
    });
    return handleResponse(response);
  },

  // Retirer un utilisateur d'un groupe
  removeUserFromGroup: async (email, groupName) => {
    const encodedEmail = encodeURIComponent(email);
    const response = await fetch(`${API_BASE_URL}/admin/users/${encodedEmail}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action: 'removeFromGroup',
        groupName: groupName
      })
    });
    return handleResponse(response);
  },

  // Activer un utilisateur
  enableUser: async (email) => {
    const encodedEmail = encodeURIComponent(email);
    const response = await fetch(`${API_BASE_URL}/admin/users/${encodedEmail}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'enable' })
    });
    return handleResponse(response);
  },

  // Supprimer un utilisateur
  deleteUser: async (email) => {
    const encodedEmail = encodeURIComponent(email);
    const response = await fetch(`${API_BASE_URL}/admin/users/${encodedEmail}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'delete' })
    });
    return handleResponse(response);
  }
};

// ============================================
// EXPORT PAR DÉFAUT
// ============================================

const api = {
  auth: authAPI,
  posts: postsAPI,
  media: mediaAPI,
  admin: adminAPI
};

export default api;