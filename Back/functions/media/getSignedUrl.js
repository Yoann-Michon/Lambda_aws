const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({ region: 'eu-west-1' });
const BUCKET_NAME = process.env.MEDIA_BUCKET;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Générer des URLs pré-signées pour plusieurs médias
 * POST /media/signed-urls
 * Body: { mediaKeys: [string], expiresIn: number }
 */
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { mediaKeys, expiresIn = 86400 } = body;

    if (!mediaKeys || !Array.isArray(mediaKeys)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'mediaKeys (array) est requis'
        })
      };
    }

    // Limiter l'expiration (max 7 jours)
    const maxExpiration = 7 * 24 * 60 * 60; // 7 jours
    const validExpiresIn = Math.min(expiresIn, maxExpiration);

    // Générer les URLs pré-signées
    const signedUrls = await Promise.all(
      mediaKeys.map(async (key) => {
        try {
          // Extraire juste la clé S3 (sans le domaine si présent)
          const s3Key = key.includes('amazonaws.com') 
            ? key.split('.com/')[1] 
            : key;

          const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key
          });

          const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: validExpiresIn
          });

          return {
            originalKey: key,
            signedUrl: signedUrl,
            expiresIn: validExpiresIn,
            expiresAt: new Date(Date.now() + validExpiresIn * 1000).toISOString()
          };
        } catch (error) {
          console.error(`Error signing URL for ${key}:`, error);
          return {
            originalKey: key,
            error: error.message
          };
        }
      })
    );

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        signedUrls: signedUrls
      })
    };

  } catch (error) {
    console.error('Get signed URLs error:', error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Erreur lors de la génération des URLs signées',
        details: error.message
      })
    };
  }
};