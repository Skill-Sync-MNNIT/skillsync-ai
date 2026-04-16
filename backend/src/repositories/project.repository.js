import Project from '../models/Project.js';

export const createProject = async (data) => {
  return await Project.create(data);
};

export const findProjects = async (query = {}) => {
  return await Project.find(query).populate('owner', 'name email').sort({ createdAt: -1 });
};

export const getProjectById = async (id) => {
  return await Project.findById(id)
    .populate('owner', 'name email')
    .populate('participants', 'name email');
};

export const updateProject = async (id, update) => {
  return await Project.findByIdAndUpdate(id, update, { returnDocument: 'after' });
};

export const deleteProject = async (id) => {
  return await Project.findByIdAndDelete(id);
};
