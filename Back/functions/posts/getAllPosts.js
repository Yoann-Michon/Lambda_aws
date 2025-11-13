const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'eu-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.POSTS_TABLE;

/**
 * Fonction pour récupérer tous les posts
 * GET /posts?status=published&limit=10
 * Accessible sans authentification (public)
 */
exports.handler = async (event) => {
  console.log('Get all posts request:', event);

  try {
    // Récupérer les paramètres de requête
    const queryParams = event.queryStringParameters || {};
    const status = queryParams.status; // Filter par status (draft, published)
    const limit = parseInt(queryParams.limit) || 20; // Limite par défaut: 20

    // Paramètres de base pour le scan
    let params = {
      TableName: TABLE_NAME,
      Limit: limit
    };

    // Si un filtre de status est spécifié
    if (status) {
      params.FilterExpression = '#status = :statusValue';
      params.ExpressionAttributeNames = {
        '#status': 'status'
      };
      params.ExpressionAttributeValues = {
        ':statusValue': status
      };
    }

    // Scanner la table DynamoDB
    const command = new ScanCommand(params);
    const result = await dynamodb.send(command);

    // Trier les posts par date de création (plus récent en premier)
    const sortedPosts = result.Items.sort((a, b) => b.createdAt - a.createdAt);

    // Réponse de succès
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        posts: sortedPosts,
        count: sortedPosts.length,
        scannedCount: result.ScannedCount
      })
    };

  } catch (error) {
    console.error('Get all posts error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Erreur lors de la récupération des posts',
        details: error.message
      })
    };
  }
};