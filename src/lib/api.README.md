# API Configuration

This document explains how to configure and use the API in this React application.

## Current Test Mode

The app is currently running in frontend-only mock mode.

- `src/lib/api.ts` routes all requests to the local mock adapter.
- `src/lib/mockBackend.ts` provides seeded users, roles, orders, invoices, payments, notifications, and QR flows.
- No live backend or `VITE_API_URL` value is required to test the UI.

## Environment Variables

The application uses environment variables to configure the API base URL:

- `VITE_API_URL`: The base URL for API requests

### Default Configuration

The application is configured with the following environment files:

1. `.env` - Default environment variables
2. `.env.development` - Development environment variables
3. `.env.production` - Production environment variables

### Example Environment Files

**.env**
```env
VITE_API_URL=https://logistic-backend-ydfz.onrender.com/api
```

**.env.development**
```env
VITE_API_URL=http://localhost:8000/api
```

**.env.production**
```env
VITE_API_URL=https://logistic-backend-ydfz.onrender.com/api
```

## API Instance Configuration

The `api.ts` file creates an Axios instance with the following features:

1. Base URL configuration using `VITE_API_URL` environment variable
2. Request interceptor to add authentication token
3. Response interceptor to handle 401 errors and refresh tokens

### Usage Example

```typescript
import api from "@/lib/api";

// GET request
const getData = async () => {
  try {
    const response = await api.get("/endpoint");
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// POST request
const postData = async (data: any) => {
  try {
    const response = await api.post("/endpoint", data);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
```

## Vercel Deployment

When deploying to Vercel, you need to set the environment variables in the Vercel dashboard:

1. Go to your project settings in Vercel
2. Navigate to the "Environment Variables" section
3. Add the following environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://logistic-backend-ydfz.onrender.com/api`

This ensures that your frontend can communicate with the hosted backend from any device (mobile/desktop).
