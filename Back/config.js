module.exports = {
  getAllowedOrigins: (stage) => {
    switch (stage) {
      case 'prod':
        return [
          'https://www.votre-domaine.com'
        ];
      case 'staging':
        return [
          'https://votre-domaine.com'
        ];
      case 'dev':
      default:
        return [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173'
        ];
    }
  },

  isOriginAllowed: (origin, stage) => {
    const allowedOrigins = module.exports.getAllowedOrigins(stage);
    return allowedOrigins.includes(origin);
  }
};