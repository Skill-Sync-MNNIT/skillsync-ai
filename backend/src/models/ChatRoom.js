import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
    lastMessageDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage',
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

export default ChatRoom;
