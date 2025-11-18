const { withCors } = require('../../middleware/cors');
const { withRateLimit } = require('../../middleware/rateLimit');
const { 
  CognitoIdentityProviderClient, 
  ListUsersCommand,
  AdminListGroupsForUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-west-1' });
const STAGE = process.env.STAGE || 'dev';

const getUsersHandler = async (event) => {
  console.log('Get users request');

  try {
    const userGroups = event.requestContext.authorizer.claims['cognito:groups'] || '';
    const userEmail = event.requestContext.authorizer.claims.email;

    if (!userGroups.includes('admin')) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Access denied. Admin only.'
        })
      };
    }

    console.log('Admin user requesting users list:', userEmail);

    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 60;
    const paginationToken = queryParams.paginationToken || null;

    const listUsersCommand = new ListUsersCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Limit: Math.min(limit, 60),
      ...(paginationToken && { PaginationToken: paginationToken })
    });

    const result = await cognitoClient.send(listUsersCommand);

    const usersWithGroups = await Promise.all(
      result.Users.map(async (user) => {
        try {
          const getGroupsCommand = new AdminListGroupsForUserCommand({
            UserPoolId: process.env.USER_POOL_ID,
            Username: user.Username
          });

          const groupsData = await cognitoClient.send(getGroupsCommand);
          const userGroups = groupsData.Groups.map(group => group.GroupName);

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

    return {
      statusCode: 200,
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
      body: JSON.stringify({
        error: 'Error retrieving users',
        details: error.message
      })
    };
  }
};

exports.handler = withCors(withRateLimit(getUsersHandler, 30, 60000), STAGE);