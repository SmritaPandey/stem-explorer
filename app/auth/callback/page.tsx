"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      console.error("Authentication error:", error);
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      // Store the token
      localStorage.setItem("accessToken", token);

      // Fetch user data
      const fetchUserData = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Store user data
              localStorage.setItem("user", JSON.stringify(data.data.user));
              
              // Redirect to dashboard
              router.push("/dashboard");
            } else {
              router.push("/login?error=Failed to get user data");
            }
          } else {
            router.push("/login?error=Authentication failed");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          router.push("/login?error=Server error");
        }
      };

      fetchUserData();
    } else {
      router.push("/login?error=No authentication token received");
    }
  }, [token, error, router]);

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
