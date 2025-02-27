import bcrypt from 'bcryptjs';
import { log } from '../vite';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  log(`Generated password hash for new user`, 'auth');
  return hash;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hash);
    log(`Password verification result: ${isValid}`, 'auth');
    return isValid;
  } catch (error) {
    log(`Password verification error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'auth');
    return false;
  }
}
