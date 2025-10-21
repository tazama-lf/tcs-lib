export const convertToJSONSchema = (fields: any[], title: string): any => {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title,
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
};
