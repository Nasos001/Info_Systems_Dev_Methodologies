const { getMyReports, updateStatus } = require('./tech'); 
const pool = require('../config/db');

// Mock the database connection
jest.mock('../config/db', () => ({
    execute: jest.fn()
}));

describe('Tech Controller - Unit Tests', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            user: { id: 100 }, 
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    
    // 1. TEST FOR getMyReports
   
    describe('getMyReports', () => {
        test('should return reports assigned to the logged-in technician', async () => {
            const mockTechReports = [
                { id: 1, address: 'Ermou 5', description: 'Broken tile', status: 'ONGOING' }
            ];
            pool.execute.mockResolvedValueOnce([mockTechReports]);

            await getMyReports(req, res);

            expect(pool.execute).toHaveBeenCalledWith(expect.any(String), [100]);
            expect(res.json).toHaveBeenCalledWith(mockTechReports);
        });
    });

    
    // 2. TEST FOR updateStatus
    
    describe('updateStatus', () => {
        test('should return 400 if param ID is invalid', async () => {
            req.params = { id: 'abc' }; 
            req.body = { status: 'ONGOING' };

            await updateStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: 'Validation failed' })
            );
        });

        test('should return 400 if status value is not in enum', async () => {
            req.params = { id: '1' };
            req.body = { status: 'INVALID_STATUS_NAME' }; 

            await updateStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: 'Validation failed' })
            );
        });

        test('should return 404 if report is not found or not assigned to this technician', async () => {
            req.params = { id: '1' };
            req.body = { status: 'ONGOING' };
            
        
            pool.execute.mockResolvedValueOnce([[]]);

            await updateStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Report not found or not assigned to you.'
            });
        });

        test('should update status successfully on valid request', async () => {
            req.params = { id: '1' };
            req.body = { status: 'COMPLETED' };
            
            // 1st Query: Check if report exists and is assigned to this technician
            pool.execute.mockResolvedValueOnce([[{ id: 1 }]]);
            // 2nd Query: The UPDATE statement
            pool.execute.mockResolvedValueOnce([{}]);

            await updateStatus(req, res);

            expect(pool.execute).toHaveBeenCalledTimes(2);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Status updated successfully.'
            });
        });
    });
});