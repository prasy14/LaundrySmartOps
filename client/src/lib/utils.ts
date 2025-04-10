import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility to check if a secret or API key exists
 * @param key The environment variable name to check
 * @returns Boolean indicating if the key exists
 */
export function check(key: string): boolean {
  return typeof process.env[key] !== 'undefined'
}
