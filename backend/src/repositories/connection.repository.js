import mongoose from 'mongoose';
import Connection from '../models/Connection.js';

export const createConnectionRequest = async (requesterId, recipientId) => {
  return await Connection.create({ requester: requesterId, recipient: recipientId });
};

export const findConnection = async (userAId, userBId) => {
  return await Connection.findOne({
    $or: [
      { requester: userAId, recipient: userBId },
      { requester: userBId, recipient: userAId },
    ],
  });
};

export const findRequestById = async (requestId) => {
  return await Connection.findById(requestId);
};

export const updateConnectionStatus = async (connectionId, status) => {
  const update = { status };
  if (status === 'accepted') {
    update.connectedAt = Date.now();
  }
  return await Connection.findByIdAndUpdate(connectionId, update, { returnDocument: 'after' });
};

export const getAcceptedConnections = async (userId) => {
  return await Connection.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: 'accepted',
  }).populate('requester recipient', 'name email role');
};

export const getAcceptedConnectionsPaginated = async (
  userId,
  page = 1,
  limit = 10,
  search = ''
) => {
  const skip = (page - 1) * limit;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  if (search) {
    // Advanced Aggregation for Search across populated fields
    const pipeline = [
      {
        $match: {
          $or: [{ requester: userObjectId }, { recipient: userObjectId }],
          status: 'accepted',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'requester',
          foreignField: '_id',
          as: 'requester',
        },
      },
      { $unwind: '$requester' },
      {
        $lookup: {
          from: 'users',
          localField: 'recipient',
          foreignField: '_id',
          as: 'recipient',
        },
      },
      { $unwind: '$recipient' },
      {
        $match: {
          $or: [
            {
              'requester.name': { $regex: search, $options: 'i' },
              'requester._id': { $ne: userObjectId },
            },
            {
              'recipient.name': { $regex: search, $options: 'i' },
              'recipient._id': { $ne: userObjectId },
            },
          ],
        },
      },
      { $sort: { connectedAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    const results = await Connection.aggregate(pipeline);
    const total = results[0]?.metadata[0]?.total || 0;
    const connections = results[0]?.data || [];

    return {
      connections,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  // Standard Query
  const query = {
    $or: [{ requester: userId }, { recipient: userId }],
    status: 'accepted',
  };

  const total = await Connection.countDocuments(query);
  const connections = await Connection.find(query)
    .sort({ connectedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('requester recipient', 'name email role');

  return {
    connections,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
};

export const removeConnection = async (userId, connectionId) => {
  return await Connection.findOneAndDelete({
    _id: connectionId,
    $or: [{ requester: userId }, { recipient: userId }],
  });
};

export const getPendingRequests = async (userId) => {
  return await Connection.find({ recipient: userId, status: 'pending' }).populate(
    'requester',
    'name email role'
  );
};

export const getPendingRequestsPaginated = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const query = { recipient: userId, status: 'pending' };

  const total = await Connection.countDocuments(query);
  const requests = await Connection.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('requester', 'name email role');

  return {
    requests,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
};
