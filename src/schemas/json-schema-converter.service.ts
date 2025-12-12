export const convertToJSONSchema = (fields: any[], title: string): any => ({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title,
    type: 'object',
    properties: {},
    additionalProperties: false,
  });
