const { withCors } = require('../../middleware/cors');
const { withRateLimit } = require('../../middleware/rateLimit');
const { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand 
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-west-1' });
const STAGE = process.env.STAGE || 'dev';

const signupHandler = async (event) => {
  console.log('Signup request');

  try {
    const body = JSON.parse(event.body);
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Email, password and name are required'
        })
      };
    }

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

    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true
    });

    await cognitoClient.send(setPasswordCommand);

    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      GroupName: 'editor'
    });

    await cognitoClient.send(addToGroupCommand);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User created successfully',
        userId: createUserResult.User.Username,
        email: email,
        name: name,
        group: 'editor'
      })
    };

  } catch (error) {
    console.error('Signup error:', error);

    let errorMessage = 'Error creating account';
    let statusCode = 500;

    if (error.name === 'UsernameExistsException') {
      errorMessage = 'This email is already in use';
      statusCode = 409;
    } else if (error.name === 'InvalidPasswordException') {
      errorMessage = 'Password does not meet requirements';
      statusCode = 400;
    }

    return {
      statusCode: statusCode,
      body: JSON.stringify({
        error: errorMessage,
        details: error.message
      })
    };
  }
};

exports.handler = withCors(withRateLimit(signupHandler, 5, 60000), STAGE);