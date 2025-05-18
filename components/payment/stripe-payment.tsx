"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createPaymentIntent } from "@/lib/dashboard-api";

// Load Stripe outside of component to avoid recreating it on each render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface CheckoutFormProps {
  programId: number;
  bookingId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ programId, bookingId, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/bookings/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred with your payment");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess();
      }
    } catch (error: any) {
      setErrorMessage(error.message || "An error occurred with your payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-sm text-destructive">{errorMessage}</div>
      )}
      
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Pay now"
          )}
        </Button>
      </div>
    </form>
  );
}

interface StripePaymentProps {
  programId: number;
  bookingId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripePayment({
  programId,
  bookingId,
  onSuccess,
  onCancel,
}: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create a payment intent on the server
        const response = await createPaymentIntent(programId, bookingId);

        if (response.success) {
          setClientSecret(response.data.clientSecret);
          
          // If bookingId wasn't provided, it was created during payment intent creation
          if (!bookingId && response.data.bookingId) {
            bookingId = response.data.bookingId;
          }
        } else {
          setError(response.error || "Failed to initialize payment");
        }
      } catch (error: any) {
        setError(
          error.response?.data?.error || 
          "An error occurred while setting up the payment"
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [programId, bookingId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={onCancel}>Go Back</Button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Unable to initialize payment</p>
        <Button onClick={onCancel}>Go Back</Button>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm 
          programId={programId} 
          bookingId={bookingId}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Elements>
    </div>
  );
}
