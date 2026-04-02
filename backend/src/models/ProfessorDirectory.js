import mongoose from 'mongoose';

const professorDirectorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  department: {
    type: String,
    required: true,
  },
});

const ProfessorDirectory = mongoose.model('ProfessorDirectory', professorDirectorySchema);

export default ProfessorDirectory;
