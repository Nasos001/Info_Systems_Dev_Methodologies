import client from '../client';
import { type LoginInput, type RegisterInput } from '../../schemas/auth';
import { AuthResponseSchema, GenericMessageSchema } from '../../schemas/common';

export const authService = {
  async login(data: LoginInput) {
    const response = await client.post('/auth/login', data);
    return AuthResponseSchema.parse(response.data);
  },
  async register(data: RegisterInput) {
    const response = await client.post('/auth/register', data);
    return GenericMessageSchema.parse(response.data);
  },
};
