const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({ region: 'eu-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.POSTS_TABLE;

/**
 * Fonction pour créer un nouveau post
 * POST /posts
 * Body: { title, content, author, tags, status, mediaUrls }
 * Headers: Authorization (Cognito token requis)
 */
exports.handler = async (event) => {
  console.log('Create post request:', JSON.stringify(event));

  try {
    // Parser le body de la requête
    const body = JSON.parse(event.body);
    const { title, content, author, tags, status, mediaUrls } = body;

    // Validation des données obligatoires
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

    // Récupérer les informations de l'utilisateur depuis le contexte Cognito
    let userEmail = 'anonymous@blogify.com';
    let userName = 'Anonymous';
    let userGroups = 'guest';

    if (event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.claims) {
      userEmail = event.requestContext.authorizer.claims.email || userEmail;
      userName = event.requestContext.authorizer.claims.name || userName;
      userGroups = event.requestContext.authorizer.claims['cognito:groups'] || userGroups;
    }

    console.log('User creating post:', { userEmail, userName, userGroups });

    // Générer un ID unique pour le post
    const postId = crypto.randomUUID();
    const timestamp = Date.now();

    // Créer l'objet post
    const post = {
      postId: postId,
      title: title,
      content: content,
      author: author,
      authorEmail: userEmail,
      authorName: userName,
      tags: tags || [],
      status: status || 'draft',
      mediaUrls: mediaUrls || [],
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: status === 'published' ? timestamp : null,
      views: 0
    };

    // Sauvegarder dans DynamoDB
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: post
    });

    await dynamodb.send(command);
    console.log('Post created successfully:', postId);

    // Réponse de succès
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