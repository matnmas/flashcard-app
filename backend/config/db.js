const AWS = require('aws-sdk');

const configureAWS = () => {
  const config = {
    region: process.env.AWS_REGION || 'us-east-1'
  };
  
  // For local development, use credentials from .env file
  // In production, use IAM roles or environment variables
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    console.log('Using AWS credentials from environment variables');
  } else {
    console.log('No AWS credentials found in environment variables. Using default credential provider chain.');
  }
  
  AWS.config.update(config);
  return new AWS.DynamoDB.DocumentClient();
};

// Initialize DynamoDB client
const dynamoDB = configureAWS();

// Create DynamoDB tables if they don't exist
const initializeTables = async () => {
  const dynamoDBRaw = new AWS.DynamoDB();
  
  // Define table schemas
  const tables = [
    {
      TableName: 'CobitsUsers',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      TableName: 'CobitsDecks',
      KeySchema: [{ AttributeName: 'deckId', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'deckId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIndex',
          KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      TableName: 'CobitsFolders',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'folderName', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'folderName', AttributeType: 'S' }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
  ];

  // Create tables if they don't exist
  for (const tableSchema of tables) {
    try {
      await dynamoDBRaw.describeTable({ TableName: tableSchema.TableName }).promise();
      console.log(`Table ${tableSchema.TableName} already exists`);
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        try {
          await dynamoDBRaw.createTable(tableSchema).promise();
          console.log(`Created table ${tableSchema.TableName}`);
        } catch (createError) {
          console.error(`Error creating table ${tableSchema.TableName}:`, createError);
        }
      } else {
        console.error(`Error checking table ${tableSchema.TableName}:`, error);
      }
    }
  }
};

module.exports = {
  dynamoDB,
  initializeTables
};
