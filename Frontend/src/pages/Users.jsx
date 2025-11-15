import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Users = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (!isAdmin()) {
      navigate('/unauthorized');
    } else {
      loadUsers();
    }
  }, [currentUser, navigate, isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getAllUsers();
      setUsers(data.users);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToGroup = async (email, groupName) => {
    try {
      await api.admin.addUserToGroup(email, groupName);
      loadUsers(); // Recharger la liste
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleRemoveFromGroup = async (email, groupName) => {
    try {
      await api.admin.removeUserFromGroup(email, groupName);
      loadUsers(); // Recharger la liste
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Supprimer l'utilisateur ${email} ?`)) {
      try {
        await api.admin.deleteUser(email);
        loadUsers(); // Recharger la liste
      } catch (err) {
        alert('Erreur: ' + err.message);
      }
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
      <h1 className="text-2xl font-bold mb-6">Gestion des utilisateurs</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Groupes
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
            {users.map((user) => (
              <tr key={user.email}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {user.groups.map((group) => (
                      <span
                        key={group}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded ${user.enabled
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                    {user.enabled ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddToGroup(user.email, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="">Ajouter groupe...</option>
                      <option value="admin">admin</option>
                      <option value="editor">editor</option>
                      <option value="guest">guest</option>
                    </select>

                    {user.email !== currentUser?.email && (
                      <button
                        onClick={() => handleDeleteUser(user.email)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;