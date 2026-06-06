const { getAllReports, listTechnicians, createTechnician, assignTechnician } = require('./admin');
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Mock the database connection
jest.mock('../config/db', () => ({
    execute: jest.fn()
}));

// Mock bcrypt for password hashing
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('mocked_hash_123')
}));

describe('Admin Controller - Unit Tests', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });


    // 1. Tests for getAllReports
    
    describe('getAllReports', () => {
        test('should return all reports from the database', async () => {
            const mockReports = [
                { id: 1, address: 'Address 1', status: 'NEW' },
                { id: 2, address: 'Address 2', status: 'IN_PROGRESS' }
            ];
            pool.execute.mockResolvedValueOnce([mockReports]);

            await getAllReports(req, res);

            expect(pool.execute).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockReports);
        });
    });

    
    // 2. Tests for listTechnicians
    
    describe('listTechnicians', () => {
        test('should return list of users with role technician', async () => {
            const mockTechs = [
                { id: 10, full_name: 'John Doe', email: 'john@tech.com' }
            ];
            pool.execute.mockResolvedValueOnce([mockTechs]);

            await listTechnicians(req, res);

            expect(pool.execute).toHaveBeenCalledWith(expect.any(String), ['technician']);
            expect(res.json).toHaveBeenCalledWith(mockTechs);
        });
    });


    // 3. Tests for createTechnician

    describe('createTechnician', () => {
        test('should return 409 if email is already registered', async () => {
            req.body = { email: 'exists@tech.com', password: 'password123', full_name: 'Tech Name' };
            
            // The query for checking email existence returns an existing record
            pool.execute.mockResolvedValueOnce([[{ id: 1 }]]);

            await createTechnician(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email already registered.'
            });
        });

        test('should hash password and create technician successfully', async () => {
            req.body = { email: 'new@tech.com', password: 'password123', full_name: 'New Tech' };
            
            // 1st Query: Check email (empty array = not found)
            pool.execute.mockResolvedValueOnce([[]]);
            // 2nd Query: The INSERT statement
            pool.execute.mockResolvedValueOnce([{}]);

            await createTechnician(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(pool.execute).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Technician created successfully.'
            });
        });
    });

    
    // 4. Tests for assignTechnician
    
    describe('assignTechnician', () => {
        test('should return 404 if technician does not exist', async () => {
            req.body = { report_id: '5', technician_id: '99' };
            
            // 1st Query: Check technician (returns empty array = not found)
            pool.execute.mockResolvedValueOnce([[]]);

            await assignTechnician(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Technician not found.'
            });
        });

        test('should return 404 if report does not exist', async () => {
            req.body = { report_id: '99', technician_id: '10' };
            
            // 1st Query: Check technician (found)
            pool.execute.mockResolvedValueOnce([[{ id: 10 }]]);
            // 2nd Query: Check report (not found)
            pool.execute.mockResolvedValueOnce([[]]);

            await assignTechnician(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Report not found.'
            });
        });

        test('should assign technician to report successfully', async () => {
            req.body = { report_id: '5', technician_id: '10' };
            
            // 1st Query: Check technician (found)
            pool.execute.mockResolvedValueOnce([[{ id: 10 }]]);
            // 2nd Query: Check report (found)
            pool.execute.mockResolvedValueOnce([[{ id: 5 }]]);
            // 3rd Query: The UPDATE statement
            pool.execute.mockResolvedValueOnce([{}]);

            await assignTechnician(req, res);

            expect(pool.execute).toHaveBeenCalledTimes(3);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Technician assigned successfully.'
            });
        });
    });
});