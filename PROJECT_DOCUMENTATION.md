# Makhboz Marketplace - Project Documentation

## Project Overview
Makhboz is a Sudanese marketplace platform for homemade baked goods including cakes, petit fours, biscuits, and traditional pastries. It connects Sudanese home bakers with customers in Khartoum and surrounding areas.

## Project Structure

```
makhboz/
├── index.html                 # Main marketplace landing page
├── dashboard.html             # Admin dashboard (English)
├── _redirects                 # Netlify routing configuration
├── netlify.toml              # Netlify deployment configuration
├── package.json              # Node.js dependencies
├── package-lock.json         # Dependency lock file
├── robots.txt                # Search engine directives
├── sitemap.xml              # Site map for SEO
├── logo.png                 # Application logo
├── css/
│   └── style.css           # Main stylesheet
├── js/
│   └── app.js              # Shared JavaScript utilities
├── pages/
│   ├── baker.html          # Baker profile page
│   ├── cart.html           # Shopping cart page
│   ├── checkout.html       # Checkout process page
│   ├── login.html          # User authentication page
│   ├── orders.html         # Order history page
│   └── product.html        # Product detail page
└── netlify/
    └── functions/
        ├── analytics.mts   # Analytics API endpoint
        ├── auth.mts        # Authentication API endpoint
        ├── counts.mts      # Counter utilities
        ├── orders.mts      # Orders management API
        ├── products.mts    # Products API endpoint
        └── seed.mts        # Database seeding utilities
```

## Routes and Pages

### Main Application Routes

| Route | File | Description | Language |
|-------|------|-------------|----------|
| `/` | `index.html` | Main marketplace with product listings | Arabic |
| `/dashboard.html` | `dashboard.html` | Admin dashboard for site monitoring | English |
| `/pages/baker.html` | `pages/baker.html` | Individual baker profile and products | Arabic |
| `/pages/cart.html` | `pages/cart.html` | Shopping cart management | Arabic |
| `/pages/checkout.html` | `pages/checkout.html` | Order checkout process | Arabic |
| `/pages/login.html` | `pages/login.html` | User login/registration | Arabic |
| `/pages/orders.html` | `pages/orders.html` | User order history | Arabic |
| `/pages/product.html` | `pages/product.html` | Detailed product view | Arabic |

### API Routes (Netlify Functions)

| API Route | Function | Description |
|-----------|----------|-------------|
| `/api/auth` | `auth.mts` | User authentication (login/register) |
| `/api/products` | `products.mts` | Product CRUD operations |
| `/api/orders` | `orders.mts` | Order management and processing |
| `/api/analytics` | `analytics.mts` | Site analytics and metrics |
| `/api/counts` | `counts.mts` | Counter utilities for various entities |

## Key Files Description

### Frontend Files

- **`index.html`**: Main marketplace page with product grid, search, and filtering by category (cakes, petit fours, biscuits, pastries) and area (Bahri, Omdurman, Khartoum, Khartoum North)
- **`dashboard.html`**: Admin dashboard for monitoring site metrics and analytics
- **`js/app.js`**: Shared JavaScript utilities including authentication, cart management, and navigation
- **`css/style.css`**: Main stylesheet with RTL support for Arabic content

### Backend Functions

- **`auth.mts`**: Handles user authentication with phone-based login system
- **`products.mts`**: Manages product listings, search, filtering, and baker profiles
- **`orders.mts`**: Processes orders, manages order history, and handles order status
- **`analytics.mts`**: Tracks site metrics and provides analytics data
- **`seed.mts`**: Database seeding utilities for initial data setup

### Configuration Files

- **`_redirects`**: Netlify routing rules for SPA support and API proxying
- **`netlify.toml`**: Netlify deployment configuration including build settings and function configuration
- **`package.json`**: Node.js dependencies (mainly @netlify/blobs for data storage)

## Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Netlify Functions (TypeScript)
- **Database**: Netlify Blobs
- **Deployment**: Netlify
- **Styling**: CSS with custom properties, Google Fonts (Tajawal for Arabic, Inter for English)
- **Language Support**: Arabic (RTL) for main app, English for admin dashboard

## Key Features

1. **Product Marketplace**: Browse and search homemade baked goods
2. **Geographic Filtering**: Filter products by Khartoum areas
3. **Category Filtering**: Browse by product types (cakes, petit fours, biscuits, pastries)
4. **User Authentication**: Phone-based registration and login
5. **Shopping Cart**: Add to cart and checkout functionality
6. **Order Management**: Track order history and status
7. **Baker Profiles**: View individual baker information and products
8. **Admin Dashboard**: Monitor site metrics and analytics

## Routing Configuration

The `_redirects` file handles:
- Direct access to dashboard and pages
- Static asset routing (CSS, JS)
- API endpoint proxying to Netlify Functions
- Fallback to index.html for SPA routing

## Dependencies

Main dependency:
- `@netlify/blobs`: Serverless data storage for products, users, and orders

## Notes

- The application is designed for Sudanese market with Arabic as primary language
- RTL (right-to-left) support is implemented throughout the main application
- Geographic focus on Khartoum metropolitan area
- Phone-based authentication system adapted for local market
- Admin interface uses English for technical management
