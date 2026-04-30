 import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Menu,
  X,
  Package,
  FileText,
  Bell,
  User,
  LogOut,
  BarChart3,
  CreditCard,
  Users,
  Settings,
  History,
  QrCode
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationService, type Notification } from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { getUserRole, isAdmin, loginAsDemo, logout } from "@/lib/auth";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fullName, setFullName] = useState("Guest");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setFullName(user.full_name || "Guest");
        // Extract permission codenames from user data
        if (user.custom_permissions && Array.isArray(user.custom_permissions)) {
          const permissionCodenames = user.custom_permissions.map((perm: any) => perm.codename);
          setUserPermissions(permissionCodenames);
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        setFullName("Guest");
      }
    }
  }, []);

  // Check if user has hide_navbar permission
  const shouldHideNavbar = userPermissions.includes("hide_navbar");

  // If user has hide_navbar permission, don't render the navbar
  if (shouldHideNavbar) {
    return null;
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setFullName(user.full_name || "Guest");
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        setFullName("Guest");
      }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    // Check if user is authenticated using the service method
    if (!notificationService.isAuthenticated()) {
      console.log("User not authenticated, skipping notifications");
      setIsLoading(false);
      setNotifications([]);
      setNotificationCount(0);
      return;
    }

    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      const unreadCount = data.filter((notif: Notification) => !notif.is_read).length;

      // Show toast for new notifications
      const newNotifications = data.filter((notif: Notification) =>
        !notif.is_read && !notifications.find(n => n.id === notif.id)
      );

      if (newNotifications.length > 0) {
        newNotifications.forEach(notif => {
          toast.info(notif.title, {
            description: notif.message,
            duration: 5000,
          });
        });
      }

      setNotificationCount(unreadCount);
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);

      // The notification service already handles 401 errors and redirects to login
      // Only show error toast for other types of errors
      if (error.response?.status !== 401) {
        toast.error("Failed to load notifications");
      }

      // Reset state on error
      setNotifications([]);
      setNotificationCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [notifications]);

  useEffect(() => {
    // Only fetch notifications if user is authenticated
    const token = localStorage.getItem("token");
    if (token) {
      fetchNotifications();
      // Set up polling for notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to mark notifications as read");
      return;
    }

    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setNotificationCount(0);
      toast.success("All notifications marked as read");
    } catch (error: any) {
      console.error("Failed to mark notifications as read:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to mark notifications as read");
      } else {
        toast.error("Failed to mark notifications as read");
      }
    }
  };

  const handleMarkAsRead = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to mark notification as read");
      return;
    }

    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(notif =>
        notif.id === id ? { ...notif, is_read: true } : notif
      ));
      setNotificationCount(prev => Math.max(0, prev - 1));
      toast.success("Notification marked as read");
    } catch (error: any) {
      console.error("Failed to mark notification as read:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to mark notification as read");
      } else {
        toast.error("Failed to mark notification as read");
      }
    }
  };

  const getNavItems = () => {
    const role = getUserRole();

    // Default navigation items for all users
    const defaultItems = [
      { to: "/dashboard", icon: BarChart3, label: "Dashboard", permission: "hide_dashboard" },
      { to: "/orders", icon: Package, label: "Orders", permission: "hide_orders" },
      { to: "/qr-orders/list", icon: QrCode, label: "QR Orders", permission: null },
      { to: "/qr-orders/submit", icon: QrCode, label: "Submit QR Order", permission: null },
      // { to: "/qr-orders/search", icon: QrCode, label: "Search QR Orders", permission: null },
      { to: "/payments", icon: CreditCard, label: "Payments", permission: "hide_payments" },
      { to: "/reports", icon: FileText, label: "Reports", permission: "hide_reports" },
    ];

    // Add QR Reports only for admin users
    if (role === "admin") {
      defaultItems.push({ to: "/report/qr-orders", icon: FileText, label: "QR Reports", permission: null });
    }

    // Additional navigation items for admin users
    const adminItems = [
      { to: "/users", icon: Users, label: "Manage Users", permission: null },
      // { to: "/settings", icon: Settings, label: "System Settings", permission: null },
      // { to: "/audit", icon: History, label: "Audit Logs", permission: null },
    ];

    // Filter items based on permissions for all users
    const filteredDefaultItems = defaultItems.filter(item => {
      // If no permission is required, show the item
      if (!item.permission) return true;

      // Check if user does NOT have the hide permission
      return !userPermissions.includes(item.permission);
    });

    if (role === "admin") {
      return [...filteredDefaultItems, ...adminItems];
    }

    return filteredDefaultItems;
  };
  
  const navItems = getNavItems();

  const handleLogout = () => {
    logout(navigate);
  };

  const handleRoleSwitch = async (role: "admin" | "customer" | "limited") => {
    try {
      const user = await loginAsDemo(role);
      toast.success(`Switched to ${user.full_name}`);
      navigate(user.role === "admin" ? "/dashboard" : "/qr-orders/create");
    } catch {
      toast.error("Failed to switch test role");
    }
  };

  const admin = isAdmin();

  if (admin) {
    // Admin Sidebar Layout
    return (
      <>
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-card border border-border shadow-card"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <nav className={`fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-card z-40 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:flex`}>
        {/* Logo */}
        <div className="flex items-center justify-center p-4 border-b border-border">
          <NavLink to="/dashboard" className="flex items-center space-x-2">
            <div className="bg-gradient-primary p-2 rounded-lg shadow-primary">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">LogiTrack</span>
          </NavLink>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="shrink-0 border-t border-border p-4 space-y-4 bg-card">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start relative">
                <Bell className="h-5 w-5 mr-3" />
                <span>Notifications</span>
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <div className="p-2 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Notifications</h4>
                  {notificationCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="h-7 text-xs"
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 space-y-1 ${
                        !notification.is_read ? "bg-accent/50" : ""
                      }`}
                      onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm">{notification.title}</span>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <User className="h-5 w-5 mr-3" />
                <span>{fullName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleRoleSwitch("admin")}>
                Switch to Admin Demo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleSwitch("customer")}>
                Switch to Customer Demo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleSwitch("limited")}>
                Switch to Limited Demo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </Button>
        </div>
      </nav>
      </>
    );
  }

  // Non-admin Top Navbar Layout
  return (
    <nav className="bg-card border-b border-border shadow-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-gradient-primary p-2 rounded-lg shadow-primary">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">LogiTrack</span>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                      {notificationCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="p-2 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Notifications</h4>
                    {notificationCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleMarkAllAsRead}
                        className="h-7 text-xs"
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start p-3 space-y-1 ${
                          !notification.is_read ? "bg-accent/50" : ""
                        }`}
                        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">{notification.title}</span>
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleRoleSwitch("admin")}>
                  Switch to Admin Demo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleSwitch("customer")}>
                  Switch to Customer Demo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleSwitch("limited")}>
                  Switch to Limited Demo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative mr-2">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                      {notificationCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96">
                <div className="p-2 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Notifications</h4>
                    {notificationCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleMarkAllAsRead}
                        className="h-7 text-xs"
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start p-3 space-y-1 ${
                          !notification.is_read ? "bg-accent/50" : ""
                        }`}
                        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">{notification.title}</span>
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <div className="border-t border-border pt-2 mt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-accent w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
