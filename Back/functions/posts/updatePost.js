const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'eu-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.POSTS_TABLE;

exports.handler = async (event) => {
  console.log('Update post request:', event);

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
    const { title, content, tags, status, mediaUrls } = body;

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
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Post non trouvé'
        })
      };
    }

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

    if (mediaUrls !== undefined) {
      updateExpression += ', mediaUrls = :mediaUrls';
      expressionAttributeValues[':mediaUrls'] = mediaUrls;
    }

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
      Key: {
        postId: postId
      },
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