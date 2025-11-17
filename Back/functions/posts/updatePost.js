const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

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
    
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
    const s3Key = `media/${userEmail}/${uniqueFileName}`;

    const buffer = Buffer.from(fileData, 'base64');

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
 * Fonction pour mettre à jour un post
 * PUT /posts/{id}
 * Body: { title, content, tags, status, images, existingMediaUrls }
 */
exports.handler = async (event) => {
  try {
    const postId = event.pathParameters.id;

    if (!postId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'ID du post requis'
        })
      };
    }

    const body = JSON.parse(event.body);
    const { title, content, tags, status, images, existingMediaUrls } = body;

    const userEmail = event.requestContext.authorizer.claims.email;
    const userGroups = event.requestContext.authorizer.claims['cognito:groups'] || 'guest';

    // Vérifier si le post existe
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { postId: postId }
    });

    const existingPost = await dynamodb.send(getCommand);

    if (!existingPost.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Post non trouvé'
        })
      };
    }

    // Vérifier les permissions
    const isOwner = existingPost.Item.authorEmail === userEmail;
    const isAdmin = userGroups.includes('admin');

    if (!isOwner && !isAdmin) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Non autorisé à modifier ce post'
        })
      };
    }

    // Uploader les nouvelles images
    let newMediaUrls = [];
    if (images && Array.isArray(images) && images.length > 0) {
      const uploadPromises = images.map(image => uploadImageToS3(image, userEmail));
      newMediaUrls = await Promise.all(uploadPromises);
    }

    // Combiner les URLs existantes et nouvelles
    const allMediaUrls = [...(existingMediaUrls || []), ...newMediaUrls];

    // Construire l'expression de mise à jour
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues = {
      ':updatedAt': Date.now()
    };
    const expressionAttributeNames = {};

    if (title) {
      updateExpression += ', title = :title';
      expressionAttributeValues[':title'] = title;
    }

    if (content) {
      updateExpression += ', content = :content';
      expressionAttributeValues[':content'] = content;
    }

    if (tags) {
      updateExpression += ', tags = :tags';
      expressionAttributeValues[':tags'] = tags;
    }

    updateExpression += ', mediaUrls = :mediaUrls';
    expressionAttributeValues[':mediaUrls'] = allMediaUrls;

    if (status) {
      updateExpression += ', #status = :status';
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;

      if (status === 'published' && !existingPost.Item.publishedAt) {
        updateExpression += ', publishedAt = :publishedAt';
        expressionAttributeValues[':publishedAt'] = Date.now();
      }
    }

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { postId: postId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ...(Object.keys(expressionAttributeNames).length > 0 && {
        ExpressionAttributeNames: expressionAttributeNames
      }),
      ReturnValues: 'ALL_NEW'
    });

    const result = await dynamodb.send(updateCommand);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Post mis à jour avec succès',
        post: result.Attributes
      })
    };

  } catch (error) {
    console.error('Update post error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Erreur lors de la mise à jour du post',
        details: error.message
      })
    };
  }
};