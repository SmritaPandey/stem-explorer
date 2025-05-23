"use client";

/**
 * OAuth Callback Page
 *
 * This page handles the callback from OAuth providers (Google, GitHub).
 * It processes the authentication result and creates a user profile if needed.
 */

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import supabase from "@/lib/supabase";

/**
 * Authentication Callback Page Component
 *
 * Handles the OAuth authentication flow completion:
 * 1. Processes the callback from OAuth providers
 * 2. Checks if the user has a profile in the database
 * 3. Creates a profile if one doesn't exist
 * 4. Redirects to the dashboard or login page based on authentication result
 */
export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackPageContent />
    </Suspense>
  );
}

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      console.error("Authentication error:", error);
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          router.push("/login?error=Authentication failed");
          return;
        }

        if (data.session) {
          // Check if user has a profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          // If no profile exists, create one
          if (profileError || !profile) {
            const user = data.session.user;

            await supabase.from('profiles').insert({
              id: user.id,
              email: user.email,
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              role: 'user'
            });
          }

          // Redirect to dashboard
          router.push("/dashboard");
        } else {
          router.push("/login?error=No session found");
        }
      } catch (error) {
        console.error("Error in auth callback:", error);
        router.push("/login?error=Server error");
      }
    };

    handleAuthCallback();
  }, [error, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Completing authentication...</h1>
        <p className="text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  );
}
