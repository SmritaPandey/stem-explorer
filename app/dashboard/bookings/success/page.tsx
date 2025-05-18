"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { getBookings } from "@/lib/dashboard-api";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");
  const [isLoading, setIsLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setIsLoading(true);
        
        // Get all bookings and find the one that matches the ID
        const response = await getBookings();
        
        if (response.success) {
          const booking = response.data.find(
            (b: any) => b.id.toString() === bookingId
          );
          
          if (booking) {
            setBookingDetails(booking);
          } else {
            setError("Booking not found");
          }
        } else {
          setError("Failed to fetch booking details");
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        setError("An error occurred while fetching booking details");
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    } else {
      setIsLoading(false);
    }
  }, [bookingId]);

  const handleViewBookings = () => {
    router.push("/dashboard/bookings");
  };

  const handleViewPrograms = () => {
    router.push("/dashboard/programs");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold">Processing your booking...</h1>
        <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Payment Error</CardTitle>
            <CardDescription>
              We encountered an issue with your payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleViewPrograms}>
              Browse Programs
            </Button>
            <Button onClick={handleViewBookings}>
              View My Bookings
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your booking has been confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookingDetails && (
            <>
              <div className="space-y-1">
                <p className="text-sm font-medium">Program:</p>
                <p>{bookingDetails.program_title}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Date:</p>
                <p>{new Date(bookingDetails.program_date).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Time:</p>
                <p>{bookingDetails.program_time}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Booking ID:</p>
                <p>{bookingDetails.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Status:</p>
                <p className="text-green-600 font-medium">{bookingDetails.status}</p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleViewPrograms}>
            Browse More Programs
          </Button>
          <Button onClick={handleViewBookings}>
            View My Bookings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
