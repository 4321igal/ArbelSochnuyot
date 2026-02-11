import { 
  SecretsManagerClient, 
  GetSecretValueCommand 
} from '@aws-sdk/client-secrets-manager';
import { 
  SSMClient, 
  GetParameterCommand 
} from '@aws-sdk/client-ssm';

/**
 * Secrets Manager & SSM Parameter Store Client
 * 
 * Features:
 * - Fetch secrets from Secrets Manager
 * - Fetch parameters from SSM Parameter Store
 * - Caching to reduce API calls
 * - Error handling with retries
 */

// Clients
const secretsClient = new SecretsManagerClient({});
const ssmClient = new SSMClient({});

// Cache for secrets (Lambda container reuse)
const secretsCache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get secret from AWS Secrets Manager
 * 
 * @param secretName - Full secret name (e.g., 'amplify/ecommerce/OPENAI_API_KEY')
 * @returns Secret value as string
 */
export async function getSecret(secretName: string): Promise<string> {
  // Check cache first
  const cached = secretsCache.get(secretName);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await secretsClient.send(command);
    
    if (!response.SecretString) {
      throw new Error(`Secret ${secretName} has no string value`);
    }

    // Try to parse as JSON (for key-value secrets)
    try {
      const parsed = JSON.parse(response.SecretString);
      if (typeof parsed === 'object' && parsed !== null) {
        // Return the first value if it's a JSON object
        const value = Object.values(parsed)[0] as string;
        cacheSecret(secretName, value);
        return value;
      }
    } catch {
      // Not JSON, use raw string
    }

    cacheSecret(secretName, response.SecretString);
    return response.SecretString;

  } catch (error) {
    console.error(`Failed to get secret ${secretName}:`, error);
    throw new Error(`Failed to retrieve secret: ${secretName}`);
  }
}

/**
 * Get parameter from SSM Parameter Store
 * 
 * @param parameterName - Full parameter name
 * @param decrypt - Whether to decrypt SecureString parameters
 * @returns Parameter value
 */
export async function getParameter(
  parameterName: string, 
  decrypt = true
): Promise<string> {
  // Check cache first
  const cached = secretsCache.get(parameterName);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: decrypt,
    });

    const response = await ssmClient.send(command);
    
    if (!response.Parameter?.Value) {
      throw new Error(`Parameter ${parameterName} has no value`);
    }

    cacheSecret(parameterName, response.Parameter.Value);
    return response.Parameter.Value;

  } catch (error) {
    console.error(`Failed to get parameter ${parameterName}:`, error);
    throw new Error(`Failed to retrieve parameter: ${parameterName}`);
  }
}

/**
 * Cache secret value
 */
function cacheSecret(key: string, value: string): void {
  secretsCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Clear secrets cache (useful for testing)
 */
export function clearSecretsCache(): void {
  secretsCache.clear();
}
