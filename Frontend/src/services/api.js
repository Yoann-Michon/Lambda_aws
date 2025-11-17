const API_BASE_URL = import.meta.env.VITE_API_URL;

const getAuthToken = () => {
  return localStorage.getItem('idToken');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': token })
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || error.message || 'Unknown error');
  }
  return response.json();
};

export const authAPI = {
  signup: async (email, password, name) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    return handleResponse(response);
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(response);
    
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('idToken', data.idToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  logoutBackend: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    authAPI.logout();
    
    return handleResponse(response);
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export const postsAPI = {
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

  getPost: async (postId, incrementViews = true) => {
    const params = new URLSearchParams();
    if (!incrementViews) {
      params.append('skipView', 'true');
    }
    
    const url = `${API_BASE_URL}/posts/${postId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  },

  createPost: async (postData) => {
    const formattedData = {
      title: postData.title,
      content: postData.content,
      author: postData.author,
      tags: postData.tags,
      status: postData.status,
      images: []
    };

    if (postData.images && postData.images.length > 0) {
      const imagePromises = postData.images.map(async (imageData) => {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(imageData.file);
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
        });

        return {
          fileName: imageData.file.name,
          fileType: imageData.file.type,
          fileData: base64,
          caption: imageData.caption || ''
        };
      });

      formattedData.images = await Promise.all(imagePromises);
    }

    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(formattedData)
    });
    return handleResponse(response);
  },

  updatePost: async (postId, postData) => {
    const formattedData = {
      title: postData.title,
      content: postData.content,
      tags: postData.tags,
      status: postData.status,
      existingMediaUrls: postData.existingMediaUrls || [],
      images: []
    };

    if (postData.newImages && postData.newImages.length > 0) {
      const imagePromises = postData.newImages.map(async (imageData) => {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(imageData.file);
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
        });

        return {
          fileName: imageData.file.name,
          fileType: imageData.file.type,
          fileData: base64,
          caption: imageData.caption || ''
        };
      });

      formattedData.images = await Promise.all(imagePromises);
    }

    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(formattedData)
    });
    return handleResponse(response);
  },

  deletePost: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

export const mediaAPI = {
  getSignedUrls: async (mediaKeys, expiresIn = 86400) => {
    const response = await fetch(`${API_BASE_URL}/media/signed-urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaKeys: mediaKeys,
        expiresIn: expiresIn
      })
    });
    return handleResponse(response);
  }
};

export const adminAPI = {
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

  enableUser: async (email) => {
    const encodedEmail = encodeURIComponent(email);
    const response = await fetch(`${API_BASE_URL}/admin/users/${encodedEmail}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'enable' })
    });
    return handleResponse(response);
  },

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

const api = {
  auth: authAPI,
  posts: postsAPI,
  media: mediaAPI,
  admin: adminAPI
};

export default api;