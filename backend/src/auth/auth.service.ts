// src/auth/auth.service.ts

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // user credentials
  private readonly users = [
    {
      id: '1234',
      username: '1234',
      password: '1234', // plain 
    },
  ];

  // Validate user credentials
  async validateUser(username: string, password: string): Promise<any> {
    const user = this.users.find(user => user.username === username);
    if (user && user.password === password) { 
      return { id: user.id, username: user.username }; 
    }
    return null;
  }

  
  async login(loginDto: { username: string; password: string }) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }
}