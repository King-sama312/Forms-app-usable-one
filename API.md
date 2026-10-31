# Forms App — API & Data Shapes

Reference for the data the backend (Express + Prisma/SQLite) sends to the frontend.
Base URL: `/api` (routes defined in `backend/src/server.ts`).

---

## Conventions

- All responses are JSON. `204` responses have **no body**.
- Successful responses are wrapped in a single key: `{ user }`, `{ form }`, `{ forms }`, `{ field }`, `{ submission }`, `{ submissions, total, page, limit }`.
- Error responses always have the shape:

  ```json
  { "message": "..." }
  ```

  Validation errors (Zod) are prettified, multi-line strings inside `message`.
  All dates are serialized as ISO 8601 strings by `JSON.stringify`.
- **Auth is cookie-based (httpOnly).** The browser must send `credentials: "include"`; the frontend never reads the tokens itself.

### Cookies (set on login/register, rotated on refresh)

| Cookie         | Value            | Path       | Max age | Flags                             |
| -------------- | ---------------- | ---------- | ------- | --------------------------------- |
| `accessToken`  | JWT (subject=userId) | `/`        | 15 min  | httpOnly, secure (prod), sameSite=strict |
| `refreshToken` | opaque token     | `/api/auth`| 7 days  | httpOnly, secure (prod), sameSite=strict |

---

## Shared entities

### User (returned by auth endpoints)

```ts
{ id: number; email: string }
```

### Field

`config` is `null`/absent depending on type. Field types come from the
`FieldType` enum.

```ts
type FieldType = "TEXT" | "NUMBER" | "DROPDOWN" | "CHECKBOX";

{
  id: string;            // uuid
  formId: string;        // uuid
  label: string;         // unique within its form
  type: FieldType;
  required: boolean;
  order: number;         // 0-based position in the form
  config: object | null;
  createdAt: string;     // ISO
  updatedAt: string;     // ISO
}
```

`config` per type:

| Type       | config                                                            |
| ---------- | ----------------------------------------------------------------- |
| `TEXT`     | `{ "maxLength": number }` or `null`                                |
| `NUMBER`   | `{ "min": number, "max": number }` (either key may be missing) or `null` |
| `DROPDOWN` | `{ "options": string[] }` (1–100 unique non-empty options) — never `null` |
| `CHECKBOX` | `{ "options": string[] }` (same rules as DROPDOWN) — never `null`  |

### Form

```ts
type FormStatus = "DRAFT" | "PUBLISHED" | "EXPIRED";

{
  id: string;                  // uuid
  userId: number;
  title: string;               // 1–200 chars
  description: string | null;  // ≤ 2000 chars
  status: FormStatus;
  expiresAt: string | null;    // ISO, always in the future when set
  requireLogin: boolean;
  singleResponse: boolean;     // only true when requireLogin is true
  createdAt: string;
  updatedAt: string;
  fields?: Field[];            // included on getFormById / createForm, ordered by `order` asc
  _count?: { fields: number; submissions: number };  // only on getForms
}
```

### Submission

Full row (returned by the list/by-id endpoints):

```ts
{
  id: string;                 // uuid
  formId: string;             // uuid
  userId: number | null;      // null for anonymous submissions
  singleUserId: number | null;// = userId, only set when form.singleResponse
  data: Record<string, Answer>; // keyed by **field id**
  createdAt: string;
}
```

`submitForm` returns a **trimmed** version:

```ts
{ id: string; createdAt: string }
```

### Answer values (validated by the backend before saving)

| Field type | Answer value                                             |
| ---------- | -------------------------------------------------------- |
| `TEXT`     | `string` (trimmed; ≤ `config.maxLength` if set; min 1 char if required) |
| `NUMBER`   | `number` (respecting `config.min` / `config.max`)        |
| `DROPDOWN` | `string` — must match one of `config.options` exactly     |
| `CHECKBOX` | `string[]` — subset of `config.options`, no duplicates, ≥1 if required |

Required-but-unanswered fields must be **omitted**, not `null`/`""` (they are
`.optional()` keys in a strict object — extra unknown keys are rejected).

---

## Endpoints

### Auth — `/api/auth` (no auth required unless marked)

| Method | Path           | Auth  | Body                    | Success response                                   | Notes |
| ------ | -------------- | ----- | ----------------------- | -------------------------------------------------- | ----- |
| POST   | `/register`    | —     | `{ email, password }`   | `201 { user }` + cookies                           | password 8–72 chars; email normalized (trim/lowercase). `409` if email exists. Rate limited. |
| POST   | `/login`       | —     | `{ email, password }`   | `200 { user }` + cookies                           | `401 "Invalid credentials"` on failure. Rate limited. |
| POST   | `/refresh`     | refresh cookie | —          | `204` (new cookies set)                            | Rotates the refresh token. `401` + cleared cookies if invalid/expired/reused (reuse revokes the whole session). |
| POST   | `/logout`      | refresh cookie | —          | `204`, cookies cleared                             | |
| POST   | `/logout-all`  | access| —                       | `204`, cookies cleared                             | Revokes all refresh tokens for the user. |
| GET    | `/me`          | access| —                       | `200 { user }`                                     | `401` if token missing/invalid/expired. |

### Forms — `/api/forms` (**all owner-only, require access token**)

| Method | Path                        | Body / Query                                  | Success response          |
| ------ | --------------------------- | --------------------------------------------- | ------------------------- |
| POST   | `/`                         | `{ title, description?, expiresAt?, requireLogin?, singleResponse?, fields? }` | `201 { form }` (form with `fields`, ordered) |
| GET    | `/`                         | —                                             | `200 { forms: Form[] }` (newest first, includes `_count`) |
| GET    | `/:id`                      | —                                             | `200 { form }` (includes full `fields` array) |
| PATCH  | `/:id`                      | any subset of `{ title, description, expiresAt, requireLogin, singleResponse }` | `200 { form }` |
| DELETE | `/:id`                      | —                                             | `204` |
| POST   | `/:id/publish`              | —                                             | `200 { form }`            |
| POST   | `/:id/unpublish`            | —                                             | `200 { form }`            |
| POST   | `/:id/fields`               | a single field: `{ label, type, required?, config? }` | `201 { field }` (order = appended at the end) |
| PUT    | `/:id/fields/order`         | `{ fieldIds: string[] }` (all field ids of the form, once each) | `204` |
| PUT    | `/:formId/fields/:fieldId`  | full field: `{ label, type, required, config }` | `200 { field }` |
| DELETE | `/:formId/fields/:fieldId`  | —                                             | `204` |

Body rules:

- `expiresAt` in create must be a **future** date (it is coerced from string).
- `fields[]` labels must be unique case-insensitively; max 100 fields.
- `singleResponse: true` requires `requireLogin: true` (`400` otherwise).
- Fields & form properties are only editable while `status === "DRAFT"` → `409` otherwise.
- `409` on duplicate field label (per form).
- Publish requires ≥ 1 field and a non-expired form → `409`. Unpublish fails (`409`) if the form already has submissions.
- Errors: `404` when the form/field doesn't exist or belongs to another user.

### Submissions — under `/api/forms`

| Method | Path                                          | Auth              | Body / Query                       | Success response          |
| ------ | --------------------------------------------- | ----------------- | ---------------------------------- | ------------------------- |
| POST   | `/forms/:id/submissions`                      | optional (used for requireLogin / singleResponse) | `Record<fieldId, Answer>` | `201 { submission: { id, createdAt } }` |
| GET    | `/forms/:id/submissions`                      | owner             | query: `?page=1&limit=20` (limit ≤ 100) | `200 { submissions, total, page, limit }` (newest first) |
| GET    | `/forms/:id/submissions/:submissionId`        | owner             | —                                  | `200 { submission }` (full row) |
| DELETE | `/forms/:id/submissions/:submissionId`        | owner             | —                                  | `204` |

Submission rules producing errors:

- DRAFT / EXPIRED / past-`expiresAt` forms: `404` / `409 "This form is closed"`.
- `requireLogin` and no session → `401`. `singleResponse` and already answered → `409`.
- Payload validated against the form's live fields (`400` with a prettified Zod message on mismatch).

---

## Quick examples

Login response:

```json
{ "user": { "id": 1, "email": "me@example.com" } }
```

Form list item:

```json
{
  "id": "0193f2ab-cdef-7a12-3456-7890abcdef12",
  "userId": 1,
  "title": "Feedback",
  "description": "Tell us what you think",
  "status": "PUBLISHED",
  "expiresAt": "2026-12-31T00:00:00.000Z",
  "requireLogin": false,
  "singleResponse": false,
  "createdAt": "2026-10-30T10:15:00.000Z",
  "updatedAt": "2026-10-30T10:15:00.000Z",
  "_count": { "fields": 2, "submissions": 5 }
}
```

Form with fields:

```json
{
  "form": {
    "id": "0193f2ab-cdef-7a12-3456-7890abcdef12",
    "title": "Feedback",
    "status": "DRAFT",
    "fields": [
      {
        "id": "0193f2ab-f1e2-7333-8444-5566aabbccdd",
        "formId": "0193f2ab-cdef-7a12-3456-7890abcdef12",
        "label": "Your name",
        "type": "TEXT",
        "required": true,
        "order": 0,
        "config": { "maxLength": 50 },
        "createdAt": "2026-10-30T10:15:00.000Z",
        "updatedAt": "2026-10-30T10:15:00.000Z"
      },
      {
        "id": "0193f2ab-9999-7ddd-8eee-ffff00112233",
        "formId": "0193f2ab-cdef-7a12-3456-7890abcdef12",
        "label": "Interests",
        "type": "CHECKBOX",
        "required": false,
        "order": 1,
        "config": { "options": ["Design", "Backend"] },
        "createdAt": "2026-10-30T10:15:00.000Z",
        "updatedAt": "2026-10-30T10:15:00.000Z"
      }
    ]
  }
}
```

Submission payload for the form above:

```json
{
  "0193f2ab-f1e2-7333-8444-5566aabbccdd": "Kingsama",
  "0193f2ab-9999-7ddd-8eee-ffff00112233": ["Design"]
}
```

Error:

```json
{ "message": "Form with ID 0193... not found" }
```
