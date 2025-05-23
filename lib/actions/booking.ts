import { supabase } from "../supabase"

// Type that matches the 'bookings' table structure in Supabase
// This type is for direct database interaction within this module.
// The more generic 'Booking' type in lib/data.ts is for broader application use (e.g., display).
export type DbBooking = {
  id: string // UUID
  user_id: string // UUID
  session_id: string // UUID
  status: "confirmed" | "cancelled" | "completed"
  payment_status: "pending" | "paid" | "refunded"
  payment_id?: string | null
  amount_paid: number // DECIMAL(10, 2) in DB, number in JS
  booking_date: string // TIMESTAMP WITH TIME ZONE
  created_at: string // TIMESTAMP WITH TIME ZONE
  updated_at: string // TIMESTAMP WITH TIME ZONE
}

/**
 * Creates a new booking for a user for a specific program session.
 *
 * @param sessionId - The ID of the program session to book.
 * @param userId - The ID of the user making the booking. This should be the authenticated user's ID.
 * @param amountPaid - The amount paid for the booking.
 * @param paymentId - Optional payment ID from the payment processor.
 * @returns The created booking object if successful, otherwise throws an error.
 */
export async function createBooking(
  sessionId: string,
  userId: string,
  amountPaid: number,
  paymentId?: string,
): Promise<DbBooking> {
  try {
    // Ensure userId is provided, as RLS policies will depend on auth.uid()
    if (!userId) {
      throw new Error("User ID is required to create a booking.")
    }

    const bookingData = {
      session_id: sessionId,
      user_id: userId, // This will be checked by RLS policy: auth.uid() = user_id
      amount_paid: amountPaid,
      payment_id: paymentId,
      status: "confirmed" as const,
      payment_status: "paid" as const, // Assuming payment is successful when this function is called
      booking_date: new Date().toISOString(),
      // created_at and updated_at will be set by Supabase defaults
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert(bookingData)
      .select() // Select all columns of the newly inserted row
      .single() // Expect a single object in return

    if (error) {
      console.error("Supabase error creating booking:", error)
      // Check for specific error types, e.g., unique constraint violation (user_id, session_id)
      if (error.code === "23505") { // Unique violation
        throw new Error("This session has already been booked by the user.")
      }
      throw new Error(`Failed to create booking: ${error.message}`)
    }

    if (!data) {
      throw new Error("Failed to create booking: No data returned from Supabase.")
    }
    
    return data as DbBooking // Cast to DbBooking, trusting the select() returns matching fields

  } catch (error) {
    console.error("Unexpected error in createBooking:", error)
    // Re-throw to be handled by the caller, ensuring it's an Error instance
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred while creating the booking.")
  }
}

/**
 * Cancels an existing booking for a user.
 *
 * @param bookingId - The ID of the booking to cancel.
 * @param userId - The ID of the user attempting to cancel. This should be the authenticated user's ID.
 * @returns The updated booking object with 'cancelled' status if successful, otherwise throws an error.
 */
export async function cancelBooking(bookingId: string, userId: string): Promise<DbBooking> {
  try {
    // Ensure userId is provided for the check
    if (!userId) {
      throw new Error("User ID is required to cancel a booking.")
    }

    // Step 1: Verify the booking exists and belongs to the user.
    // RLS policy "Users can update their own bookings" (USING (auth.uid() = user_id))
    // should handle the authorization at DB level.
    // However, an explicit check here can provide clearer error messages.
    const { data: existingBooking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, user_id, status")
      .eq("id", bookingId)
      .single()

    if (fetchError) {
      console.error("Supabase error fetching booking for cancellation check:", fetchError)
      throw new Error(`Failed to verify booking for cancellation: ${fetchError.message}`)
    }

    if (!existingBooking) {
      throw new Error("Booking not found.")
    }

    if (existingBooking.user_id !== userId) {
      // This check is an additional safeguard. RLS is the primary enforcer.
      console.warn(`User ${userId} attempt to cancel booking ${bookingId} not owned by them (owner: ${existingBooking.user_id}). RLS should prevent this.`)
      throw new Error("Access denied: You can only cancel your own bookings.")
    }
    
    if (existingBooking.status === "cancelled") {
      // Optional: prevent re-cancelling if already cancelled
      // return existingBooking as DbBooking; 
      throw new Error("Booking is already cancelled.")
    }

    // Step 2: Proceed with cancellation if checks pass.
    const { data, error: updateError } = await supabase
      .from("bookings")
      .update({ 
        status: "cancelled" as const, 
        payment_status: "refunded" as const, // Assuming a refund process is tied to cancellation
        updated_at: new Date().toISOString() 
      })
      .eq("id", bookingId)
      // The .eq('user_id', userId) here is redundant if RLS "UPDATE...USING (auth.uid() = user_id)" is active and effective.
      // If RLS were not specific to auth.uid(), then this line would be crucial.
      // .eq("user_id", userId) 
      .select()
      .single()

    if (updateError) {
      console.error("Supabase error cancelling booking:", updateError)
      throw new Error(`Failed to cancel booking: ${updateError.message}`)
    }
    
    if (!data) {
      throw new Error("Failed to cancel booking: No data returned after update from Supabase.")
    }

    return data as DbBooking

  } catch (error) {
    console.error("Unexpected error in cancelBooking:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred while cancelling the booking.")
  }
}
