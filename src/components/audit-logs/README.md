# Audit Logs Page

This document explains the Audit Logs page functionality in the LogisticSys project.

## Overview

The Audit Logs page allows admin users to view and monitor system activity and user actions. This page is only accessible to users with the "admin" role.

## Features

1. **Activity Log Display**
   - Detailed record of system events and user actions
   - User information (name and email)
   - Action type (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
   - Resource type and ID
   - IP address and user agent
   - Timestamp of the action
   - Additional details about the action

2. **Search and Filter**
   - Search by user name, email, action, resource type, or details
   - Filter by action type (CREATE, UPDATE, DELETE, etc.)
   - Filter by resource type (User, Order, Invoice, etc.)

3. **Export Functionality**
   - Export audit logs for external analysis
   - Download logs in various formats

4. **Summary Statistics**
   - Total users in the system
   - Total actions in the last 30 days
   - System configuration changes

## Access Control

- Only users with the "admin" role can access this page
- Regular users will not see "Audit Logs" in the navigation menu

## Implementation Details

### Frontend

The Audit Logs page is implemented as a React component (`AuditLogsPage.tsx`) with the following features:

1. **State Management**
   - Logs list state
   - Filtered logs state
   - Loading and error states
   - Search and filter parameters

2. **UI Components**
   - Data table for log display
   - Search and filter controls
   - Color-coded badges for action types
   - Icons for resource types
   - Summary cards for key metrics

3. **Data Handling**
   - Initial log data fetch on component mount
   - Real-time filtering based on search and filter inputs
   - Mock data for demonstration purposes

### Backend Integration

In a production environment, this page would integrate with backend API endpoints to:
- Retrieve audit logs from the database
- Handle pagination for large datasets
- Process search and filter parameters
- Generate export files

## Usage

1. Navigate to the "Audit Logs" page from the admin navigation menu
2. View the list of system activities and user actions
3. Use search and filter controls to find specific logs
4. Click "Export Logs" to download the audit data

## Security Considerations

1. All audit logs are protected with admin-only permissions
2. Logs contain sensitive information and should be handled securely
3. Log retention policies should be configured appropriately
4. Access to audit logs should be monitored and restricted
5. Export functionality should be logged for security tracking

## Data Model

The audit logs include the following information for each entry:
- User: The user who performed the action
- Action: The type of action performed (CREATE, UPDATE, DELETE, etc.)
- Resource: The type of resource affected and its ID
- IP Address: The IP address from which the action was performed
- User Agent: The browser/client used to perform the action
- Timestamp: When the action occurred
- Details: Additional information about the action

## Future Enhancements

1. **Real-time Updates**: Implement WebSocket connections for real-time log updates
2. **Advanced Filtering**: Add date range filtering and more complex search options
3. **Alerts**: Configure alerts for specific types of actions
4. **Detailed Views**: Add drill-down capabilities for individual log entries
5. **Integration**: Connect with external monitoring and alerting systems