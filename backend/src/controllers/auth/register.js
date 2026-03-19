import { registerService } from '../../services/auth.service.js';

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await registerService(email, password);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
