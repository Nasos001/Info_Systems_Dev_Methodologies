# Backend Documentation: City Problem Reporting System

## Tech Stack

- **Language:** JavaScript (ES6+)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (XAMPP)
- **Validation:** Zod
- **File Handling:** Multer (Local Storage)
- **Auth:** JWT (JSON Web Tokens)

## Database Schema

### `users` table

- `id` (INT, PK, AI)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR)
- `role` (ENUM: 'citizen', 'admin', 'technician')
- `full_name` (VARCHAR)
- `created_at` (TIMESTAMP)

### `categories` table

- `id` (INT, PK, AI)
- `name` (VARCHAR)

### `reports` table

- `id` (INT, PK, AI)
- `user_id` (INT, FK → `users.id`)
- `category_id` (INT, FK → `categories.id`)
- `address` (VARCHAR)
- `description` (TEXT)
- `status` (ENUM: 'NEW', 'REJECTED', 'DUPLICATE', 'ONGOING', 'COMPLETED')
- `image_path` (VARCHAR)
- `assigned_tech_id` (INT, FK → `users.id`, Nullable)
- `created_at` (TIMESTAMP)

## Security & Middleware

The system uses a layered middleware pipeline to handle authentication and authorization. Every request first passes through `authenticateJWT`.

- **`authenticateJWT`**: Extracts JWT from headers. Validates token and attaches `req.user = { id, role }`. If missing or invalid, attaches `req.user = { role: 'guest' }`.
- **`requireGuest`**: Ensures the user is NOT authenticated (`role === 'guest'`). Returns error if user is already logged in. Used for login/registration.
- **`authorizeRole([allowedRoles])`**: Checks if `req.user.role` matches any of the allowed roles. Returns `403 Forbidden` if unauthorized.

## API Endpoints

### Authentication

- `POST /api/auth/register` - `[authenticateJWT -> requireGuest]`
  - **Body:** `registerSchema` `{ email, password, full_name }`
  - **Response:** `GenericMessageSchema`
- `POST /api/auth/login` - `[authenticateJWT -> requireGuest]`
  - **Body:** `loginSchema` `{ email, password }`
  - **Response:** `AuthResponseSchema` `{ token, role, user }`

### Citizen

- `POST /api/reports` - `[authenticateJWT -> authorizeRole(['citizen'])]`
  - **Body:** `createReportSchema` `{ category_id, address, description }` + Image File
  - **Response:** `GenericMessageSchema`
- `GET /api/reports/my` - `[authenticateJWT -> authorizeRole(['citizen'])]`
  - **Body:** None
  - **Response:** `z.array(z.object({ id, category_id, address, description, status, image_path, created_at }))`
- `PATCH /api/reports/:id` - `[authenticateJWT -> authorizeRole(['citizen'])]`
  - **Params:** `idParamSchema`
  - **Body:** `editReportSchema` `{ category_id, address, description }`
  - **Response:** `GenericMessageSchema`

### Administrator

- `GET /api/admin/reports` - `[authenticateJWT -> authorizeRole(['admin'])]`
  - **Body:** None
  - **Response:** `z.array(z.object({ id, user_id, category_id, address, description, status, image_path, assigned_tech_id, created_at }))`
- `GET /api/admin/technicians` - `[authenticateJWT -> authorizeRole(['admin'])]`
  - **Body:** None
  - **Response:** `z.array(z.object({ id, full_name, email }))`
- `POST /api/admin/technicians` - `[authenticateJWT -> authorizeRole(['admin'])]`
  - **Body:** `createTechnicianSchema` `{ email, password, full_name }`
  - **Response:** `GenericMessageSchema`
- `PATCH /api/admin/assign` - `[authenticateJWT -> authorizeRole(['admin'])]`
  - **Body:** `assignTechnicianSchema` `{ report_id, technician_id }`
  - **Response:** `GenericMessageSchema`

### Categories

- `GET /api/categories` - `[authenticateJWT]`
  - **Body:** None
  - **Response:** `z.array(z.object({ id, name }))`
- `POST /api/categories` - `[authenticateJWT -> authorizeRole(['admin'])]`
  - **Body:** `categorySchema` `{ name }`
  - **Response:** `GenericMessageSchema`
- `DELETE /api/categories/:id` - `[authenticateJWT -> authorizeRole(['admin'])]`
  - **Params:** `idParamSchema`
  - **Body:** None
  - **Response:** `GenericMessageSchema`
- `GET /api/files/:filename` - `[Public]`
  - **Params:** `:filename` (The name of the file)
  - **Body:** None
  - **Response:** File Stream (Binary)

### Technician

- `GET /api/tech/my-reports` - `[authenticateJWT -> authorizeRole(['technician'])]`
  - **Body:** None
  - **Response:** `z.array(z.object({ id, address, description, status, image_path, created_at }))`
- `PATCH /api/tech/report/:id/status` - `[authenticateJWT -> authorizeRole(['technician'])]`
  - **Params:** `idParamSchema`
  - **Body:** `updateStatusSchema` `{ status }`
  - **Response:** `GenericMessageSchema`

## Zod Validation Schemas

```javascript
const { z } = require("zod");

// Shared Response Schemas
const GenericMessageSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
});

const ValidationErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(), // e.g., "Validation failed"
  errors: z.array(
    z.object({
      path: z.string(),
      message: z.string(),
    }),
  ),
});

const AuthResponseSchema = z.object({
  token: z.string(),
  role: z.enum(["citizen", "admin", "technician"]),
  user: z.object({ id: z.number(), full_name: z.string(), email: z.string() }),
});

// Authentication
const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  full_name: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters" }),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Citizen
const createReportSchema = z.object({
  category_id: z.preprocess(
    (val) => parseInt(val),
    z.number().int().positive(),
  ),
  address: z.string().min(1, { message: "Address is required" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
});

const editReportSchema = z
  .object({
    category_id: z
      .preprocess((val) => parseInt(val), z.number().int().positive())
      .optional(),
    address: z.string().min(1).optional(),
    description: z.string().min(10).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Administrator
const createTechnicianSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  full_name: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters" }),
});

const assignTechnicianSchema = z.object({
  report_id: z.preprocess((val) => parseInt(val), z.number().int().positive()),
  technician_id: z.preprocess(
    (val) => parseInt(val),
    z.number().int().positive(),
  ),
});

const categorySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50, { message: "Category name must be between 1 and 50 characters" }),
});

const idParamSchema = z.object({
  id: z.preprocess((val) => parseInt(val), z.number().int().positive()),
});

// Technician
const updateStatusSchema = z.object({
  status: z.enum(["NEW", "REJECTED", "DUPLICATE", "ONGOING", "COMPLETED"], {
    errorMap: () => ({ message: "Invalid status value provided" }),
  }),
});
```

## Implementation Notes

- **Full Image URIs:** The database stores only the relative path/filename. The server must prepend the base URL and static uploads directory to return a full absolute URL (e.g., `http://server:port/uploads/file.jpg`) to the client.
- **Direct Storage:** Images are stored in the `uploads/` directory.
- **Static Serving:** The `uploads/` folder must be served as a static asset.
- **Validation:** Use Zod for all `POST` and `PATCH` request bodies. Return `ValidationErrorSchema` on failures.
- **RBAC:** Middleware must verify JWT and the user's role before allowing access to `admin` or `tech` routes.
- **Dates:** Remove `report_date`; the system uses `created_at` as the report timestamp.
- **File Uploads:** Multer must be configured to accept only image file types (e.g., .jpg, .jpeg, .png). Reject all other MIME types.

### Password Security & Seeding

- **Hashing:** Passwords must be hashed using `bcrypt` with **10 salt rounds**.
- **Registration:** Use `bcrypt.hash(password, 10)` before saving.
- **Verification:** Use `bcrypt.compare(inputPassword, dbPassword)`.
- **Initial Admin:** The admin user is initialized via a `seed.js` script.
  - Command: `node seed.js`
  - Logic: Generates a hash for `'admin123'` and inserts it into the `users` table if the user doesn't exist.

```javascript
// seed.js
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

const DB_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "", // XAMPP default: empty
  database: "city_problem_reporting",
};

const SALT_ROUNDS = 10;

async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    const hash = await bcrypt.hash("admin123", SALT_ROUNDS);
    const [result] = await connection.execute(
      `INSERT IGNORE INTO users (email, password, role, full_name)
       VALUES (?, ?, ?, ?)`,
      ["admin@gmail.com", hash, "admin", "System Administrator"],
    );
    if (result.affectedRows === 0) {
      console.log("Admin already exists, skipped.");
    } else {
      console.log("Admin seeded successfully.");
    }
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

seed();
```
