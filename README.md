# pCloud Browser

The aim of this project is to provide a clean and modern interface to browse files located on a pCloud account.

## Setup

Make sure to install the dependencies:

```bash
# pnpm
pnpm install
```

Copy `.example.env.local` and rename it `.env.local`. Edit it to add your app client_id & client_secret.

## Development Server

Start the development server on http://localhost:3000

```bash
pnpm run dev
```

## Production

Build the application for production:

```bash
pnpm run build
```

Locally preview production build:

```bash
pnpm run preview
```
