const { register, login } = require('./auth'); 
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 1. Mock the database connection
jest.mock('../config/db', () => ({
    execute: jest.fn()
}));

// 2. Mock the bcrypt 
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('mocked_hash_value'),
    compare: jest.fn()
}));

// 3. Mock the jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mocked_jwt_token_xyz')
}));

describe('Auth Controller - Unit Tests', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'testsecret';
    });

    
    // 1. TEST FOR REGISTER
    
    describe('register', () => {
        test('should return 400 if validation fails', async () => {
            req.body = { email: 'invalid-email', password: '123', full_name: '' };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: 'Validation failed' })
            );
        });

        test('should return 409 if email already exists', async () => {
            req.body = { email: 'citizen@test.com', password: 'password123', full_name: 'Giannis Papadopoulos' };
            
            // The query returns that it found an existing record with this email
            pool.execute.mockResolvedValueOnce([[{ id: 1 }]]);

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email already registered.'
            });
        });

        test('should return 201 on successful registration', async () => {
            req.body = { email: 'newcitizen@test.com', password: 'password123', full_name: 'Giannis Papadopoulos' };
            
            // 1st Query: Check email (returns empty array = available)
            pool.execute.mockResolvedValueOnce([[]]);
            // 2nd Query: The INSERT statement
            pool.execute.mockResolvedValueOnce([{}]);

            await register(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(pool.execute).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Registration successful.'
            });
        });
    });

    
    // 2. TEST FOR LOGIN
    
    describe('login', () => {
        test('should return 401 if user email is not found in database', async () => {
            req.body = { email: 'notfound@test.com', password: 'password123' };
            
            // The SELECT query returns an empty array = user not found
            pool.execute.mockResolvedValueOnce([[]]);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid email or password.'
            });
        });

        test('should return 401 if password does not match', async () => {
            req.body = { email: 'citizen@test.com', password: 'wrongpassword' };
            
            // Finds the user in the database
            const mockUser = { id: 1, email: 'citizen@test.com', password: 'hashed_password_in_db', role: 'citizen', full_name: 'Giannis' };
            pool.execute.mockResolvedValueOnce([[mockUser]]);
            
            // The bcrypt.compare returns false (wrong password)
            bcrypt.compare.mockResolvedValueOnce(false);

            await login(req, res);

            expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashed_password_in_db');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid email or password.'
            });
        });

        test('should return token and user data on successful login', async () => {
            req.body = { email: 'citizen@test.com', password: 'correctpassword' };
            
            const mockUser = { id: 1, email: 'citizen@test.com', password: 'hashed_password_in_db', role: 'citizen', full_name: 'Giannis' };
            pool.execute.mockResolvedValueOnce([[mockUser]]);
            
            // The bcrypt.compare returns true (correct password)
            bcrypt.compare.mockResolvedValueOnce(true);

            await login(req, res);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockUser.id, role: mockUser.role },
                'testsecret',
                { expiresIn: '24h' }
            );
            expect(res.json).toHaveBeenCalledWith({
                token: 'mocked_jwt_token_xyz',
                role: 'citizen',
                user: { id: 1, full_name: 'Giannis', email: 'citizen@test.com' }
            });
        });
    });
});