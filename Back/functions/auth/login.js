const { withCors } = require('../../middleware/cors');
const { withRateLimit } = require('../../middleware/rateLimit');
const { 
  CognitoIdentityProviderClient, 
  AdminInitiateAuthCommand,
  AdminGetUserCommand,
  AdminListGroupsForUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-west-1' });
const STAGE = process.env.STAGE || 'dev';

const loginHandler = async (event) => {
  console.log('Login request');

  try {
    const body = JSON.parse(event.body);
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Email and password are required'
        })
      };
    }

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

    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email
    });

    const userData = await cognitoClient.send(getUserCommand);

    const getGroupsCommand = new AdminListGroupsForUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email
    });

    const groupsData = await cognitoClient.send(getGroupsCommand);
    const userGroups = groupsData.Groups.map(group => group.GroupName);

    const userAttributes = {};
    userData.UserAttributes.forEach(attr => {
      userAttributes[attr.Name] = attr.Value;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login successful',
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

    let errorMessage = 'Error during login';
    let statusCode = 500;

    if (error.name === 'NotAuthorizedException') {
      errorMessage = 'Incorrect email or password';
      statusCode = 401;
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'User not found';
      statusCode = 404;
    } else if (error.name === 'UserNotConfirmedException') {
      errorMessage = 'Account not confirmed';
      statusCode = 403;
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

exports.handler = withCors(withRateLimit(loginHandler, 10, 60000), STAGE);