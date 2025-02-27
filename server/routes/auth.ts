import { Router } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import { AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

router.post('/login', async (req: AuthenticatedRequest, res) => {
  try {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user.id;
    await storage.updateUserLastLogin(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', (req: AuthenticatedRequest, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
