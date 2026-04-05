import Notification from '../../models/Notification.js';
import User from '../../models/User.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 }) // Newest first
      .limit(50);
    res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { returnDocument: 'after' }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.status(200).json({ message: 'All notifications cleared' });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const { skillPreferences } = req.body;
    if (!Array.isArray(skillPreferences)) {
      return res.status(400).json({ message: 'skillPreferences must be an array' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { skillPreferences },
      { returnDocument: 'after' }
    ).select('skillPreferences');

    res.status(200).json({
      message: 'Preferences updated successfully',
      skillPreferences: user.skillPreferences,
    });
  } catch (error) {
    next(error);
  }
};
