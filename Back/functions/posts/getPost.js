const { withCors } = require('../../middleware/cors');
const { withRateLimit } = require('../../middleware/rateLimit');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'eu-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.POSTS_TABLE;
const STAGE = process.env.STAGE || 'dev';

const getPostHandler = async (event) => {
  console.log('Get post request');

  try {
    const postId = event.pathParameters?.id;

    if (!postId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Post ID required'
        })
      };
    }

    const skipView = event.queryStringParameters?.skipView === 'true';

    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        postId: postId
      }
    });

    const result = await dynamodb.send(getCommand);

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Post not found'
        })
      };
    }

    let post = result.Item;

    if (!skipView && result.Item.status === 'published') {
      console.log('Incrementing view count for post:', postId);
      
      const updateCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          postId: postId
        },
        UpdateExpression: 'SET #views = if_not_exists(#views, :zero) + :increment',
        ExpressionAttributeNames: {
          '#views': 'views'
        },
        ExpressionAttributeValues: {
          ':increment': 1,
          ':zero': 0
        },
        ReturnValues: 'ALL_NEW'
      });

      const updatedResult = await dynamodb.send(updateCommand);
      post = updatedResult.Attributes;
    } else {
      console.log('Skipping view increment');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        post: post
      })
    };

  } catch (error) {
    console.error('Get post error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error retrieving post',
        details: error.message
      })
    };
  }
};

exports.handler = withCors(withRateLimit(getPostHandler, 100, 60000), STAGE);