const { 
  CognitoIdentityProviderClient, 
  ListUsersCommand,
  AdminListGroupsForUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-west-1' });

/**
 * Fonction pour récupérer tous les utilisateurs (Admin uniquement)
 * GET /admin/users?limit=60
 * Headers: Authorization (Cognito token requis - Admin uniquement)
 */
exports.handler = async (event) => {
  console.log('Get users request:', JSON.stringify(event));

  try {
    // Récupérer les informations de l'utilisateur
    const userGroups = event.requestContext?.authorizer?.claims['cognito:groups'] || '';
    const userEmail = event.requestContext?.authorizer?.claims?.email;

    // Vérifier que l'utilisateur est admin
    if (!userGroups.includes('admin')) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Accès refusé. Réservé aux administrateurs uniquement.'
        })
      };
    }

    console.log('Admin user requesting users list:', userEmail);

    // Récupérer les paramètres de requête
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 60;
    const paginationToken = queryParams.paginationToken || null;

    // Lister les utilisateurs du User Pool
    const listUsersCommand = new ListUsersCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Limit: Math.min(limit, 60),
      ...(paginationToken && { PaginationToken: paginationToken })
    });

    const result = await cognitoClient.send(listUsersCommand);

    // Enrichir les données utilisateur avec leurs groupes
    const usersWithGroups = await Promise.all(
      result.Users.map(async (user) => {
        try {
          // Récupérer les groupes de l'utilisateur
          const getGroupsCommand = new AdminListGroupsForUserCommand({
            UserPoolId: process.env.USER_POOL_ID,
            Username: user.Username
          });

          const groupsData = await cognitoClient.send(getGroupsCommand);
          const userGroups = groupsData.Groups.map(group => group.GroupName);

          // Extraire les attributs de l'utilisateur
          const attributes = {};
          user.Attributes.forEach(attr => {
            attributes[attr.Name] = attr.Value;
          });

          return {
            username: user.Username,
            email: attributes.email || 'N/A',
            name: attributes.name || 'N/A',
            emailVerified: attributes.email_verified === 'true',
            groups: userGroups,
            status: user.UserStatus,
            enabled: user.Enabled,
            createdAt: user.UserCreateDate,
            lastModified: user.UserLastModifiedDate
          };
        } catch (error) {
          console.error(`Error getting groups for user ${user.Username}:`, error);
          
          // Retourner les données de base même en cas d'erreur
          const attributes = {};
          user.Attributes.forEach(attr => {
            attributes[attr.Name] = attr.Value;
          });

          return {
            username: user.Username,
            email: attributes.email || 'N/A',
            name: attributes.name || 'N/A',
            emailVerified: attributes.email_verified === 'true',
            groups: [],
            status: user.UserStatus,
            enabled: user.Enabled,
            createdAt: user.UserCreateDate,
            lastModified: user.UserLastModifiedDate
          };
        }
      })
    );

    // Réponse de succès
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        users: usersWithGroups,
        count: usersWithGroups.length,
        paginationToken: result.PaginationToken || null,
        hasMore: !!result.PaginationToken
      })
    };

  } catch (error) {
    console.error('Get users error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Erreur lors de la récupération des utilisateurs',
        details: error.message
      })
    };
  }
};