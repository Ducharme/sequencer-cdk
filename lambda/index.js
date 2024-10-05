const { ElastiCacheClient, ModifyUserCommand } = require("@aws-sdk/client-elasticache");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

exports.handler = async (event) => {
  const elasticache = new ElastiCacheClient();
  const secretsManager = new SecretsManagerClient();

  const { CustomUserID, SecretARN } = event.ResourceProperties;

  try {
    // Get the secret value
    const secretData = await secretsManager.send(new GetSecretValueCommand({ SecretId: SecretARN }));
    console.log("secretData.SecretString:" + secretData.SecretString);
    const password = secretData.SecretString;

    // Modify the custom user to set the password
    await elasticache.send(new ModifyUserCommand({
      UserId: CustomUserID,
      Passwords: [password]
    }));

    return { PhysicalResourceId: CustomUserID, Data: { Message: 'Passwords set successfully' } };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};