const { 
  CognitoIdentityProviderClient, 
  AdminInitiateAuthCommand,
  AdminGetUserCommand,
  AdminListGroupsForUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-west-1' });

/**
 * Fonction pour connecter un utilisateur
 * POST /auth/login
 * Body: { email, password }
 */
exports.handler = async (event) => {
  console.log('Login request:', JSON.stringify(event));

  try {
    // Parser le body de la requête
    const body = JSON.parse(event.body);
    const { email, password } = body;

    // Validation des données
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Email et password sont requis'
        })
      };
    }

    // Authentifier l'utilisateur
    const authCommand = new AdminInitiateAuthCommand({
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      UserPoolId: process.env.USER_POOL_ID,
      ClientId: process.env.USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    const authResult = await cognitoClient.send(authCommand);
    console.log('Authentication successful');

    // Récupérer les informations de l'utilisateur
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email
    });

    const userData = await cognitoClient.send(getUserCommand);

    // Récupérer les groupes de l'utilisateur
    const getGroupsCommand = new AdminListGroupsForUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email
    });

    const groupsData = await cognitoClient.send(getGroupsCommand);
    const userGroups = groupsData.Groups.map(group => group.GroupName);

    // Extraire les attributs de l'utilisateur
    const userAttributes = {};
    userData.UserAttributes.forEach(attr => {
      userAttributes[attr.Name] = attr.Value;
    });

    // Réponse de succès avec les tokens
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Connexion réussie',
        accessToken: authResult.AuthenticationResult.AccessToken,
        idToken: authResult.AuthenticationResult.IdToken,
        refreshToken: authResult.AuthenticationResult.RefreshToken,
        expiresIn: authResult.AuthenticationResult.ExpiresIn,
        user: {
          email: userAttributes.email,
          name: userAttributes.name,
          groups: userGroups,
          emailVerified: userAttributes.email_verified === 'true'
        }
      })
    };

  } catch (error) {
    console.error('Login error:', error);

    let errorMessage = 'Erreur lors de la connexion';
    let statusCode = 500;

    if (error.name === 'NotAuthorizedException') {
      errorMessage = 'Email ou mot de passe incorrect';
      statusCode = 401;
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'Utilisateur non trouvé';
      statusCode = 404;
    } else if (error.name === 'UserNotConfirmedException') {
      errorMessage = 'Compte non confirmé';
      statusCode = 403;
    }

    return {
      statusCode: statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: errorMessage,
        details: error.message
      })
    };
  }
};