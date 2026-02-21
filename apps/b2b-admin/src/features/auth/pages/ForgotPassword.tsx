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
import { Link } from "react-router-dom"
import * as Icons from 'lucide-react';

const {
  Activity,
  ArrowLeft,
  Mail
} = Icons as any;

export default function ForgotPasswordPage() {
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

      {/* Forgot Password Card */}
      <Card className="w-full max-w-md border-slate-200 shadow-elevated">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Mail className="h-5 w-5 text-slate-600" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-slate-800">
            Forgot password?
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            No worries, we'll send you reset instructions.
          </CardDescription>
        </CardHeader>
        
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
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button className="w-full h-11 text-sm font-medium">
            Send Reset Link
          </Button>
          
          <Link 
            to="/auth/login" 
            className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </CardFooter>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-400 text-center">
        © 2024 TripAlfa. All rights reserved.
      </p>
    </div>
  )
}
