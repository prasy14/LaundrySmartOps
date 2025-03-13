import { Router } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import { log } from '../vite';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';

const router = Router();

// Configure Passport's Local Strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await storage.getUserByUsername(username);
    log(`User found: ${user ? 'yes' : 'no'}`, 'auth');

    if (!user) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    const isValidPassword = await verifyPassword(password, user.password);
    log(`Password validation: ${isValidPassword ? 'success' : 'failed'}`, 'auth');

    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid credentials' });
    }

    return done(null, user);
  } catch (error) {
    log(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'auth');
    return done(error);
  }
}));

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', async (err: any, user: any, info: any) => {
    try {
      if (err) {
        log(`Login error: ${err.message}`, 'auth');
        return next(err);
      }

      if (!user) {
        log('Login failed - Invalid credentials', 'auth');
        return res.status(401).json({ message: info.message || 'Invalid credentials' });
      }

      req.logIn(user, async (err) => {
        if (err) {
          log(`Login error: ${err.message}`, 'auth');
          return next(err);
        }

        // Update last login time
        await storage.updateUserLastLogin(user.id);
        log(`Login successful for user: ${user.username}, Session ID: ${req.sessionID}`, 'auth');

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    } catch (error) {
      log(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'auth');
      next(error);
    }
  })(req, res, next);
});

router.post('/logout', (req, res) => {
  log(`Logout attempt - Session ID: ${req.sessionID}`, 'auth');
  req.logout((err) => {
    if (err) {
      log(`Logout error: ${err.message}`, 'auth');
      return res.status(500).json({ message: 'Failed to logout' });
    }
    log('Logout successful', 'auth');
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', (req, res) => {
  try {
    log(`Auth check - Session ID: ${req.sessionID}`, 'auth');

    if (!req.isAuthenticated()) {
      log('Auth check failed - Not authenticated', 'auth');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = req.user;
    log(`Auth check successful - User: ${user.username}`, 'auth');

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    log(`Auth check error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'auth');
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export default router;