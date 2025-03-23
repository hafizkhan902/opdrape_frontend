# StyleShop E-commerce Frontend

A modern React-based e-commerce application with a clean, responsive UI and robust functionality.

## Features

- Responsive design for all devices
- User authentication and account management
- Product browsing with filtering and sorting
- Shopping cart and wishlist functionality
- Order management
- Admin dashboard (coming soon)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/styleshop-frontend.git
   cd styleshop-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Environment Configuration:
   
   Create a `.env` file in the root directory with the following variables:
   ```
   # API Configuration
   REACT_APP_API_URL=http://localhost:8000/api
   REACT_APP_API_TIMEOUT=30000
   
   # Authentication
   REACT_APP_AUTH_TOKEN_NAME=token
   
   # Feature Flags
   REACT_APP_ENABLE_ANALYTICS=false
   REACT_APP_ENABLE_NOTIFICATIONS=true
   
   # Other Configuration
   REACT_APP_ITEMS_PER_PAGE=12
   REACT_APP_MAX_PRICE_FILTER=1000
   ```
   
   You can copy the `.env.example` file as a starting point:
   ```
   cp .env.example .env
   ```
   
   Then customize the values as needed.

4. Start the development server:
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```

5. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_API_URL | Base URL for the backend API | http://localhost:8000/api |
| REACT_APP_API_TIMEOUT | Timeout for API requests (in ms) | 30000 |
| REACT_APP_AUTH_TOKEN_NAME | Name of the authentication token stored in localStorage | token |
| REACT_APP_ENABLE_ANALYTICS | Enable/disable analytics features | false |
| REACT_APP_ENABLE_NOTIFICATIONS | Enable/disable notification features | true |
| REACT_APP_ITEMS_PER_PAGE | Number of items to display per page in listings | 12 |
| REACT_APP_MAX_PRICE_FILTER | Maximum value for the price range filter | 1000 |

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects the configuration files (use with caution)

## Project Structure

```
src/
  ├── components/         # UI components
  │   ├── auth/           # Authentication components
  │   ├── common/         # Reusable common components
  │   ├── layout/         # Layout components
  │   ├── products/       # Product-related components
  │   └── ...
  ├── context/            # React context for state management
  ├── hooks/              # Custom hooks
  ├── pages/              # Page components
  ├── services/           # API services
  ├── utils/              # Utility functions
  ├── config/             # Configuration files
  ├── App.js              # Main App component
  └── index.js            # Application entry point
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
