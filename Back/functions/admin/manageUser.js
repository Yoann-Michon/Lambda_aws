const { withCors } = require('../../middleware/cors');
const { withRateLimit } = require('../../middleware/rateLimit');
const { 
  CognitoIdentityProviderClient, 
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminEnableUserCommand,
  AdminDeleteUserCommand,
  AdminListGroupsForUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'eu-west-1' });
const STAGE = process.env.STAGE || 'dev';

const manageUserHandler = async (event) => {
  console.log('Manage user request');

  try {
    const userGroups = event.requestContext.authorizer.claims['cognito:groups'] || '';
    const adminEmail = event.requestContext.authorizer.claims.email;

    if (!userGroups.includes('admin')) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Access denied. Admin only.'
        })
      };
    }

    const targetEmail = decodeURIComponent(event.pathParameters.email);
    const body = JSON.parse(event.body);
    const { action, groupName } = body;

    console.log('Admin action:', { adminEmail, targetEmail, action, groupName });

    if (targetEmail === adminEmail && (action === 'delete' || action === 'removeFromGroup')) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Cannot perform this action on your own account'
        })
      };
    }

    switch (action) {
      case 'addToGroup': {
        if (!groupName) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'groupName is required'
            })
          };
        }

        const getGroupsCommand = new AdminListGroupsForUserCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: targetEmail
        });

        const currentGroups = await cognitoClient.send(getGroupsCommand);
        const currentGroupNames = currentGroups.Groups.map(g => g.GroupName);

        if (currentGroupNames.includes(groupName)) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'User is already in this group'
            })
          };
        }

        const addCommand = new AdminAddUserToGroupCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: targetEmail,
          GroupName: groupName
        });

        await cognitoClient.send(addCommand);

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'User added to group successfully',
            email: targetEmail,
            groupName: groupName
          })
        };
      }

      case 'removeFromGroup': {
        if (!groupName) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'groupName is required'
            })
          };
        }

        const removeCommand = new AdminRemoveUserFromGroupCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: targetEmail,
          GroupName: groupName
        });

        await cognitoClient.send(removeCommand);

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'User removed from group successfully',
            email: targetEmail,
            groupName: groupName
          })
        };
      }

      case 'enable': {
        const enableCommand = new AdminEnableUserCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: targetEmail
        });

        await cognitoClient.send(enableCommand);

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'User enabled successfully',
            email: targetEmail
          })
        };
      }

      case 'delete': {
        const deleteCommand = new AdminDeleteUserCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: targetEmail
        });

        await cognitoClient.send(deleteCommand);

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'User deleted successfully',
            email: targetEmail
          })
        };
      }

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Invalid action. Must be: addToGroup, removeFromGroup, enable, or delete'
          })
        };
    }

  } catch (error) {
    console.error('Manage user error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error managing user',
        details: error.message
      })
    };
  }
};

exports.handler = withCors(withRateLimit(manageUserHandler, 20, 60000), STAGE);