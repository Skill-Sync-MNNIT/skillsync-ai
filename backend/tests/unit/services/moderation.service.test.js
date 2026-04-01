import { jest } from '@jest/globals';

global.fetch = jest.fn();

const { ModerationService } = await import('../../../src/services/jobs/moderation.service.js');

describe('ModerationService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scanJobPost', () => {
    it('should return moderation result on success', async () => {
      const mockResult = { passed: true, violation_type: null, confidence: 0.95 };

      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResult),
      });

      const result = await ModerationService.scanJobPost('job123', 'Test Job', 'Test Description');

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should return fail-safe result on fetch error', async () => {
      global.fetch.mockRejectedValue(new Error('Network Error'));

      const result = await ModerationService.scanJobPost('job123', 'Test Job', 'Test Description');

      expect(result.passed).toBe(false);
      expect(result.violation_type).toBe('service_error/network');
    });
  });
});
