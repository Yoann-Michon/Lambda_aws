const rateLimitStore = new Map();

const cleanupOldEntries = () => {
  const now = Date.now();
  for (const [key, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < 300000);
    if (validRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validRequests);
    }
  }
};

setInterval(cleanupOldEntries, 60000);

const checkRateLimit = (identifier, maxRequests = 100, windowMs = 60000) => {
  const now = Date.now();
  const userRequests = rateLimitStore.get(identifier) || [];
  
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
    };
  }
  
  recentRequests.push(now);
  rateLimitStore.set(identifier, recentRequests);
  
  return {
    allowed: true,
    remaining: maxRequests - recentRequests.length
  };
};

const withRateLimit = (handler, maxRequests = 100, windowMs = 60000) => {
  return async (event) => {
    const identifier = event.requestContext?.identity?.sourceIp || 'unknown';
    
    const rateLimit = checkRateLimit(identifier, maxRequests, windowMs);
    
    if (!rateLimit.allowed) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimit.retryAfter.toString()
        },
        body: JSON.stringify({
          error: 'Too many requests',
          retryAfter: rateLimit.retryAfter
        })
      };
    }
    
    const response = await handler(event);
    
    return {
      ...response,
      headers: {
        ...response.headers,
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Limit': maxRequests.toString()
      }
    };
  };
};

module.exports = {
  checkRateLimit,
  withRateLimit
};