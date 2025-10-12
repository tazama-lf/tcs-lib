import {
  TransactionType,
  HttpMethod,
  ContentType,
  FieldType,
  EndpointStatus,
} from './core.interfaces';

describe('Core Interfaces', () => {
  describe('TransactionType', () => {
    it('should have TRANSFERS type', () => {
      expect(TransactionType.TRANSFERS).toBe('Transfers');
    });

    it('should have PAYMENTS type', () => {
      expect(TransactionType.PAYMENTS).toBe('Payments');
    });
  });

  describe('HttpMethod', () => {
    it('should have all HTTP methods', () => {
      expect(HttpMethod.GET).toBe('GET');
      expect(HttpMethod.POST).toBe('POST');
      expect(HttpMethod.PUT).toBe('PUT');
      expect(HttpMethod.DELETE).toBe('DELETE');
      expect(HttpMethod.PATCH).toBe('PATCH');
    });
  });

  describe('ContentType', () => {
    it('should have JSON content type', () => {
      expect(ContentType.JSON).toBe('application/json');
    });

    it('should have XML content type', () => {
      expect(ContentType.XML).toBe('application/xml');
    });
  });

  describe('FieldType', () => {
    it('should have all field types', () => {
      expect(FieldType.STRING).toBe('STRING');
      expect(FieldType.NUMBER).toBe('NUMBER');
      expect(FieldType.BOOLEAN).toBe('BOOLEAN');
      expect(FieldType.OBJECT).toBe('OBJECT');
      expect(FieldType.ARRAY).toBe('ARRAY');
      expect(FieldType.DATE).toBe('DATE');
    });
  });

  describe('EndpointStatus', () => {
    it('should have all endpoint statuses', () => {
      expect(EndpointStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(EndpointStatus.PENDING_APPROVAL).toBe('PENDING_APPROVAL');
      expect(EndpointStatus.UNDER_REVIEW).toBe('UNDER_REVIEW');
      expect(EndpointStatus.READY_FOR_DEPLOYMENT).toBe('READY_FOR_DEPLOYMENT');
      expect(EndpointStatus.DEPLOYED).toBe('DEPLOYED');
      expect(EndpointStatus.SUSPENDED).toBe('SUSPENDED');
      expect(EndpointStatus.PUBLISHED).toBe('PUBLISHED');
    });
  });
});
