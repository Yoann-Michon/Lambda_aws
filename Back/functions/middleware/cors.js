const config = require('../config');

const validateOrigin = (event, stage) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  
  if (!origin) {
    console.warn('No origin header found in request');
    return {
      isValid: false,
      origin: '*'
    };
  }

  const isAllowed = config.isOriginAllowed(origin, stage);
  
  if (!isAllowed) {
    console.warn(`Origin not allowed: ${origin}`);
  }

  return {
    isValid: isAllowed,
    origin: isAllowed ? origin : null
  };
};

const getCorsHeaders = (event, stage) => {
  const validation = validateOrigin(event, stage);
  
  return {
    'Access-Control-Allow-Origin': validation.isValid ? validation.origin : 'null',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };
};

const withCors = (handler, stage = 'dev') => {
  return async (event) => {
    const validation = validateOrigin(event, stage);
    
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(event, stage),
        body: ''
      };
    }

    if (!validation.isValid) {
      return {
        statusCode: 403,
        headers: getCorsHeaders(event, stage),
        body: JSON.stringify({
          error: 'Origin not allowed'
        })
      };
    }

    try {
      const response = await handler(event);
      return {
        ...response,
        headers: {
          ...response.headers,
          ...getCorsHeaders(event, stage)
        }
      };
    } catch (error) {
      console.error('Handler error:', error);
      return {
        statusCode: 500,
        headers: getCorsHeaders(event, stage),
        body: JSON.stringify({
          error: 'Internal server error',
          details: error.message
        })
      };
    }
  };
};

module.exports = {
  validateOrigin,
  getCorsHeaders,
  withCors
};