import { JSONSchemaType, JSONSchemaFormat } from './json-schema.interfaces';

describe('JSON Schema Interfaces', () => {
  describe('JSONSchemaType', () => {
    it('should have all JSON schema types', () => {
      expect(JSONSchemaType.STRING).toBe('string');
      expect(JSONSchemaType.NUMBER).toBe('number');
      expect(JSONSchemaType.INTEGER).toBe('integer');
      expect(JSONSchemaType.BOOLEAN).toBe('boolean');
      expect(JSONSchemaType.OBJECT).toBe('object');
      expect(JSONSchemaType.ARRAY).toBe('array');
      expect(JSONSchemaType.NULL).toBe('null');
    });
  });

  describe('JSONSchemaFormat', () => {
    it('should have all JSON schema formats', () => {
      expect(JSONSchemaFormat.DATE_TIME).toBe('date-time');
      expect(JSONSchemaFormat.DATE).toBe('date');
      expect(JSONSchemaFormat.TIME).toBe('time');
      expect(JSONSchemaFormat.EMAIL).toBe('email');
      expect(JSONSchemaFormat.HOSTNAME).toBe('hostname');
      expect(JSONSchemaFormat.IPV4).toBe('ipv4');
      expect(JSONSchemaFormat.IPV6).toBe('ipv6');
      expect(JSONSchemaFormat.URI).toBe('uri');
      expect(JSONSchemaFormat.UUID).toBe('uuid');
    });
  });
});
