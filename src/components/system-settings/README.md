# System Settings Page

This document explains the System Settings page functionality in the LogisticSys project.

## Overview

The System Settings page allows admin users to configure global system parameters. This page is only accessible to users with the "admin" role.

## Features

1. **General Settings**
   - Site name and description
   - Timezone configuration
   - Currency selection

2. **Security Settings**
   - Two-Factor Authentication (2FA) configuration
   - Failed login attempt limits
   - Session timeout settings

3. **Notification Settings**
   - Enable/disable system notifications
   - Email notification configuration
   - SMS notification configuration

4. **Data Management**
   - Audit logging configuration
   - Log retention period
   - Backup frequency settings
   - Auto-backup enable/disable

5. **Maintenance**
   - Maintenance mode toggle

## Access Control

- Only users with the "admin" role can access this page
- Regular users will not see "System Settings" in the navigation menu

## Implementation Details

### Frontend

The System Settings page is implemented as a React component (`SystemSettingsPage.tsx`) with the following features:

1. **State Management**
   - Settings state for all configurable options
   - Form data handling
   - Loading and error states

2. **UI Components**
   - Card-based layout for different setting categories
   - Form inputs for text, number, and select fields
   - Toggle switches for boolean settings
   - Save and reset buttons

3. **Data Handling**
   - Settings are stored in component state
   - Changes are applied when the "Save Settings" button is clicked
   - Default values can be restored with the "Reset" button

### Backend Integration

In a production environment, this page would integrate with backend API endpoints to:
- Retrieve current system settings
- Update system settings
- Handle validation and error responses

## Usage

1. Navigate to the "System Settings" page from the admin navigation menu
2. Modify any of the available settings
3. Click "Save Settings" to apply changes
4. Use "Reset" to restore default values

## Security Considerations

1. All settings are protected with admin-only permissions
2. Sensitive settings like maintenance mode require careful handling
3. Password-related settings are properly secured
4. Audit logging helps track changes to system configuration