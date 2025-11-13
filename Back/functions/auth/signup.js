const { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand 
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-west-1' });

/**
 * Fonction pour inscrire un nouvel utilisateur
 * POST /auth/signup
 * Body: { email, password, name }
 */
exports.handler = async (event) => {
  console.log('Signup request:', JSON.stringify(event));

  try {
    // Parser le body de la requête
    const body = JSON.parse(event.body);
    const { email, password, name } = body;

    // Validation des données
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Email, password et name sont requis'
        })
      };
    }

    // Créer l'utilisateur dans Cognito
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
        { Name: 'email_verified', Value: 'true' }
      ],
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS'
    });

    const createUserResult = await cognitoClient.send(createUserCommand);
    console.log('User created:', createUserResult);

    // Définir le mot de passe permanent
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true
    });

    await cognitoClient.send(setPasswordCommand);

    // Ajouter au groupe "guest"
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      GroupName: 'guest'
    });

    await cognitoClient.send(addToGroupCommand);

    // Réponse de succès
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Utilisateur créé avec succès',
        userId: createUserResult.User.Username,
        email: email,
        name: name,
        group: 'guest'
      })
    };

  } catch (error) {
    console.error('Signup error:', error);

    let errorMessage = 'Erreur lors de la création du compte';
    let statusCode = 500;

    if (error.name === 'UsernameExistsException') {
      errorMessage = 'Cet email est déjà utilisé';
      statusCode = 409;
    } else if (error.name === 'InvalidPasswordException') {
      errorMessage = 'Le mot de passe ne respecte pas les exigences';
      statusCode = 400;
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