# TrustNetDocs.Web

React + TypeScript frontend for TrustNetDocs.

## Local development

1. Start `TrustNetDocs.API` using the HTTP profile at `http://localhost:5231`.
2. Install dependencies with `npm install`.
3. Start the frontend with `npm run dev`.
4. Open `http://localhost:5173`.

The Vite development proxy forwards `/api` requests to the local API.

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
