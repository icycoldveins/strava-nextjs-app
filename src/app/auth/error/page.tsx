"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle, ArrowLeft, AlertTriangle } from "lucide-react";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = () => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration. Please contact support.";
      case "AccessDenied":
        return "You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      case "OAuthSignin":
        return "Error connecting to Strava. Please check your Strava app configuration.";
      case "OAuthCallback":
        return "Error during authentication callback. Make sure your redirect URL is correctly configured in your Strava app settings.";
      case "OAuthCreateAccount":
        return "Could not create user account. Please try again.";
      case "EmailCreateAccount":
        return "Could not create user account. Please try again.";
      case "Callback":
        return "Authentication callback error. Please ensure your redirect URLs are configured correctly.";
      default:
        return "An unexpected error occurred during authentication. Please try again.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
      
      <Card className="w-full max-w-lg shadow-xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg animate-pulse">
              <XCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Authentication Failed
          </CardTitle>
          <CardDescription className="text-base">
            We encountered an error while trying to authenticate you
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">
              Error: {error || "Unknown Error"}
            </AlertTitle>
            <AlertDescription className="mt-2">
              {getErrorMessage()}
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Troubleshooting Steps:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Verify your Strava app is active and not suspended</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>
                  Check the redirect URL in Strava app settings:
                  <code className="block mt-1 text-xs bg-white px-2 py-1 rounded border font-mono">
                    {process.env.NEXT_PUBLIC_NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/strava
                  </code>
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Confirm Client ID and Secret are correct in .env.local</span>
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button 
            asChild 
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            <Link href="/auth/signin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Try Again
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/">
              Go Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}