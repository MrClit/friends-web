import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().integer().default(3000),

  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().integer().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),

  TYPEORM_SYNC: Joi.boolean().default(false),
  TYPEORM_LOGGING: Joi.boolean().default(false),

  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('1d'),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),

  MICROSOFT_CLIENT_ID: Joi.string().required(),
  MICROSOFT_CLIENT_SECRET: Joi.string().required(),
  MICROSOFT_TENANT_ID: Joi.string().default('common'),
  MICROSOFT_CALLBACK_URL: Joi.string().uri().optional(),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  CLOUDINARY_AVATAR_FOLDER: Joi.string().optional(),

  FRONTEND_URL: Joi.string().default('http://localhost:5173/friends-web/#'),

  REFRESH_TOKEN_EXPIRATION_DAYS: Joi.number().integer().default(30),
});
