import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Truck, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { login, loginAsDemo } from "@/lib/auth";

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const user = await login(formData.email, formData.password);

      toast({
        title: "Login successful",
        description: `Welcome back, ${user.full_name || "User"}!`,
      });
      
      // ✅ Dispatch session update event
      window.dispatchEvent(new Event("sessionUpdate"));

      // ✅ Optional: Delay 1.5s to let toast show before redirect
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // ✅ Optional manual navigation (in case event doesn’t trigger fast enough)
      navigate(user.role === "admin" ? "/dashboard" : "/qr-orders/create");

      // Clear form fields after successful login
      setFormData({ email: "", password: "" });

      // No need for manual navigation - AppRouter will handle redirect automatically via sessionUpdate event
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDemoLogin = async (role: "admin" | "customer" | "limited") => {
    setIsLoading(true);
    setError("");

    try {
      const user = await loginAsDemo(role);
      toast({
        title: "Demo session ready",
        description: `Signed in as ${user.full_name}.`,
      });
      navigate(user.role === "admin" ? "/dashboard" : "/qr-orders/create");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start demo session.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-card p-4 rounded-2xl shadow-glow">
              <Truck className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-card">LogiTrack</h1>
          <p className="text-card/80 mt-2">Professional Logistics Management</p>
        </div>

        <Card className="shadow-card border-0 bg-card/95 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary hover:shadow-primary" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="mb-2 font-medium text-foreground">UI Test Roles</p>
                <div className="grid gap-2">
                  <Button type="button" variant="outline" onClick={() => handleDemoLogin("admin")} disabled={isLoading}>
                    Login as Admin
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleDemoLogin("customer")} disabled={isLoading}>
                    Login as Customer
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleDemoLogin("limited")} disabled={isLoading}>
                    Login as Limited Customer
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Manual demo credentials: `admin@logitrack.test` / `customer@logitrack.test` / `limited@logitrack.test`
                </p>
                <p className="text-xs text-muted-foreground">Password: `demo123`</p>
              </div>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to="/register" className="text-primary hover:text-primary-glow font-medium transition-colors">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
