const { withCors } = require('../../middleware/cors');
const { withRateLimit } = require('../../middleware/rateLimit');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'eu-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.POSTS_TABLE;
const STAGE = process.env.STAGE || 'dev';

const deletePostHandler = async (event) => {
  console.log('Delete post request');

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

    const userEmail = event.requestContext.authorizer.claims.email;
    const userGroups = event.requestContext.authorizer.claims['cognito:groups'] || 'guest';

    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        postId: postId
      }
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
          error: 'Not authorized to delete this post'
        })
      };
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        postId: postId
      }
    });

    await dynamodb.send(deleteCommand);

    console.log('Post deleted successfully:', postId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Post deleted successfully',
        postId: postId
      })
    };

  } catch (error) {
    console.error('Delete post error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error deleting post',
        details: error.message
      })
    };
  }
};

exports.handler = withCors(withRateLimit(deletePostHandler, 20, 60000), STAGE);