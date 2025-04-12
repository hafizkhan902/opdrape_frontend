# Deployment Guide for OpDrape

This document outlines the process of deploying the OpDrape application to production.

## Prerequisites

- GitHub account with access to the repository
- Node.js and npm installed on your local machine for testing builds

## Deployment Methods

### Option 1: GitHub Pages (Recommended)

This repository is configured to automatically deploy to GitHub Pages when changes are pushed to the main branch.

1. Ensure the GitHub repository settings have GitHub Pages enabled:
   - Go to Settings > Pages
   - Set the source to "GitHub Actions"

2. Push your changes to the main branch:
   ```bash
   git push origin main
   ```

3. The GitHub Actions workflow will automatically:
   - Install dependencies
   - Build the project
   - Deploy to GitHub Pages

4. After deployment, the site will be available at: https://opdrape.store

### Option 2: Manual Deployment

To manually deploy the application:

1. Build the application:
   ```bash
   npm run build
   ```

2. The build output will be in the `build` directory

3. Deploy the contents of the `build` directory to your web hosting provider

## Environment Variables

The following environment variables are used in production:

- `REACT_APP_API_URL`: Set to the production API endpoint
- `REACT_APP_ENABLE_ANALYTICS`: Set to `true` for production

## Domain Configuration

The domain `opdrape.store` should be configured with your DNS provider to point to the GitHub Pages URL or your hosting provider's server.

## Troubleshooting

If you encounter issues with the deployment:

1. Check the GitHub Actions logs for any build or deployment errors
2. Verify all environment variables are correctly set
3. Ensure the CNAME file in the `public` directory contains `opdrape.store`

For additional help, contact the development team. 