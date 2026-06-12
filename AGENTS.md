# TrustNetDocs.Web Project Rules

## Repository And Shared Context

- This repository is the React frontend at `C:\Users\LeoWork\Documents\TrustNetDocs\TrustNetDocs.Web`.
- The backend repository is the sibling directory `C:\Users\LeoWork\Documents\TrustNetDocs\TrustNetDocs.API`.
- Treat API and Web as one product context while keeping their Git repositories independent.
- Backend business rules and endpoint inventory are documented in `..\TrustNetDocs.API\docs\current-system-analysis.md`.
- Do not use the parent directory Git repository; it belongs to the legacy MVC workspace.

## Stack

- React with TypeScript.
- Vite 6 while the local Node version remains `20.18.0`.
- Use functional components and hooks.
- Keep source code, types, component names, and technical identifiers in English.
- User-facing text must support `pt-BR` and `en-US`.
- After authentication, API requests must send the user's `preferredCulture` in `Accept-Language`; do not rely on the browser language for authenticated enum descriptions.

## Architecture

- Keep API integration under `src/services/api`.
- Keep shared application composition under `src/app`.
- Add feature folders as modules grow, such as `src/features/requests`, `src/features/users`, and `src/features/profile`.
- Centralize authentication/session handling and never use a fixed token.
- Respect backend roles: `SuperAdmin`, `Administrator`, and `Operator`.
- Respect tenant isolation from JWT/API responses; never trust a tenant selector to grant access.
- Use the API response contract: `success`, `data`, `code`, `message`.
- Use API catalogs for roles, cultures, time zones, and enum descriptions instead of duplicating values in the UI.

## Experience

- The application is an operational document-management tool: restrained, dense, clear, and responsive.
- Build application screens first, not a marketing landing page.
- Brand references come from `..\LOGOS.zip`; selected application assets live under `public/brand`.
- Use the TrustNetBR navy (`#001028`) and blue (`#0068D8`) as the primary brand colors, with white, silver, and light blue supporting surfaces.
- Prefer the official shield icon in compact product UI and keep the product name as `TrustNetDocs`.
- The profile must support preferred culture and time zone.
- SuperAdmin sees global administration.
- Tenant administrators see their company management and complete internal document flows.
- Regular users see only their own requests and documents.
- Handle loading, empty, error, unauthorized, and forbidden states.

## Local Integration

- Local Web URL: `http://localhost:5173`.
- Local API HTTP URL: `http://localhost:5231`.
- Vite proxies `/api` to the local API.
- Public document submission uses `/public/requests/{token}` and must remain accessible without an authenticated session.
- The raw public token is returned only once after request creation; the Web must immediately present a copyable public URL.
- Environment-specific API addresses must use `VITE_API_BASE_URL`.
- Do not version production secrets.

## Verification

- Run `npm run typecheck`.
- Run `npm run build`.
- After meaningful visual changes, verify desktop and mobile in the browser.
