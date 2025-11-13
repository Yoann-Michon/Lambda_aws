const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3 = new S3Client({ region: 'eu-west-1' });
const BUCKET_NAME = process.env.MEDIA_BUCKET;

/**
 * Fonction pour uploader un média (image, vidéo)
 * POST /media/upload
 * Body: { fileName, fileType, fileData (base64) }
 * Headers: Authorization (Cognito token requis)
 */
exports.handler = async (event) => {
  console.log('Upload media request:', event);

  try {
    // Parser le body de la requête
    const body = JSON.parse(event.body);
    const { fileName, fileType, fileData } = body;

    // Validation des données
    if (!fileName || !fileType || !fileData) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'fileName, fileType et fileData sont requis'
        })
      };
    }

    // Vérifier le type de fichier (uniquement images et vidéos)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mpeg',
      'video/quicktime'
    ];

    if (!allowedTypes.includes(fileType)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Type de fichier non autorisé. Seules les images et vidéos sont acceptées.'
        })
      };
    }

    // Récupérer les informations de l'utilisateur
    const userEmail = event.requestContext.authorizer.claims.email;

    // Générer un nom de fichier unique (natif Node.js 18)
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
    const s3Key = `media/${userEmail}/${uniqueFileName}`;

    // Décoder le fichier base64
    const buffer = Buffer.from(fileData, 'base64');

    // Paramètres pour uploader dans S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: fileType,
      ACL: 'public-read',
      Metadata: {
        originalFileName: fileName,
        uploadedBy: userEmail,
        uploadedAt: new Date().toISOString()
      }
    });

    // Uploader le fichier dans S3
    await s3.send(uploadCommand);

    const uploadUrl = `https://${BUCKET_NAME}.s3.eu-west-1.amazonaws.com/${s3Key}`;
    console.log('File uploaded successfully:', uploadUrl);

    // Réponse de succès
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Fichier uploadé avec succès',
        media: {
          key: s3Key,
          url: uploadUrl,
          bucket: BUCKET_NAME,
          fileName: uniqueFileName,
          originalFileName: fileName,
          fileType: fileType,
          uploadedBy: userEmail,
          uploadedAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Upload media error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Erreur lors de l\'upload du fichier',
        details: error.message
      })
    };
  }
};