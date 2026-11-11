# NestJS REST API

A REST API built with **NestJS 12**, **PostgreSQL**, and **Kysely**, featuring JWT-based authentication, user management, profile operations, and database migrations.

## Tech Stack

- **Node.js / TypeScript**
- **NestJS 12** — server-side application framework
- **PostgreSQL 16** — relational database
- **Kysely** — type-safe SQL query builder and migration system
- **JWT** — access and refresh token authentication
- **Passport** — authentication middleware
- **bcrypt** — password and refresh token hashing
- **class-validator / class-transformer** — request DTO validation
- **Zod** — environment configuration validation
- **Swagger** — API documentation
- **Vitest / Supertest** — automated testing
- **Docker Compose** — local PostgreSQL environment

## Features

### Authentication

- User registration.
- Login using username and password.
- Access and refresh token generation.
- Secure storage of hashed refresh tokens.
- Refresh token expiration and revocation checks.
- Refresh token rotation.
- Logout with refresh token revocation.

### Users and Profiles

- Retrieve the current user's profile.
- Retrieve a user by ID.
- Retrieve a paginated list of users.
- Search users by username.
- Update the current user's profile.
- Soft-delete the current user's account.

### Security and Infrastructure

- Request validation.
- Centralized HTTP exception handling.
- JWT-protected routes.
- Graceful application shutdown.
- Database connection cleanup during shutdown.
- SQL statement execution timeout.

## Prerequisites

Make sure the following tools are installed:

- Node.js 22.9+
- npm
- Docker Desktop with Docker Compose

## Installation and Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd nestjs
```

Replace `<repository-url>` with the actual repository URL after publishing the project.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file based on `.env.example`.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**

```bash
cp .env.example .env
```

Example configuration:

```env
PORT=3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=nestjs_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_STATEMENT_TIMEOUT_MS=5000

JWT_ACCESS_SECRET=REPLACE_WITH_64_CHAR_RANDOM_SECRET
JWT_ACCESS_EXPIRES_IN=15m

JWT_REFRESH_SECRET=REPLACE_WITH_ANOTHER_64_CHAR_RANDOM_SECRET
JWT_REFRESH_EXPIRES_IN=7d
```

Replace the JWT secret placeholders with randomly generated values.

Both secrets must:
- Contain at least 32 characters.
- Be different from each other.

The `PORT` variable is optional. The application defaults to port `3000` when it is not specified.

`DATABASE_STATEMENT_TIMEOUT_MS` is optional. It limits the execution time of each SQL query and defaults to `5000` ms.

`JWT_ACCESS_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` use the format `<number><unit>`, where the unit is one of `ms`, `s`, `m`, `h`, `d`, `w`, `y` (for example `15m` or `30d`). Spaces are not allowed: `15 min` fails validation at startup.

All other variables shown above are required by the environment validation schema.

**Important:** Never commit your actual `.env` file or production secrets to version control.

### 4. Start PostgreSQL

Start the database container:

```bash
docker compose up -d
```

Check the container status:

```bash
docker compose ps
```

PostgreSQL runs on port `5432`.

The database uses a named Docker volume, `postgres_data`, to persist data between container restarts.

Database connection settings are configured through the `DATABASE_*` environment variables.

### 5. Run database migrations

After PostgreSQL is running, execute:

```bash
npm run migration:run
```

This command:

1. Builds the application.
2. Executes all pending Kysely migrations from `dist/database/migrations`.
3. Closes the database connection after migration execution.

Migrations are applied to the database specified in your `.env` file.

### 6. Start the application

**Development mode** with automatic restart:

```bash
npm run start:dev
```

**Standard mode:**

```bash
npm run start
```

**Production mode:**

```bash
npm run build
npm run start:prod
```

By default, the application is available at:

```text
http://localhost:3000
```

If the `PORT` environment variable is specified, the application uses that port instead.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate a user |
| POST | `/auth/refresh` | Refresh the token pair |
| POST | `/auth/logout` | Log out and revoke the refresh token |
| GET | `/profile/my` | Retrieve the current user's profile |
| GET | `/users` | Retrieve the user list |
| GET | `/users/:id` | Retrieve a user by ID |
| PUT | `/users/me` | Update the current user's profile |
| DELETE | `/users/me` | Soft-delete the current user's account |

Protected endpoints require a valid access token in the request header:

```http
Authorization: Bearer <access_token>
```

## API Documentation

Interactive Swagger documentation is available at:

```text
http://localhost:3000/api/docs
```

The documentation includes available endpoints, request parameters, response schemas, and Bearer authentication.

## Testing

Run unit tests:

```bash
npm test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Run tests with coverage:

```bash
npm run test:cov
```

The E2E test suite uses in-memory repository and database mocks. It verifies HTTP endpoints and application component interactions without connecting to a real PostgreSQL instance.

## Additional Commands

Build the application:

```bash
npm run build
```

Run code linting:

```bash
npm run lint
```

Format source files:

```bash
npm run format
```

## Project Structure

```text
src/
├── auth/
│   ├── dto/
│   ├── guards/
│   ├── interfaces/
│   ├── strategies/
│   └── types/
├── common/
│   └── filters/
├── config/
├── database/
│   └── migrations/
├── profile/
└── users/
    ├── dto/
    └── validators/

test/
└── mocks/
```

### Main Modules

- `auth/` — registration, authentication, JWT, and refresh token management.
- `users/` — user-related operations.
- `profile/` — current user profile operations.
- `database/` — PostgreSQL connection and Kysely migrations.
- `config/` — application configuration and environment validation.
- `common/` — shared components, including the HTTP exception filter.
- `test/` — E2E tests and test mocks.

## Graceful Shutdown

The application handles shutdown signals and closes database connections during termination.

To stop the application, press `Ctrl+C`.

To stop the PostgreSQL container:

```bash
docker compose down
```

Database data is stored in the named Docker volume and is preserved when the container is stopped or removed with the command above.

**Warning:** Running `docker compose down -v` removes named volumes, including `postgres_data`, and may result in permanent database data loss.

## Known Limitations

- **bcrypt input limit.** bcrypt uses only the first 72 bytes of its input.
  - Passwords: `MaxLength(72)` in the DTO counts characters, not bytes. A password with multi-byte characters (for example, Cyrillic) can exceed 72 bytes, and the tail is ignored.
  - Refresh tokens: a JWT is longer than 72 bytes, so the stored bcrypt hash covers only the token header and the beginning of the payload. Refresh tokens are still protected by the JWT signature check, the `type` claim, the `jti` lookup and rotation. The hash comparison is an additional check.
- **Migration `003_add_jti_to_refresh_tokens`** adds a `NOT NULL UNIQUE` column without a default value. It runs on an empty database (setup from scratch), but would fail on a `refresh_tokens` table that already contains rows. The migration is not rewritten because it has already been applied.
- **Soft delete and uniqueness.** The `UNIQUE` constraints on `login` and `email` also apply to soft-deleted rows, so a deleted user's login and email cannot be reused.
- **Offset pagination.** `GET /users` uses `LIMIT/OFFSET` with a stable order by `id`. On very large tables, deep pages become slower than cursor-based pagination.
- **E2E tests** use in-memory repository mocks and do not run against a real PostgreSQL instance.

## License

UNLICENSED