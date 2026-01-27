import type Joi from 'joi';

export const validateConfig = (config: string | number, schema: Joi.ObjectSchema): unknown => {
  const { error, value } = schema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(`Database configuration validation error: ${error.message}`);
  }

  return value;
};
