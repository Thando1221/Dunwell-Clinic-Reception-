import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import clinicLogo from "@/assets/clinic-logo.png"; // Your clinic logo
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Handle login via Azure SWA
  const handleLogin = () => {
    setIsLoading(true);

    // Redirect to SWA login route (GitHub as example)
    // Change 'github' to 'azuread' or 'google' if needed
    window.location.href = "/.auth/login/github?post_login_redirect_uri=/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 
      bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      <Card className="w-full max-w-lg p-6 rounded-2xl shadow-2xl 
        bg-white/10 backdrop-blur-xl border border-white/20">
        
        <CardHeader className="text-center space-y-3">
          <img
            src={clinicLogo}
            alt="Clinic Logo"
            className="w-24 mx-auto drop-shadow-lg"
          />
          <CardTitle className="text-3xl font-bold text-white tracking-tight">
            Dunwell Youth Priority Clinic
          </CardTitle>
          <CardDescription className="text-lg font-medium text-gray-300">
            Reception Access • Staff Login
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-5">
          <p className="text-gray-200">Sign in with your provider</p>
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-12 text-lg font-semibold rounded-xl 
              bg-gradient-to-r from-blue-900 to-gray-700 
              hover:brightness-110 shadow-lg shadow-black/30 transition-all"
          >
            {isLoading ? "Redirecting..." : "Sign In with GitHub"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
