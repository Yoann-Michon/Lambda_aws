import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Users = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingUser, setProcessingUser] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    loadUsers();
  }, [currentUser, navigate, isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.admin.getAllUsers();
      setUsers(data.users);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = async (userEmail, newGroup) => {
    if (processingUser) return;

    try {
      setProcessingUser(userEmail);
      setError('');

      const user = users.find(u => u.email === userEmail);
      const currentGroups = user.groups || [];

      console.log('Changing group for:', userEmail, 'from', currentGroups, 'to', newGroup);

      for (const group of currentGroups) {
        console.log('Removing from group:', group);
        await api.admin.removeUserFromGroup(userEmail, group);
      }

      if (newGroup && newGroup !== 'none') {
        console.log('Adding to group:', newGroup);
        await api.admin.addUserToGroup(userEmail, newGroup);
      }

      await loadUsers();
    } catch (err) {
      console.error('Error changing group:', err);
      setError(`Erreur lors du changement de groupe: ${err.message}`);
    } finally {
      setProcessingUser(null);
    }
  };

  const handleDeleteUser = async (userEmail) => {
    if (!globalThis.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ?`)) {
      return;
    }

    try {
      setProcessingUser(userEmail);
      setError('');
      await api.admin.deleteUser(userEmail);
      await loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(`Erreur lors de la suppression: ${err.message}`);
    } finally {
      setProcessingUser(null);
    }
  };

  const getGroupBadge = (groups) => {
    if (!groups || groups.length === 0) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          Aucun groupe
        </span>
      );
    }

    const group = groups[0];
    const colors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      editor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      guest: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[group] || 'bg-gray-100 text-gray-800'}`}>
        {group.charAt(0).toUpperCase() + group.slice(1)}
      </span>
    );
  };

  const getCurrentGroup = (groups) => {
    if (!groups || groups.length === 0) return 'none';
    return groups[0];
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
        <h1 className="text-3xl font-bold dark:text-white mb-2">
          Gestion des utilisateurs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {users.length} utilisateur{users.length !== 1 ? 's' : ''} au total
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Groupe actuel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Changer le groupe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(user => (
                <tr 
                  key={user.email}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    processingUser === user.email ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                    {user.emailVerified && (
                      <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Vérifié
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getGroupBadge(user.groups)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={getCurrentGroup(user.groups)}
                      onChange={(e) => handleGroupChange(user.email, e.target.value)}
                      disabled={processingUser === user.email || user.email === currentUser?.email}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="none">Aucun groupe</option>
                      <option value="guest">Guest</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.enabled ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Actif
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Désactivé
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.email !== currentUser?.email && (
                      <button
                        onClick={() => handleDeleteUser(user.email)}
                        disabled={processingUser === user.email}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Supprimer l'utilisateur"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;