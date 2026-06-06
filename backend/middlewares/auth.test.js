
const { authenticateJWT, requireGuest, authorizeRole } = require('./auth'); 
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Auth Middleware - Unit Tests', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'testsecret';
    });


    // 1. CHECKS FOR authenticateJWT

    describe('authenticateJWT', () => {
        
        test('should set role to guest and call next() if no auth header exists', () => {
            authenticateJWT(req, res, next);

            expect(req.user).toEqual({ role: 'guest' });
            expect(next).toHaveBeenCalled();
        });

        test('should set role to guest and call next() if token is invalid (catch block)', () => {
            req.headers.authorization = 'Bearer invalid-token';
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid Token');
            });

            authenticateJWT(req, res, next);

            expect(req.user).toEqual({ role: 'guest' });
            expect(next).toHaveBeenCalled();
        });

        test('should populate req.user with decoded data if token is valid', () => {
            req.headers.authorization = 'Bearer valid-token';
            const mockUserData = { id: 1, role: 'citizen' };
            jwt.verify.mockReturnValue(mockUserData);

            authenticateJWT(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'testsecret');
            expect(req.user).toEqual({ id: 1, role: 'citizen' });
            expect(next).toHaveBeenCalled();
        });
    });


    // 2. CHECKS FOR requireGuest
    
    describe('requireGuest', () => {
        
        test('should call next() if user role is guest', () => {
            req.user = { role: 'guest' };

            requireGuest(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        test('should return 403 if user is already logged in (not guest)', () => {
            req.user = { role: 'citizen' };

            requireGuest(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'You are already logged in.'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });


    // 3. CHECKS FOR authorizeRole
    describe('authorizeRole', () => {
        
        test('should call next() if user role is included in allowed roles', () => {
            req.user = { role: 'admin' };
            
            const middleware = authorizeRole(['admin', 'employee']);
            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        test('should return 403 if user role is not allowed', () => {
            req.user = { role: 'citizen' };

            const middleware = authorizeRole(['admin']);
            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Forbidden: insufficient permissions.'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
});