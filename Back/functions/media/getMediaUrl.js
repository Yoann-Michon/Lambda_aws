const { S3Client, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({ region: 'eu-west-1' });
const BUCKET_NAME = process.env.MEDIA_BUCKET;

/**
 * Fonction pour récupérer l'URL d'un média
 * GET /media/{key}
 * Accessible sans authentification (public)
 */
exports.handler = async (event) => {
  console.log('Get media URL request:', event);

  try {
    // Récupérer la clé du média depuis les paramètres de chemin
    const mediaKey = decodeURIComponent(event.pathParameters.key);

    if (!mediaKey) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Clé du média requise'
        })
      };
    }

    // Vérifier si le fichier existe dans S3
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: mediaKey
    });

    try {
      const headResult = await s3.send(headCommand);
      console.log('Media found:', headResult);

      // Générer une URL pré-signée valide pour 1 heure
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: mediaKey
      });

      const signedUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });

      // Construire l'URL publique
      const publicUrl = `https://${BUCKET_NAME}.s3.eu-west-1.amazonaws.com/${mediaKey}`;

      // Réponse de succès
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: mediaKey,
          publicUrl: publicUrl,
          signedUrl: signedUrl,
          metadata: {
            contentType: headResult.ContentType,
            contentLength: headResult.ContentLength,
            lastModified: headResult.LastModified,
            uploadedBy: headResult.Metadata?.uploadedby,
            originalFileName: headResult.Metadata?.originalfilename
          }
        })
      };

    } catch (headError) {
      // Le fichier n'existe pas
      if (headError.name === 'NotFound') {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: 'Média non trouvé'
          })
        };
      }
      throw headError;
    }

  } catch (error) {
    console.error('Get media URL error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Erreur lors de la récupération de l\'URL du média',
        details: error.message
      })
    };
  }
};