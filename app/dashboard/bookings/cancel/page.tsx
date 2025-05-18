"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { useEffect } from "react";
import { cancelBooking } from "@/lib/dashboard-api";

export default function PaymentCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  useEffect(() => {
    const cancelPendingBooking = async () => {
      if (bookingId) {
        try {
          // Cancel the booking if it exists
          await cancelBooking(parseInt(bookingId));
        } catch (error) {
          console.error("Error cancelling booking:", error);
        }
      }
    };

    cancelPendingBooking();
  }, [bookingId]);

  const handleViewPrograms = () => {
    router.push("/dashboard/programs");
  };

  const handleViewBookings = () => {
    router.push("/dashboard/bookings");
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your booking has been cancelled and no payment was processed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            You can try again or browse other programs.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleViewBookings}>
            View My Bookings
          </Button>
          <Button onClick={handleViewPrograms}>
            Browse Programs
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
