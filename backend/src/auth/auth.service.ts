// src/auth/auth.service.ts

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // Simulate user credentials, replace this with a real DB call
  private readonly users = [
    {
      username: 'client123',
      password: '$2b$10$QdF5wqR6P6iL6b60I9C6B0CVq9l2Cm7Iuhw3e9b3l7OdVDCJwZTjm', // Hashed password 'securePassword'
    },
  ];

  // Validate user credentials
  async validateUser(username: string, password: string): Promise<any> {
    const user = this.users.find(user => user.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
      return { username: user.username }; // Return user info for JWT
    }
    return null;
  }

  // Generate JWT token
  async login(loginDto: { username: string; password: string }) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const payload = { username: user.username };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }
}