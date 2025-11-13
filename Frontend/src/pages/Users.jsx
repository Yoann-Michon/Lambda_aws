import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/BlogContext';
import { useNavigate } from 'react-router-dom';

const Users = () => {
  const { currentUser, users, createUser, updateUser, deleteUser } = useAppContext();
  const navigate = useNavigate();
  const [editingUserId, setEditingUserId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role !== 'Admin') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;
    const role = form.role.value;
    const success = createUser(username, password, role);
    if (!success) {
      setError("Ce nom d'utilisateur est déjà utilisé.");
    } else {
      setError('');
      form.reset();
    }
  };

  const handleEditClick = (user) => {
    setError('');
    setEditingUserId(user.id);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editingUserId == null) return;
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;
    const role = form.role.value;
    const success = updateUser(editingUserId, username, password, role);
    if (!success) {
      setError("Ce nom d'utilisateur est déjà utilisé.");
    } else {
      setError('');
      setEditingUserId(null);
    }
  };

  const handleCancel = () => {
    setError('');
    setEditingUserId(null);
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Supprimer cet utilisateur ?')) {
      if (editingUserId === id) {
        setEditingUserId(null);
      }
      deleteUser(id);
    }
  };

  const roleNames = { 'Author': 'Auteur', 'Editor': 'Éditeur', 'Admin': 'Administrateur' };

  const editingUser = editingUserId ? users.find(u => u.id === editingUserId) : null;

  return (
    <div className="mt-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des utilisateurs</h1>
      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr>
            <th className="border-b pb-2">Nom d'utilisateur</th>
            <th className="border-b pb-2">Rôle</th>
            <th className="border-b pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="py-1">{user.username}</td>
              <td className="py-1">{roleNames[user.role] || user.role}</td>
              <td className="py-1">
                <button onClick={() => handleEditClick(user)} className="text-blue-500 hover:underline mr-4">Modifier</button>
                <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:underline">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editingUserId ? (
        <div className="max-w-sm">
          <h2 className="text-xl font-bold mb-4">Modifier l'utilisateur</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {editingUser && (
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                name="username"
                defaultValue={editingUser.username}
                placeholder="Nom d'utilisateur"
                required
                className="w-full p-2 mb-4 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <input
                type="password"
                name="password"
                placeholder="Nouveau mot de passe"
                className="w-full p-2 mb-4 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <select
                name="role"
                defaultValue={editingUser.role}
                className="w-full p-2 mb-4 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="Author">Auteur</option>
                <option value="Editor">Éditeur</option>
                <option value="Admin">Administrateur</option>
              </select>
              <div>
                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 mr-4">Enregistrer</button>
                <button type="button" onClick={handleCancel} className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600">Annuler</button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="max-w-sm">
          <h2 className="text-xl font-bold mb-4">Créer un nouvel utilisateur</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleAddSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Nom d'utilisateur"
              required
              className="w-full p-2 mb-4 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              required
              className="w-full p-2 mb-4 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <select
              name="role"
              className="w-full p-2 mb-4 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="Author">Auteur</option>
              <option value="Editor">Éditeur</option>
              <option value="Admin">Administrateur</option>
            </select>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Ajouter</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Users;
