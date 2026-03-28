import pool from '@/database/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, UserPublic, AuthRequest, AuthResponse } from '@/types';

export class UserService {
  /**
   * Register a new user
   */
  static async register(email: string, name: string, password: string): Promise<AuthResponse> {
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw { statusCode: 409, message: 'Email already registered' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    // Create user
    const result = await pool.query(
      'INSERT INTO users (id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, email, name, passwordHash, 'user']
    );

    const user = result.rows[0];
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    };
  }

  /**
   * Login
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    if (result.rows.length === 0) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<UserPublic | null> {
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Update user
   */
  static async updateUser(
    id: string,
    updates: { name?: string; email?: string }
  ): Promise<UserPublic> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, role`,
      values
    );

    return result.rows[0];
  }

  /**
   * Generate JWT token
   */
  private static generateToken(user: UserPublic): string {
    return jwt.sign(user, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }
}
