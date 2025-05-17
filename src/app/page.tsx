"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // If not loading and no session, redirect to Strava sign in
    if (status !== "loading" && !session) {
      signIn("strava");
    }
  }, [session, status]);

  // Show loading state while checking auth status
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  // Once authenticated, show the actual page content
  if (session) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Welcome to your Strava Dashboard</h1>
          <button 
            onClick={() => signOut()} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Sign out
          </button>
        </div>
        
        <div>
          {session.user?.image && (
            <img 
              src={session.user.image} 
              alt="Profile" 
              className="w-12 h-12 rounded-full"
            />
          )}
          <p className="mt-2">Signed in as {session.user?.name}</p>
          
          {/* Your Strava data and app content goes here */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold">Your Strava Dashboard</h2>
            <p className="mt-2">You are successfully logged in with Strava!</p>
          </div>
        </div>
      </div>
    );
  }

  // This should rarely be shown as useEffect will trigger sign in
  return <div>Redirecting to Strava login...</div>;
}