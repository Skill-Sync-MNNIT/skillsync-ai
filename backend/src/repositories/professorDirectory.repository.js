import ProfessorDirectory from '../models/ProfessorDirectory.js';

export const findProfessorByEmail = async (email) => {
  return await ProfessorDirectory.findOne({ email });
};

export const createProfessorDirectoryEntry = async (data) => {
  return await ProfessorDirectory.create(data);
};

export const upsertProfessorDirectoryEntry = async (email, data) => {
  return await ProfessorDirectory.findOneAndUpdate({ email }, data, {
    upsert: true,
    returnDocument: 'after',
  });
};
