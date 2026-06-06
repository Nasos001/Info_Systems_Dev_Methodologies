const { createReport, getMyReports, editReport } = require('./report');
const pool = require('../config/db');

// Mocking the database connection
jest.mock('../config/db', () => ({
    execute: jest.fn()
}));

describe('Report Controller - Unit Tests', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            user: { id: 42 }, // Mocked logged-in user
            body: {},
            params: {},
            file: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    // 1. Tests for createReport
    describe('createReport', () => {
        test('should return 400 if no image file is uploaded', async () => {
            req.file = null; 

            await createReport(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Image file is required.' })
            );
        });

        test('should return 400 if Zod validation fails', async () => {
            req.file = { filename: 'pothole.jpg' };
            req.body = { category_id: '1', address: '', description: 'short' }; // Invalid data to trigger validation errors

            await createReport(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Validation failed' })
            );
        });

        test('should return 201 and insert report on success', async () => {
            req.file = { filename: 'pothole.jpg' };
            req.body = { category_id: '1', address: 'Athinas 12', description: 'Big pothole on the middle of the road' };
            
        
            pool.execute.mockResolvedValue([{}]);

            await createReport(req, res);

            expect(pool.execute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Report submitted successfully.'
            });
        });
    });

    
    // 2. Tests for getMyReports
    describe('getMyReports', () => {
        test('should return a list of reports for the logged in user', async () => {
            const mockReports = [
                { id: 1, address: 'Test 1', status: 'NEW' },
                { id: 2, address: 'Test 2', status: 'IN_PROGRESS' }
            ];
            
            pool.execute.mockResolvedValue([mockReports]);

            await getMyReports(req, res);

            expect(pool.execute).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockReports);
        });
    });

    // 3. Tests for editReport (Business Rules)

    describe('editReport', () => {
        test('should return 403 if user tries to edit someone else\'s report', async () => {
            req.params.id = '10';
            req.body = { address: 'New Address 123' };

            // Mocking the database response to return a report that belongs to another user
            pool.execute.mockResolvedValueOnce([[{ id: 10, user_id: 99, status: 'NEW' }]]);

            await editReport(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'You are not authorized to edit this report.' })
            );
        });

        test('should return 400 if report status is not NEW', async () => {
            req.params.id = '10';
            req.body = { address: 'New Address 123' };
            
            // Mocking the database response to return a report that belongs to the user but has status RESOLVED
            pool.execute.mockResolvedValueOnce([[{ id: 10, user_id: 42, status: 'RESOLVED' }]]);

            await editReport(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Only reports with status NEW can be edited.' })
            );
        });
        test('should return 200 and update database on valid request', async () => {
            req.params.id = '10';
            req.body = { address: 'Valid New Address' };
            
            // 1st Query: Check if the report exists (Returns that everything is ok)
            pool.execute.mockResolvedValueOnce([[{ id: 10, user_id: 42, status: 'NEW' }]]);
            // 2nd Query: updated query
            pool.execute.mockResolvedValueOnce([{}]);

            await editReport(req, res);

            expect(pool.execute).toHaveBeenCalledTimes(2);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Report updated successfully.'
            });
        });
    });
});