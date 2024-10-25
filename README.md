# Writer Hub API

This is the backend API for the Writer Hub application. It provides endpoints for managing companies, users, and articles.

## Getting Started

1.  Clone the repository: `git clone https://github.com/ArviinM/writer-hub-api`
2.  Install dependencies: `yarn install`
3.  Create the database: The API uses an SQLite database. The database schema is defined in `database/database.ts`. The database will be created automatically when the server starts.
4.  Build the dist for the server: `yarn build`
5.  Start the server: `yarn start`

## API Endpoints

### Authentication

-   `POST /auth/login`: Authenticate a user and obtain JWT and refresh tokens.
-   `POST /auth/refresh`: Refresh an access token using a refresh token.

### Users

-   `POST /users`: Create a new user (Editor role only).
-   `GET /users`: Get all users (Editor role only).
-   `PUT /users/:id`: Update an existing user (Editor role only).

### Companies

-   `POST /companies`: Create a new company (Editor role only).
-   `GET /companies`: Get all companies.
-   `PUT /companies/:id`: Update an existing company (Editor role only).

### Articles

-   `POST /articles`: Create a new article (Writer role only).
-   `GET /articles`: Get all articles.
-   `PUT /articles/:id`: Update an existing article (Writer and Editor with restrictions).
-   `PATCH /articles/:id/publish`: Publish an article (Editor role only).

## Authentication

All endpoints except `POST /auth/login`, `POST /auth/refresh`, and `GET /companies` require authentication. You need to include an `Authorization` header with a valid JWT token in the format `Bearer <token>`.

## Role-Based Authorization

Certain endpoints are restricted to specific user roles (Writer or Editor). The API will return a `403 Forbidden` error if you try to access a restricted endpoint without the necessary permissions.

## Error Handling

The API includes a global error handler that returns JSON responses with a consistent format in case of errors.

## Data Validation

Basic data validation is implemented. You can extend it based on your specific requirements.

## Image Handling

The API currently only stores image URLs. You can implement image uploading and storage separately using a library like `multer` and a cloud storage service like AWS S3 or Google Cloud Storage.

## Testing

You can use Postman or a similar tool to test the API endpoints.
