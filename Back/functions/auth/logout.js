const { 
  CognitoIdentityProviderClient, 
  AdminUserGlobalSignOutCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-west-1' });

/**
 * Fonction pour déconnecter un utilisateur
 * POST /auth/logout
 * Headers: Authorization (Cognito token requis)
 */
exports.handler = async (event) => {

  try {
    // Récupérer l'email de l'utilisateur depuis le token
    const userEmail = event.requestContext.authorizer.claims.email;

    if (!userEmail) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Token invalide'
        })
      };
    }

    // Révoquer tous les tokens de l'utilisateur (global sign out)
    const signOutCommand = new AdminUserGlobalSignOutCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: userEmail
    });

    await cognitoClient.send(signOutCommand);

    // Réponse de succès
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Déconnexion réussie',
        email: userEmail
      })
    };

  } catch (error) {
    console.error('Logout error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Erreur lors de la déconnexion',
        details: error.message
      })
    };
  }
};