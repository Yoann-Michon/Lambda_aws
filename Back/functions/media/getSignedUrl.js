const { withCors } = require('../../middleware/cors');
const { withRateLimit } = require('../../middleware/rateLimit');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({ region: 'eu-west-1' });
const BUCKET_NAME = process.env.MEDIA_BUCKET;
const STAGE = process.env.STAGE || 'dev';

const getSignedUrlsHandler = async (event) => {
  console.log('Generate signed URLs request');

  try {
    const body = JSON.parse(event.body);
    const { mediaKeys, expiresIn = 86400 } = body;

    if (!mediaKeys || !Array.isArray(mediaKeys)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'mediaKeys (array) is required'
        })
      };
    }

    const maxExpiration = 7 * 24 * 60 * 60;
    const validExpiresIn = Math.min(expiresIn, maxExpiration);

    const signedUrls = await Promise.all(
      mediaKeys.map(async (key) => {
        try {
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
      body: JSON.stringify({
        signedUrls: signedUrls
      })
    };

  } catch (error) {
    console.error('Get signed URLs error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error generating signed URLs',
        details: error.message
      })
    };
  }
};

exports.handler = withCors(withRateLimit(getSignedUrlsHandler, 100, 60000), STAGE);