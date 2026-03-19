import mongoose from 'mongoose';

const connectDB = async () => {
  const connect = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 10,
      });
      console.log('MongoDB connected successfully.');
    } catch (error) {
      console.error(error);
      setTimeout(connect, 5000);
    }
  };

  await connect();
};

export default connectDB;
