import { Button } from "@tripalfa/ui-components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tripalfa/ui-components/ui/card"
import { Input } from "@tripalfa/ui-components/ui/input"
import { Label } from "@tripalfa/ui-components/ui/label"
import { Checkbox } from "@tripalfa/ui-components/ui/checkbox"
import { Link, useNavigate } from "react-router-dom"
import * as Icons from 'lucide-react';
import { useState, FormEvent } from "react"
import { toast } from "sonner"
import api from "@/shared/lib/api"

const {
  Activity,
  Eye,
  EyeOff,
  Loader2
} = Icons as any;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error("Please enter both email and password")
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post("/auth/login", { 
        email, 
        password,
        remember 
      })
      
      const { token, user } = response.data?.data || response.data
      
      if (token) {
        localStorage.setItem("token", token)
        if (remember) {
          localStorage.setItem("rememberMe", "true")
        }
        toast.success("Login successful!")
        navigate("/dashboard")
      } else {
        toast.error("Invalid response from server")
      }
    } catch (error: any) {
      console.error("Login failed", error)
      const message = error.response?.data?.message || error.message || "Login failed"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      {/* Logo Section */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700 text-white shadow-lg mb-4">
          <Activity className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-800">TripAlfa B2B</h1>
        <p className="text-sm text-slate-500 mt-1">Admin Portal</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md border-slate-200 shadow-elevated">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-xl font-semibold text-slate-800">
            Welcome back
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@organization.com" 
                required 
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <Link 
                  to="/auth/forgot-password" 
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required 
                  className="h-11 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked as boolean)}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm font-normal text-slate-600 cursor-pointer"
              >
                Remember me for 30 days
              </Label>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in to your account"
              )}
            </Button>
            
            <p className="text-xs text-center text-slate-500">
              By signing in, you agree to our{" "}
              <a href="#" className="text-slate-700 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-slate-700 hover:underline">
                Privacy Policy
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-400 text-center">
        © 2024 TripAlfa. All rights reserved.
      </p>
    </div>
  )
}
