import { Router } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import { AuthenticatedRequest } from '../middleware/auth';
import { hashPassword, verifyPassword } from '../utils/auth';
import { log } from '../vite';

const router = Router();

router.post('/login', async (req: AuthenticatedRequest, res) => {
  try {
    const { username, password } = req.body;
    log(`Login attempt for user: ${username}`, 'auth');
    log(`Session ID before login: ${req.sessionID}`, 'auth');
    log(`Cookie Headers: ${req.headers.cookie}`, 'auth');

    const user = await storage.getUserByUsername(username);
    log(`User found: ${user ? 'yes' : 'no'}`, 'auth');

    if (!user) {
      log('User not found', 'auth');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await verifyPassword(password, user.password);
    log(`Password validation: ${isValidPassword ? 'success' : 'failed'}`, 'auth');

    if (!isValidPassword) {
      log('Invalid password', 'auth');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user.id;
    await req.session.save();
    await storage.updateUserLastLogin(user.id);
    log(`Login successful for user: ${username}, Session ID: ${req.sessionID}`, 'auth');

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    log(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'auth');
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', (req: AuthenticatedRequest, res) => {
  log(`Logout attempt - Session ID: ${req.sessionID}`, 'auth');
  req.session.destroy((err) => {
    if (err) {
      log(`Logout error: ${err.message}`, 'auth');
      return res.status(500).json({ message: 'Failed to logout' });
    }
    log('Logout successful', 'auth');
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', async (req: AuthenticatedRequest, res) => {
  try {
    log(`Auth check - Session ID: ${req.sessionID}, User ID: ${req.session.userId}`, 'auth');

    if (!req.session.userId) {
      log('Auth check failed - No user ID in session', 'auth');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      log('Auth check failed - User not found', 'auth');
      return res.status(401).json({ message: 'User not found' });
    }

    log(`Auth check successful - User: ${user.username}`, 'auth');
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    log(`Auth check error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'auth');
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;