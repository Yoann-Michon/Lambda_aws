const { withCors } = require('../../middleware/cors');
const { withRateLimit } = require('../../middleware/rateLimit');
const { 
  CognitoIdentityProviderClient, 
  AdminUserGlobalSignOutCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-west-1' });
const STAGE = process.env.STAGE || 'dev';

const logoutHandler = async (event) => {
  console.log('Logout request');

  try {
    const userEmail = event.requestContext.authorizer.claims.email;

    if (!userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid token'
        })
      };
    }

    const signOutCommand = new AdminUserGlobalSignOutCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: userEmail
    });

    await cognitoClient.send(signOutCommand);

    console.log('User logged out successfully:', userEmail);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Logout successful',
        email: userEmail
      })
    };

  } catch (error) {
    console.error('Logout error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error during logout',
        details: error.message
      })
    };
  }
};

exports.handler = withCors(withRateLimit(logoutHandler, 20, 60000), STAGE);