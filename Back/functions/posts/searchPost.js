const { withCors } = require('../../middleware/cors');
const { withRateLimit } = require('../../middleware/rateLimit');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'eu-west-1' });
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.POSTS_TABLE;
const STAGE = process.env.STAGE || 'dev';

const searchPostsHandler = async (event) => {
  console.log('Search posts request');

  try {
    const queryParams = event.queryStringParameters || {};
    const searchQuery = queryParams.q || '';
    const limit = parseInt(queryParams.limit) || 50;

    if (!searchQuery || searchQuery.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Search query is required'
        })
      };
    }

    const searchTerm = searchQuery.toLowerCase().trim();
    console.log('Searching for:', searchTerm);

    const params = {
      TableName: TABLE_NAME,
      FilterExpression: '#status = :published',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':published': 'published'
      },
      Limit: limit
    };

    const command = new ScanCommand(params);
    const result = await dynamodb.send(command);

    const filteredPosts = result.Items.filter(post => {
      const titleMatch = post.title?.toLowerCase().includes(searchTerm);
      const contentMatch = post.content?.toLowerCase().includes(searchTerm);
      const authorMatch = post.authorName?.toLowerCase().includes(searchTerm);
      const tagsMatch = post.tags?.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );

      return titleMatch || contentMatch || authorMatch || tagsMatch;
    });

    const sortedPosts = filteredPosts.sort((a, b) => {
      const aTitle = a.title?.toLowerCase() || '';
      const bTitle = b.title?.toLowerCase() || '';
      
      const aTitleExact = aTitle === searchTerm;
      const bTitleExact = bTitle === searchTerm;
      
      if (aTitleExact && !bTitleExact) return -1;
      if (!aTitleExact && bTitleExact) return 1;
      
      const aTitleStarts = aTitle.startsWith(searchTerm);
      const bTitleStarts = bTitle.startsWith(searchTerm);
      
      if (aTitleStarts && !bTitleStarts) return -1;
      if (!aTitleStarts && bTitleStarts) return 1;
      
      return b.createdAt - a.createdAt;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        posts: sortedPosts,
        count: sortedPosts.length,
        query: searchQuery,
        scannedCount: result.ScannedCount
      })
    };

  } catch (error) {
    console.error('Search posts error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error searching posts',
        details: error.message
      })
    };
  }
};

exports.handler = withCors(withRateLimit(searchPostsHandler, 50, 60000), STAGE);