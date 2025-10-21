import Joi from 'joi';
import { validateConfig } from '.';

export const DatabaseConfigSchema = Joi.object({
  CONFIGURATION_DATABASE_HOST: Joi.string().required(),
  CONFIGURATION_DATABASE_PORT: Joi.number().default(5432),
  CONFIGURATION_DATABASE: Joi.string().required(),
  CONFIGURATION_DATABASE_USER: Joi.string().required(),
  CONFIGURATION_DATABASE_PASSWORD: Joi.string().required(),
});

export const databaseConfig = {
  host: validateConfig(process.env.CONFIGURATION_DATABASE_HOST!, DatabaseConfigSchema),
  port: validateConfig(process.env.CONFIGURATION_DATABASE_PORT!, DatabaseConfigSchema),
  database: validateConfig(process.env.CONFIGURATION_DATABASE!, DatabaseConfigSchema),
  user: validateConfig(process.env.CONFIGURATION_DATABASE_USER!, DatabaseConfigSchema),
  password: validateConfig(process.env.CONFIGURATION_DATABASE_PASSWORD!, DatabaseConfigSchema),
};
