interface AuthPayload {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

class ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };

  constructor(message: string, response?: any) {
    super(message);
    this.response = response;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';

const getStoredTokens = () => {
  if (typeof window === 'undefined') return null;
  
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
};

const storeTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

const clearTokens = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

const graphqlRequest = async (query: string, variables?: any, requireAuth = false) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (requireAuth) {
    const tokens = getStoredTokens();
    if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
  }
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  
  const data = await response.json();
  
  if (data.errors) {
    throw new ApiError(data.errors[0]?.message || 'GraphQL error', {
      data: { message: data.errors[0]?.message },
    });
  }
  
  return data.data;
};

export const login = async (input: LoginInput): Promise<AuthPayload> => {
  const query = `
    mutation Login($input: LoginInput!) {
      login(loginInput: $input) {
        access_token
        refresh_token
        user {
          id
          email
          name
        }
      }
    }
  `;
  
  const data = await graphqlRequest(query, { input });
  const result = data.login;
  
  // Store tokens
  storeTokens(result.access_token, result.refresh_token);
  
  return result;
};

export const register = async (input: RegisterInput): Promise<AuthPayload> => {
  const query = `
    mutation Register($input: RegisterInput!) {
      register(registerInput: $input) {
        access_token
        refresh_token
        user {
          id
          email
          name
        }
      }
    }
  `;
  
  const data = await graphqlRequest(query, { input });
  const result = data.register;
  
  // Store tokens
  storeTokens(result.access_token, result.refresh_token);
  
  return result;
};

export const logout = () => {
  clearTokens();
};

export const getCurrentUser = async () => {
  const query = `
    query Me {
      me {
        id
        email
        name
        createdAt
        updatedAt
      }
    }
  `;
  
  try {
    const data = await graphqlRequest(query, null, true);
    return data.me;
  } catch (error) {
    // If authentication fails, clear tokens
    clearTokens();
    throw error;
  }
};

export const refreshTokens = async (): Promise<{ access_token: string; refresh_token: string }> => {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const query = `
    mutation RefreshToken($input: RefreshTokenInput!) {
      refreshToken(refreshTokenInput: $input) {
        access_token
        refresh_token
      }
    }
  `;
  
  const data = await graphqlRequest(query, {
    input: { refresh_token: tokens.refreshToken },
  });
  
  const result = data.refreshToken;
  
  // Store new tokens
  storeTokens(result.access_token, result.refresh_token);
  
  return result;
};