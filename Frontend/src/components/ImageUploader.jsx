import { useState } from 'react';
import PropTypes from 'prop-types';

const ImageUploader = ({ images, onImagesChange }) => {
  const [error, setError] = useState('');

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setError('');

    try {
      const newImages = [];

      for (const file of files) {
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} n'est pas une image valide`);
        }

        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} est trop volumineux (max 5MB)`);
        }

        // Créer un URL temporaire pour l'aperçu
        const previewUrl = URL.createObjectURL(file);

        newImages.push({
          file: file,
          previewUrl: previewUrl,
          caption: ''
        });
      }

      onImagesChange([...images, ...newImages]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    // Révoquer l'URL de l'aperçu pour libérer la mémoire
    if (images[indexToRemove].previewUrl) {
      URL.revokeObjectURL(images[indexToRemove].previewUrl);
    }
    onImagesChange(images.filter((_, index) => index !== indexToRemove));
  };

  const handleCaptionChange = (index, caption) => {
    const updatedImages = [...images];
    updatedImages[index].caption = caption;
    onImagesChange(updatedImages);
  };

  return (
    <div>
      <label className="block text-gray-700 dark:text-gray-300 mb-2">
        Images
      </label>

      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* Zone d'upload */}
      <div className="mb-4">
        <label 
          htmlFor="image-upload" 
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg 
              className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, GIF (MAX. 5MB)
            </p>
          </div>
          <input 
            id="image-upload" 
            type="file" 
            className="hidden" 
            accept="image/*"
            multiple
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Aperçu des images avec légendes */}
      {images.length > 0 && (
        <div className="space-y-4">
          {images.map((imageData, index) => (
            <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="flex gap-4">
                <div className="relative group flex-shrink-0">
                  <img
                    src={imageData.previewUrl || imageData.url}
                    alt={`Upload ${index + 1}`}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Légende de l'image
                  </label>
                  <textarea
                    value={imageData.caption || ''}
                    onChange={(e) => handleCaptionChange(index, e.target.value)}
                    placeholder="Ajoutez une description pour cette image..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {images.length} image{images.length > 1 ? 's' : ''} ajoutée{images.length > 1 ? 's' : ''}
      </p>
    </div>
  );
};

ImageUploader.propTypes = {
  images: PropTypes.arrayOf(PropTypes.shape({
    file: PropTypes.object,
    previewUrl: PropTypes.string,
    url: PropTypes.string,
    caption: PropTypes.string
  })).isRequired,
  onImagesChange: PropTypes.func.isRequired
};

export default ImageUploader;