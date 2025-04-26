/* ---------------------------------------------------------
   src/utils/config.ts
   Centralized configuration settings for the application
---------------------------------------------------------- */

// Environment types
export type Environment = 'development' | 'production' | 'test';

// Configuration interface
interface Config {
  api: {
    urls: Record<Environment, string>;
    currentEnvironment: Environment;
    timeout: number;
  };
  app: {
    name: string;
    version: string;
  };
}

// Application configuration
export const config: Config = {
  api: {
    urls: {
      production: 'https://werev.co.in/laravel/backend/library-backend/public/api',
      development: 'http://127.0.0.1:8000/api',
      test: 'http://localhost:8000/api'
    },
    // Use environment variable if available, otherwise default to production
    currentEnvironment: (import.meta.env.VITE_API_ENVIRONMENT as Environment) || 'production',
    timeout: 30000, // 30 seconds
  },
  app: {
    name: 'Werev Library',
    version: '1.0.0',
  }
};

// Helper functions to access configuration
export const getApiBaseUrl = (): string => {
  // Override with direct URL if provided
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  return config.api.urls[config.api.currentEnvironment];
};

// Utility to change environment at runtime
export const setEnvironment = (env: Environment): void => {
  config.api.currentEnvironment = env;
};

// Export global environment check helpers
export const isDevelopment = (): boolean => config.api.currentEnvironment === 'development';
export const isProduction = (): boolean => config.api.currentEnvironment === 'production';
export const isTest = (): boolean => config.api.currentEnvironment === 'test';