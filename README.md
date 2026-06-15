# TrustNetDocs.Web

React + TypeScript frontend for TrustNetDocs.

## Local development

1. Start `TrustNetDocs.API` using the HTTP profile at `http://localhost:5231`.
2. Install dependencies with `npm install`.
3. Start the frontend with `npm run dev`.
4. Open `http://localhost:5173`.

The Vite development proxy forwards `/api` requests to the local API.

## Validation

- Run the automated tests with `npm test`.
- Run the TypeScript and production bundle validation with `npm run build`.
- The initial test suite covers dashboard request metrics, API response errors,
  authentication headers, localization headers, session expiration events, and
  the navigation permission matrix for all three application roles.
- Public document validation tests cover the 20 MB boundary, empty files, all
  supported PDF/image formats, and inconsistent extension/MIME combinations.
- Request creation tests cover required template/client selection, clean
  existing/new-client payloads, past expiration rejection, and local calendar
  date handling for the browser's time zone.
- Document review tests cover the initial status shown for new uploads,
  mandatory comments for rejection/resubmission, and the 1000-character limit.
- A public link remains reusable while the client is preparing the submission.
  Final submission invalidates it; requesting resubmission creates a different
  one-time link that the administrator must copy from the request details.
- Direct client registration and inline request client creation share the same
  name, tax ID, email, and phone limits; invalid email structures are rejected
  by the API in both flows.
- New request templates start inactive until at least one document requirement
  is configured. Requirement arrows persist the complete order atomically.

## Application routes

- `/`: dashboard.
- `/my-requests`: requests available to the authenticated user.
- `/my-requests/:requestId`: user request details.
- `/requests`: company request management for administrators.
- `/requests/new`: create a request.
- `/requests/:requestId`: administrative request details.
- `/clients`, `/catalogs`, `/users`, and `/settings`: administrative areas.
- `/profile`: authenticated user profile.
- `/public/requests/:token`: public document submission portal.

In production, the web server must return `index.html` for unknown frontend
routes so direct access and browser refresh work. API paths under `/api` must
continue to be forwarded to `TrustNetDocs.API`.

Optional local-only login defaults can be configured in `.env.local`:

```env
VITE_DEV_LOGIN=your-development-user
VITE_DEV_PASSWORD=your-development-password
```

These values are used only by the Vite development build. Keep `.env.local`
outside version control and never expose production credentials through Vite
environment variables.

## Structure

- `src/app`: application shell and screens.
- `src/services/api`: API contracts and HTTP integration.
- `src/styles.css`: shared visual foundation.

Do not embed API tokens, passwords, or production secrets in frontend source code.
