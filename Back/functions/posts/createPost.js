const { withCors } = require('../../middleware/cors');
const { withRateLimit } = require('../../middleware/rateLimit');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
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
    ServerSideEncryption: 'AES256',
    Metadata: {
      originalFileName: fileName,
      uploadedBy: userEmail,
      uploadedAt: new Date().toISOString()
    }
  });

  await s3Client.send(uploadCommand);

  return s3Key;;
};

const createPostHandler = async (event) => {
  console.log('Create post with images request');

  try {
    const body = JSON.parse(event.body);
    const { title, content, author, tags, status, images } = body;

    if (!title || !content || !author) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Title, content and author are required'
        })
      };
    }

    let userEmail = 'anonymous@blogify.com';
    let userName = 'Anonymous';

    if (event.requestContext?.authorizer?.claims) {
      userEmail = event.requestContext.authorizer.claims.email || userEmail;
      userName = event.requestContext.authorizer.claims.name || userName;
    }

    console.log('User creating post:', { userEmail, userName });

    let mediaUrls = [];
    if (images && Array.isArray(images) && images.length > 0) {
      console.log(`Uploading ${images.length} images...`);
      
      const uploadPromises = images.map(image => uploadImageToS3(image, userEmail));
      mediaUrls = await Promise.all(uploadPromises);
      
      console.log('All images uploaded:', mediaUrls);
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
    console.log('Post created successfully with images:', postId);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Post created successfully',
        post: post
      })
    };

  } catch (error) {
    console.error('Create post error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error creating post',
        details: error.message
      })
    };
  }
};

exports.handler = withCors(withRateLimit(createPostHandler, 20, 60000), STAGE);