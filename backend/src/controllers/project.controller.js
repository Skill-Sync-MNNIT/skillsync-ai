import * as projectRepo from '../repositories/project.repository.js';

export const postProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'student') {
      return res.status(403).json({ message: 'Only students can post projects.' });
    }

    const { title, description, requiredSkills } = req.body;
    const project = await projectRepo.createProject({
      title,
      description,
      owner: userId,
      requiredSkills,
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

export const getAllProjects = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    // "this project only visible only to the student not the other user"
    if (userRole !== 'student') {
      return res.status(403).json({ message: 'Project board is only accessible to students.' });
    }

    const projects = await projectRepo.findProjects();
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

export const getSingleProject = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const { id } = req.params;

    if (userRole !== 'student') {
      return res.status(403).json({ message: 'Project details are only accessible to students.' });
    }

    const project = await projectRepo.getProjectById(id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, requiredSkills, status } = req.body;

    const project = await projectRepo.getProjectById(id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (project.owner._id.toString() !== userId) {
      return res.status(403).json({ message: 'You are not authorized to update this project.' });
    }

    const updated = await projectRepo.updateProject(id, {
      title,
      description,
      requiredSkills,
      status,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const project = await projectRepo.getProjectById(id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (project.owner._id.toString() !== userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this project.' });
    }

    await projectRepo.deleteProject(id);
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
