import { registerService } from '../../services/auth.service.js';

export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const result = await registerService(email, password, role);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
