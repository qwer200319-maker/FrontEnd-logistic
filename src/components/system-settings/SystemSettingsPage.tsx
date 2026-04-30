import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Save, 
  RotateCcw,
  Bell,
  Shield,
  Database,
  Globe,
  Mail,
  CreditCard
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";

const SystemSettingsPage = () => {
  const [settings, setSettings] = useState({
    siteName: "LogiTrack",
    siteDescription: "Professional Logistics Management System",
    timezone: "Asia/Bangkok",
    currency: "USD",
    enableNotifications: true,
    enableEmailNotifications: true,
    enableSmsNotifications: true,
    maxFailedLoginAttempts: 5,
    sessionTimeout: 30,
    enableTwoFactorAuth: false,
    enableAuditLogging: true,
    retentionPeriod: 365,
    backupFrequency: "daily",
    enableAutoBackup: true,
    maintenanceMode: false,
  });
  
  const { toast } = useToast();

  // Empty useEffect for now
  useEffect(() => {
    // This useEffect is intentionally left empty
  }, []);

  const handleSave = async () => {
    try {
      // For now, we'll just show a success message
      // In a real implementation, you would save the settings to the backend
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      siteName: "LogiTrack",
      siteDescription: "Professional Logistics Management System",
      timezone: "Asia/Bangkok",
      currency: "USD",
      enableNotifications: true,
      enableEmailNotifications: true,
      enableSmsNotifications: true,
      maxFailedLoginAttempts: 5,
      sessionTimeout: 30,
      enableTwoFactorAuth: false,
      enableAuditLogging: true,
      retentionPeriod: 365,
      backupFrequency: "daily",
      enableAutoBackup: true,
      maintenanceMode: false,
    });
    toast({
      title: "Settings Reset",
      description: "System settings have been reset to default values.",
    });
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
            <p className="text-muted-foreground">Configure global system parameters</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary hover:shadow-primary">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>General Settings</span>
              </CardTitle>
              <CardDescription>
                Basic system configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => handleInputChange("siteName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Input
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleInputChange("siteDescription", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="w-full p-2 border rounded-md bg-background"
                  value={settings.timezone}
                  onChange={(e) => handleInputChange("timezone", e.target.value)}
                  aria-label="Select timezone"
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Bangkok">Asia/Bangkok</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="w-full p-2 border rounded-md bg-background"
                  value={settings.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  aria-label="Select currency"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="THB">THB - Thai Baht</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>
                Authentication and access control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                </div>
                <Switch
                  checked={settings.enableTwoFactorAuth}
                  onCheckedChange={(checked) => handleInputChange("enableTwoFactorAuth", checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxFailedLoginAttempts">Max Failed Login Attempts</Label>
                <Input
                  id="maxFailedLoginAttempts"
                  type="number"
                  min="1"
                  max="20"
                  value={settings.maxFailedLoginAttempts}
                  onChange={(e) => handleInputChange("maxFailedLoginAttempts", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleInputChange("sessionTimeout", parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>
                Configure system notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Turn on/off all notifications</p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => handleInputChange("enableNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications via email</p>
                </div>
                <Switch
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) => handleInputChange("enableEmailNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                </div>
                <Switch
                  checked={settings.enableSmsNotifications}
                  onCheckedChange={(checked) => handleInputChange("enableSmsNotifications", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Data Management</span>
              </CardTitle>
              <CardDescription>
                Backup and audit settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">Track system changes and user actions</p>
                </div>
                <Switch
                  checked={settings.enableAuditLogging}
                  onCheckedChange={(checked) => handleInputChange("enableAuditLogging", checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retentionPeriod">Audit Log Retention (days)</Label>
                <Input
                  id="retentionPeriod"
                  type="number"
                  min="1"
                  max="3650"
                  value={settings.retentionPeriod}
                  onChange={(e) => handleInputChange("retentionPeriod", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <select
                  id="backupFrequency"
                  className="w-full p-2 border rounded-md bg-background"
                  value={settings.backupFrequency}
                  onChange={(e) => handleInputChange("backupFrequency", e.target.value)}
                  aria-label="Select backup frequency"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Backup</Label>
                  <p className="text-sm text-muted-foreground">Automatically backup data</p>
                </div>
                <Switch
                  checked={settings.enableAutoBackup}
                  onCheckedChange={(checked) => handleInputChange("enableAutoBackup", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Maintenance */}
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Maintenance</span>
              </CardTitle>
              <CardDescription>
                System maintenance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Temporarily disable the system for maintenance</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleInputChange("maintenanceMode", checked)}
                />
              </div>
              {settings.maintenanceMode && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800">
                    <strong>Warning:</strong> The system is currently in maintenance mode. 
                    Users will not be able to access the system until maintenance mode is disabled.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SystemSettingsPage;