const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const { withCors } = require('../../middleware/cors');

const dynamoClient = new DynamoDBClient({ region: 'eu-west-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: 'eu-west-1' });

const TABLE_NAME = process.env.POSTS_TABLE;
const BUCKET_NAME = process.env.MEDIA_BUCKET;

/**
 * Fonction pour uploader une image dans S3
 */
const uploadImageToS3 = async (imageData, userEmail) => {
  try {
    const { fileName, fileType, fileData } = imageData;
    
    // Générer un nom de fichier unique
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
    const s3Key = `media/${uniqueFileName}`;

    // Décoder le fichier base64
    const buffer = Buffer.from(fileData, 'base64');

    // Upload dans S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: fileType,
      Metadata: {
        originalFileName: fileName,
        uploadedBy: userEmail,
        uploadedAt: new Date().toISOString()
      }
    });

    await s3Client.send(uploadCommand);

    const imageUrl = `https://${BUCKET_NAME}.s3.eu-west-1.amazonaws.com/${s3Key}`;
    return imageUrl;
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw error;
  }
};

/**
 * Fonction pour créer un nouveau post avec images
 * POST /posts
 * Body: { title, content, author, tags, status, images: [{ fileName, fileType, fileData, caption }] }
 * Headers: Authorization (Cognito token requis)
 */
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { title, content, author, tags, status, images } = body;

    if (!title || !content || !author) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Title, content et author sont requis'
        })
      };
    }

    let userEmail = 'anonymous@blogify.com';
    let userName = 'Anonymous';
    let userGroups = 'guest';

    if (event.requestContext?.authorizer?.claims) {
      userEmail = event.requestContext.authorizer.claims.email || userEmail;
      userName = event.requestContext.authorizer.claims.name || userName;
      userGroups = event.requestContext.authorizer.claims['cognito:groups'] || userGroups;
    }


    let mediaUrls = [];
    if (images && Array.isArray(images) && images.length > 0) {
      
      const uploadPromises = images.map(image => uploadImageToS3(image, userEmail));
      mediaUrls = await Promise.all(uploadPromises);
    }

    const postId = crypto.randomUUID();
    const timestamp = Date.now();

    const post = {
      postId: postId,
      title: title,
      content: content,
      author: author,
      authorEmail: userEmail,
      authorName: userName,
      tags: tags || [],
      status: status || 'draft',
      mediaUrls: mediaUrls,
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: status === 'published' ? timestamp : null,
      views: 0
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: post
    });

    await dynamodb.send(command);
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Post créé avec succès',
        post: post
      })
    };

  } catch (error) {
    console.error('Create post error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Erreur lors de la création du post',
        details: error.message
      })
    };
  }
};