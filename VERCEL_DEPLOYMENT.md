# Vercel Deployment Instructions

This document provides instructions for deploying the frontend application to Vercel and configuring environment variables.

## Environment Variables Setup

When deploying to Vercel, you need to configure environment variables in the Vercel dashboard:

### Setting Environment Variables in Vercel

1. Go to your project in the Vercel dashboard
2. Navigate to the "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add the following environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://logistic-backend-ydfz.onrender.com/api`
   - Environment(s): Select "Production", "Preview", and "Development" as needed

### Environment Variable Files

The application uses the following environment files:

- `.env` - Default environment variables (used in all environments if not overridden)
- `.env.development` - Development environment variables (used in local development)
- `.env.production` - Production environment variables (used in production builds)

For Vercel deployment, the `VITE_API_URL` environment variable set in the dashboard will override any values in these files.

## Deployment Process

1. Push your code to your Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Vercel
3. Configure the project settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add the environment variables as described above
5. Deploy the project

## Access from Any Device

With the `VITE_API_URL` environment variable properly configured, your frontend will be able to access the hosted backend from any device (mobile/desktop) at `https://logistic-backend-ydfz.onrender.com/api`.

## Troubleshooting

If you encounter issues with API calls after deployment:

1. Verify that the `VITE_API_URL` environment variable is correctly set in Vercel
2. Check the browser's developer console for network errors
3. Ensure that your backend is properly configured to accept requests from your Vercel domain
4. Verify that CORS is properly configured on your backend if needed