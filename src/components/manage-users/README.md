# Manage Users Page

This component allows administrators to manage users and their permissions in the system.

## Features

- View all users in a table format
- Create new users with different roles (admin/customer)
- Edit existing user details
- Delete users (except the first admin user)
- Manage user permissions by role

## Permission Management

### Page Access Permissions
- **Dashboard Page**: Controls access to the dashboard
- **Orders Page**: Controls access to the orders management section
- **Payments Page**: Controls access to the payments section
- **Reports Page**: Controls access to the reports section (customer role only)

### Operation Permissions
- **Create Orders**: Allow user to create new shipping orders
- **View Invoices**: Allow user to view invoices
- **Pay Invoices**: Allow user to mark invoices as paid
- **Track Orders**: Allow user to track order status
- **Request Cancellations**: Allow user to request order cancellations

### Special Permissions
- **Hide Navbar**: When enabled, hides the navigation bar (automatically set when Reports access is granted)

## Implementation Details

The component uses a dialog-based interface for managing permissions. For customer users, permissions are organized by page components and operation types. Admin users have all permissions by default.

When a customer user is granted access to Reports, the system automatically enables the "Hide Navbar" permission to provide a focused reporting experience.

## API Integration

The component integrates with the following API endpoints:
- `/api/users/` - For user management
- `/api/permissions/` - For permission management

## Recent Updates

### Permission Cleanup (September 2025)
- Removed redundant permissions (`show_dashboard`, `show_orders`, `show_payments`, `show_reports`, `view_reports`)
- Simplified permission structure to use only `hide_*` permissions for page access control
- Cleaned up the frontend interface to remove references to deleted permissions
- Updated backend migrations to remove obsolete permissions from the database

This cleanup improves system maintainability by removing duplicate permissions and simplifying the permission model.