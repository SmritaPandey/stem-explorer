"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import StripePayment from "@/components/payment/stripe-payment";
import { createCheckoutSession } from "@/lib/dashboard-api";

interface ProgramBookingProps {
  program: {
    id: number;
    title: string;
    price: number;
    seats: number;
    booked_seats?: number;
  };
}

export default function ProgramBooking({ program }: ProgramBookingProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"confirm" | "payment" | "checkout">("confirm");
  const router = useRouter();
  const { toast } = useToast();

  const availableSeats = program.seats - (program.booked_seats || 0);
  const isFullyBooked = availableSeats <= 0;

  const handleBookNow = () => {
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setPaymentStep("confirm");
  };

  const handleConfirmBooking = () => {
    setPaymentStep("payment");
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Booking Successful!",
      description: "Your booking has been confirmed.",
    });
    setIsBookingOpen(false);
    router.push("/dashboard/bookings");
  };

  const handlePaymentCancel = () => {
    setPaymentStep("confirm");
  };

  const handleCheckoutRedirect = async () => {
    try {
      setIsLoading(true);
      
      const response = await createCheckoutSession(program.id);
      
      if (response.success && response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to create checkout session",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "An error occurred during checkout",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleBookNow} 
        disabled={isFullyBooked}
        className="w-full"
      >
        {isFullyBooked ? "Fully Booked" : "Book Now"}
      </Button>

      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {paymentStep === "confirm" && "Confirm Booking"}
              {paymentStep === "payment" && "Payment Details"}
              {paymentStep === "checkout" && "Redirecting to Checkout"}
            </DialogTitle>
            <DialogDescription>
              {paymentStep === "confirm" && `Book your spot for ${program.title}`}
              {paymentStep === "payment" && "Complete your payment to secure your booking"}
              {paymentStep === "checkout" && "You'll be redirected to our secure checkout page"}
            </DialogDescription>
          </DialogHeader>

          {paymentStep === "confirm" && (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Program:</p>
                    <p className="text-sm">{program.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Price:</p>
                    <p className="text-sm">${program.price.toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Available Seats:</p>
                  <p className="text-sm">{availableSeats} of {program.seats}</p>
                </div>
                <div>
                  <p className="text-sm">
                    By proceeding, you agree to our terms and conditions for program bookings.
                  </p>
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCloseBooking}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmBooking}>
                    Proceed to Payment
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setPaymentStep("checkout")}>
                  Use Checkout Page
                </Button>
              </DialogFooter>
            </>
          )}

          {paymentStep === "payment" && (
            <StripePayment
              programId={program.id}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          )}

          {paymentStep === "checkout" && (
            <>
              <div className="py-4 text-center">
                <p className="mb-4">
                  You'll be redirected to our secure checkout page to complete your booking.
                </p>
                {isLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Button onClick={handleCheckoutRedirect}>
                    Continue to Checkout
                  </Button>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentStep("confirm")}>
                  Go Back
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
