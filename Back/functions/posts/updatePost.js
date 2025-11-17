const { withCors } = require('../../middleware/cors');
const { withRateLimit } = require('../../middleware/rateLimit');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const dynamoClient = new DynamoDBClient({ region: 'eu-west-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: 'eu-west-1' });

const TABLE_NAME = process.env.POSTS_TABLE;
const BUCKET_NAME = process.env.MEDIA_BUCKET;
const STAGE = process.env.STAGE || 'dev';

const uploadImageToS3 = async (imageData, userEmail) => {
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

  return `https://${BUCKET_NAME}.s3.eu-west-1.amazonaws.com/${s3Key}`;
};

const updatePostHandler = async (event) => {
  console.log('Update post request');

  try {
    if (!event.requestContext?.authorizer?.claims) {
      console.error('No authorization context found');
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'Not authenticated. Missing or invalid token.'
        })
      };
    }

    const postId = event.pathParameters?.id;

    if (!postId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Post ID required'
        })
      };
    }

    const body = JSON.parse(event.body);
    const { title, content, tags, status, images, existingMediaUrls } = body;

    const userEmail = event.requestContext.authorizer.claims.email;
    const userGroups = event.requestContext.authorizer.claims['cognito:groups'] || 'guest';

    console.log('User updating post:', { userEmail, postId });

    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { postId: postId }
    });

    const existingPost = await dynamodb.send(getCommand);

    if (!existingPost.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Post not found'
        })
      };
    }

    const isOwner = existingPost.Item.authorEmail === userEmail;
    const isAdmin = userGroups.includes('admin');

    if (!isOwner && !isAdmin) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Not authorized to modify this post'
        })
      };
    }

    let newMediaUrls = [];
    if (images && Array.isArray(images) && images.length > 0) {
      console.log(`Uploading ${images.length} new images...`);
      const uploadPromises = images.map(image => uploadImageToS3(image, userEmail));
      newMediaUrls = await Promise.all(uploadPromises);
    }

    const allMediaUrls = [...(existingMediaUrls || []), ...newMediaUrls];

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

    console.log('Post updated successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Post updated successfully',
        post: result.Attributes
      })
    };

  } catch (error) {
    console.error('Update post error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error updating post',
        details: error.message
      })
    };
  }
};

exports.handler = withCors(withRateLimit(updatePostHandler, 30, 60000), STAGE);