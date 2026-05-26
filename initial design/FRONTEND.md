# Frontend Documentation: City Problem Reporting System

## Tech Stack

- **Language:** JavaScript (ES6+)
- **Library:** React.js
- **Framework:** Vite
- **Validation:** Zod
- **State Management:** LocalStorage (Role tracking) & JWT (API Auth)

## User Roles & Navigation

All users start at the **Welcome Page**. The navigation bar is persistent and always includes a **Home** option redirecting to the Welcome Page.

### Session Management (LocalStorage)

The system detects the user role by checking the `session` key in `localStorage`. If the key is missing, the user is assigned the **Guest** role.

```javascript
{
  "token": "eyJhbGci...", // JWT Token
  "role": "citizen", // 'citizen' | 'admin' | 'technician'
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Requirement:** Call `localStorage.removeItem('session')` during logout.

### Navigation Bar Configuration

- **Guest:** `[Home]` | `[Login/Register]`
- **Citizen:** `[Home]` | `[My Reports]` | `[Create Report]` | `[Logout]`
- **Administrator:** `[Home]` | `[Manage All Reports]` | `[Manage Technicians]` | `[Category Management]` | `[Logout]`
- **Technician:** `[Home]` | `[My Assigned Tasks]` | `[Logout]`

### Shared Response Schemas (Zod)

```javascript
const AuthResponseSchema = z.object({
  token: z.string(),
  role: z.enum(["citizen", "admin", "technician"]),
  user: z.object({ id: z.number(), full_name: z.string(), email: z.string() }),
});

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
```

### Guest

- **Welcome Page:** Initial landing.
- **Login/Register Page:**
  - **API:** `POST /api/auth/register`
    - Params: None
    - Body: `{ email: string, password: string, full_name: string }`
    - Response: `GenericMessageSchema`
  - **API:** `POST /api/auth/login`
    - Params: None
    - Body: `{ email: string, password: string }`
    - Response: `AuthResponseSchema`

### Citizen

- **Welcome Page:** Initial landing.
- **Create Report Page:**
  - **API:** `GET /api/categories`
    - Params: None
    - Body: None
    - Response: `z.array(z.object({ id: z.number(), name: z.string() }))`
  - **API:** `POST /api/reports`
    - Params: None
    - Body: `{ category_id: number, address: string, description: string }` + File
    - Response: `GenericMessageSchema`
- **My Reports Page:**
  - **API:** `GET /api/reports/my`
    - Params: None
    - Body: None
    - Response: `z.array(z.object({ id: z.number(), category_id: z.number(), address: z.string(), description: z.string(), status: z.string(), image_path: z.string().nullable(), created_at: z.string() }))`
  - **API:** `PATCH /api/reports/:id`
    - Params: `:id` (Report ID)
    - Body: `{ category_id?: number, address?: string, description?: string }`
    - Response: `GenericMessageSchema`
    - **Constraint:** The 'Edit' button must be disabled or hidden if the report status is not 'NEW'.
- **Logout:** Clear `localStorage` and redirect to Login.

### Administrator

- **Welcome Page:** Initial landing.
- **Manage All Reports Page:**
  - **API:** `GET /api/admin/reports`
    - Params: None
    - Body: None
    - Response: `z.array(z.object({ id: z.number(), user_id: z.number(), category_id: z.number(), address: z.string(), description: z.string(), status: z.string(), image_path: z.string().nullable(), assigned_tech_id: z.number().nullable(), created_at: z.string() }))`
  - **API:** `GET /api/admin/technicians`
    - Params: None
    - Body: None
    - Response: `z.array(z.object({ id: z.number(), full_name: z.string(), email: z.string() }))`
  - **API:** `PATCH /api/admin/assign`
    - Params: None
    - Body: `{ report_id: number, technician_id: number }`
    - Response: `GenericMessageSchema`
- **Manage Technicians Page:**
  - **API:** `POST /api/admin/technicians`
    - Params: None
    - Body: `{ email: string, password: string, full_name: string }`
    - Response: `GenericMessageSchema`
- **Category Management Page:**
  - **API:** `GET /api/categories`
    - Params: None
    - Body: None
    - Response: `z.array(z.object({ id: z.number(), name: z.string() }))`
  - **API:** `POST /api/categories`
    - Params: None
    - Body: `{ name: string }`
    - Response: `GenericMessageSchema`
  - **API:** `DELETE /api/categories/:id`
    - Params: `:id` (Category ID)
    - Body: None
    - Response: `GenericMessageSchema`
- **Logout:** Clear `localStorage` and redirect to Login.

### Technician

- **Welcome Page:** Initial landing.
- **My Assigned Tasks Page:**
  - **API:** `GET /api/tech/my-reports`
    - Params: None
    - Body: None
    - Response: `z.array(z.object({ id: z.number(), address: z.string(), description: z.string(), status: z.string(), image_path: z.string().nullable(), created_at: z.string() }))`
  - **API:** `PATCH /api/tech/report/:id/status`
    - Params: `:id` (Report ID)
    - Body: `{ status: 'NEW'|'REJECTED'|'DUPLICATE'|'ONGOING'|'COMPLETED' }`
    - Response: `GenericMessageSchema`
- **Logout:** Clear `localStorage` and redirect to Login.

## UI/UX Requirements

- **Role-Based Access:** Navigation bar items change based on the role stored in `localStorage`.
- **Validation:** Use Zod for all form inputs.
- **Session:** `localStorage` complements JWT for navigation ease but does not replace API authentication.
- **File Inputs:** The file input for report creation must use `accept="image/*"` to restrict the file picker to image files only.
