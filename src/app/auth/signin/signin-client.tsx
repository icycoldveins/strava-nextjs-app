"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, AlertCircle, Loader2 } from "lucide-react";

export default function SignInClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn("strava", { callbackUrl: "/" });
  };

  const getErrorMessage = () => {
    switch (error) {
      case "OAuthSignin":
        return "Error connecting to Strava. Please try again.";
      case "OAuthCallback":
        return "Error during authentication callback. Please check your Strava app settings.";
      case "OAuthCreateAccount":
        return "Could not create user account. Please try again.";
      case "Callback":
        return "Authentication callback error. Please ensure your redirect URLs are configured correctly.";
      default:
        return "An error occurred during sign in. Please try again.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
      
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
              <Activity className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Welcome to Strava Tracker
          </CardTitle>
          <CardDescription className="text-base">
            Connect your Strava account to track your activities
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{getErrorMessage()}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting to Strava...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Sign in with Strava
              </>
            )}
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center">
          <div className="text-xs text-muted-foreground">
            By signing in, you agree to share your Strava activity data
          </div>
          <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
            Callback: /api/auth/callback/strava
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}