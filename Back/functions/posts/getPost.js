const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'eu-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.POSTS_TABLE;

/**
 * Fonction pour récupérer un post par son ID
 * GET /posts/{id}
 * Accessible sans authentification (public)
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
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Post non trouvé'
        })
      };
    }

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

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post: updatedResult.Attributes
      })
    };

  } catch (error) {
    console.error('Get post error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Erreur lors de la récupération du post',
        details: error.message
      })
    };
  }
};