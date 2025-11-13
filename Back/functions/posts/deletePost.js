const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'eu-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.POSTS_TABLE;

/**
 * Fonction pour supprimer un post
 * DELETE /posts/{id}
 * Headers: Authorization (Cognito token requis)
 */
exports.handler = async (event) => {
  console.log('Delete post request:', event);

  try {
    // Récupérer l'ID du post
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

    // Récupérer les informations de l'utilisateur
    const userEmail = event.requestContext.authorizer.claims.email;
    const userGroups = event.requestContext.authorizer.claims['cognito:groups'] || 'guest';

    // Vérifier si le post existe
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

    // Vérifier les permissions (seul l'auteur ou un admin peut supprimer)
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
          error: 'Non autorisé à supprimer ce post'
        })
      };
    }

    // Supprimer le post
    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        postId: postId
      }
    });

    await dynamodb.send(deleteCommand);

    console.log('Post deleted successfully:', postId);

    // Réponse de succès
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Post supprimé avec succès',
        postId: postId
      })
    };

  } catch (error) {
    console.error('Delete post error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Erreur lors de la suppression du post',
        details: error.message
      })
    };
  }
};