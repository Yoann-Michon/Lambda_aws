import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/BlogContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser, updateUser, deleteUser } = useAppContext();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const form = e.target;
    const username = form.username.value;
    const password = form.newPassword.value;
    const success = updateUser(currentUser.id, username, password);
    if (!success) {
      setError("Ce nom d'utilisateur est déjà utilisé.");
    } else {
      setError('');
    }
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    if (window.confirm('Supprimer votre compte ?')) {
      deleteUser(currentUser.id);
      navigate('/login');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Mon profil</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {currentUser && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            defaultValue={currentUser.username}
            placeholder="Nom d'utilisateur"
            required
            className="w-full p-2 mb-4 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            type="password"
            name="newPassword"
            placeholder="Nouveau mot de passe"
            className="w-full p-2 mb-4 border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Enregistrer
          </button>
        </form>
      )}
      <hr className="my-6" />
      <button
        onClick={handleDeleteAccount}
        className="bg-red-600 text-white font-medium px-4 py-2 rounded hover:bg-red-700"
      >
        Supprimer mon compte
      </button>
    </div>
  );
};

export default Profile;
