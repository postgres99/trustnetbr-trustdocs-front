# TrustNetDocs.Web

React + TypeScript frontend for TrustNetDocs.

## Local development

1. Start `TrustNetDocs.API` using the HTTP profile at `http://localhost:5231`.
2. Install dependencies with `npm install`.
3. Start the frontend with `npm run dev`.
4. Open `http://localhost:5173`.

The Vite development proxy forwards `/api` requests to the local API.

## Structure

- `src/app`: application shell and screens.
- `src/services/api`: API contracts and HTTP integration.
- `src/styles.css`: shared visual foundation.

Do not embed API tokens, passwords, or production secrets in frontend source code.
