import * as connectionRepo from '../repositories/connection.repository.js';
import { findUserByEmailPrefix } from '../repositories/index.js';

export const sendRequest = async (req, res, next) => {
  try {
    const requesterId = req.user.id;
    const { recipientId } = req.body;

    if (requesterId === recipientId) {
      return res.status(400).json({ message: 'You cannot connect with yourself.' });
    }

    const existingConnection = await connectionRepo.findConnection(requesterId, recipientId);
    if (existingConnection) {
      return res
        .status(400)
        .json({ message: 'Connection request already exists or you are already connected.' });
    }

    const connection = await connectionRepo.createConnectionRequest(requesterId, recipientId);
    res.status(201).json(connection);
  } catch (err) {
    next(err);
  }
};

export const respondToRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { connectionId, status } = req.body; // status: 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    // Verify ownership first
    const existingRequest = await connectionRepo.findRequestById(connectionId);
    if (!existingRequest) {
      return res.status(404).json({ message: 'Connection request not found.' });
    }

    if (existingRequest.recipient.toString() !== userId) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to respond to this request.' });
    }

    if (existingRequest.status !== 'pending') {
      return res
        .status(400)
        .json({ message: `Connection request has already been ${existingRequest.status}.` });
    }

    const connection = await connectionRepo.updateConnectionStatus(connectionId, status);
    res.json(connection);
  } catch (err) {
    next(err);
  }
};

export const acceptConnection = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const connection = await connectionRepo.updateConnectionStatus(requestId, 'accepted');
    res.json({ message: 'Connection request accepted', connection });
  } catch (err) {
    next(err);
  }
};

export const getMyConnections = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const result = await connectionRepo.getAcceptedConnectionsPaginated(
      userId,
      page,
      limit,
      search
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteConnection = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;

    await connectionRepo.removeConnection(userId, connectionId);
    res.json({ message: 'Connection removed successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMyPendingRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await connectionRepo.getPendingRequestsPaginated(userId, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getConnectionStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let { targetUserId } = req.params;

    // Resolve email prefix to real MongoDB ObjectId (same logic as profile lookup)
    if (!/^[0-9a-fA-F]{24}$/.test(targetUserId)) {
      const user = await findUserByEmailPrefix(targetUserId);
      if (!user) return res.json({ status: 'none' });
      targetUserId = user._id.toString();
    }

    const connection = await connectionRepo.findConnection(userId, targetUserId);
    if (!connection) {
      return res.json({ status: 'none' });
    }
    return res.json({ status: connection.status, connectionId: connection._id });
  } catch (err) {
    next(err);
  }
};
