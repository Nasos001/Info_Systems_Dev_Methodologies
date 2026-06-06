const upload = require('./upload');

describe('Upload Middleware - Unit Tests', () => {
    let req;
    let file;
    let cb;

    beforeEach(() => {
        req = {};
        cb = jest.fn();
    });

    // 1. CHECKS FOR THE FILE FILTER (File Types)

    describe('fileFilter', () => {
        
        const fileFilter = upload.fileFilter;

        test('should accept valid image extensions (.png)', () => {
            file = { originalname: 'pothole.PNG' }; //checking for uppercase extension as well

            fileFilter(req, file, cb);

            
            expect(cb).toHaveBeenCalledWith(null, true);
        });

        test('should accept valid image extensions (.jpg / .jpeg)', () => {
            file = { originalname: 'broken_light.jpg' };

            fileFilter(req, file, cb);

            expect(cb).toHaveBeenCalledWith(null, true);
        });

        test('should reject invalid extensions (e.g. .pdf) and return an error', () => {
            file = { originalname: 'document.pdf' };

            fileFilter(req, file, cb);

            expect(cb).toHaveBeenCalledWith(
                expect.any(Error),
                false
            );
            
            // Checking the error message to ensure it's the expected one
            const errorInstance = cb.mock.calls[0][0];
            expect(errorInstance.message).toBe('Only .jpg, .jpeg, and .png files are allowed.');
        });
    });

    // 2. CHECKS FOR THE FILENAME GENERATION
    describe('storage filename', () => {
        test('should generate a unique filename with the correct extension', () => {
            file = { originalname: 'trash.png' };
            
            const filenameConfig = upload.storage.getFilename;

            filenameConfig(req, file, cb);

            expect(cb).toHaveBeenCalledWith(null, expect.any(String));
            
            const generatedName = cb.mock.calls[0][1];
            // Checking if the generated name ends with .png
            expect(generatedName.endsWith('.png')).toBe(true);
            // Checking if the generated name contains a numeric character (from Date.now() or Math.random())
            expect(generatedName).toMatch(/\d+/); 
        });
    });
});