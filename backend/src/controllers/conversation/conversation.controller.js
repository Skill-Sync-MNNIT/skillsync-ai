import Conversation from '../../models/Conversation.js';

export const getUserConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // get latest 5 conversations
    const conversations = await Conversation.find({ userId }).sort({ updatedAt: -1 }).limit(5);

    res.json(conversations);
  } catch (err) {
    next(err);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const conversation = await Conversation.findOne({ _id: id, userId });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    res.json(conversation);
  } catch (err) {
    next(err);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await Conversation.findOneAndDelete({ _id: id, userId });
    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    next(err);
  }
};
