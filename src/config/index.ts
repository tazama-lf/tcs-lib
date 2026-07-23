import type Joi from 'joi';

export const validateConfig = (config: string | number, schema: Joi.ObjectSchema): unknown => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Joi's validate returns ValidationResult with any-typed value
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
