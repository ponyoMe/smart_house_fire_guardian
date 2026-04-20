// src/auth/auth.service.ts

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // Simulate user credentials, replace this with a real DB call
  private readonly users = [
    {
      username: '1234',
      password: '1234', // Plain password '1234'
    },
  ];

  // Validate user credentials
  async validateUser(username: string, password: string): Promise<any> {
    const user = this.users.find(user => user.username === username);
    if (user && user.password === password) { // Direct password comparison
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