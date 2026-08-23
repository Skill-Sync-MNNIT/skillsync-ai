import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/models/Connection.js', () => ({
  default: {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

const { default: Connection } = await import('../../../src/models/Connection.js');
const connRepo = await import('../../../src/repositories/connection.repository.js');

describe('ConnectionRepository Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createConnectionRequest', () => {
    it('should create a new connection request', async () => {
      const mockConn = { _id: 'c1', requester: 'u1', recipient: 'u2', status: 'pending' };
      Connection.create.mockResolvedValue(mockConn);

      const result = await connRepo.createConnectionRequest('u1', 'u2');

      expect(Connection.create).toHaveBeenCalledWith({ requester: 'u1', recipient: 'u2' });
      expect(result).toEqual(mockConn);
    });
  });

  describe('findConnection', () => {
    it('should search using $or to find a connection in both directions', async () => {
      Connection.findOne.mockResolvedValue({ _id: 'c1', status: 'accepted' });

      const result = await connRepo.findConnection('u1', 'u2');

      expect(Connection.findOne).toHaveBeenCalledWith({
        $or: [
          { requester: 'u1', recipient: 'u2' },
          { requester: 'u2', recipient: 'u1' },
        ],
      });
      expect(result.status).toBe('accepted');
    });
  });

  describe('updateConnectionStatus', () => {
    it('should set connectedAt when status is accepted', async () => {
      Connection.findByIdAndUpdate.mockResolvedValue({ _id: 'c1', status: 'accepted' });

      await connRepo.updateConnectionStatus('c1', 'accepted');

      expect(Connection.findByIdAndUpdate).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ status: 'accepted', connectedAt: expect.any(Number) }),
        { returnDocument: 'after' }
      );
    });

    it('should not set connectedAt for non-accepted statuses', async () => {
      Connection.findByIdAndUpdate.mockResolvedValue({ _id: 'c1', status: 'rejected' });

      await connRepo.updateConnectionStatus('c1', 'rejected');

      expect(Connection.findByIdAndUpdate).toHaveBeenCalledWith(
        'c1',
        { status: 'rejected' },
        { returnDocument: 'after' }
      );
    });
  });

  describe('removeConnection', () => {
    it('should delete a connection by ID with ownership check', async () => {
      Connection.findOneAndDelete.mockResolvedValue({ _id: 'c1' });

      await connRepo.removeConnection('u1', 'c1');

      expect(Connection.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'c1',
        $or: [{ requester: 'u1' }, { recipient: 'u1' }],
      });
    });
  });

  describe('getPendingRequestsPaginated', () => {
    it('should return paginated pending requests', async () => {
      const mockRequests = [{ _id: 'c1', status: 'pending' }];
      Connection.countDocuments.mockResolvedValue(1);
      Connection.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockRequests),
      });

      const result = await connRepo.getPendingRequestsPaginated('u1', 1, 10);

      expect(result.total).toBe(1);
      expect(result.pages).toBe(1);
      expect(result.requests).toEqual(mockRequests);
    });
  });
});
