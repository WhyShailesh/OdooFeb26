export const env = {
  JWT_SECRET: process.env.JWT_SECRET || 'fleetflow-jwt-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
