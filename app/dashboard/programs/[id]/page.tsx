"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Clock, CreditCard, MapPin, Rocket, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function ProgramDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("credit-card")

  // Mock program data (in a real app, you would fetch this based on the ID)
  const program = {
    id: params.id,
    title: "Robotics Workshop",
    description:
      "Learn to build and program robots with hands-on activities. This workshop is designed for young aspiring engineers who want to explore the exciting world of robotics. You'll learn about mechanical design, electronics, and programming as you build your own robot.",
    longDescription:
      "In this hands-on workshop, participants will learn the fundamentals of robotics engineering. The program covers mechanical design principles, basic electronics, and programming concepts. Students will work in small teams to design, build, and program their own robots to complete specific challenges. All materials and tools will be provided. No prior experience is necessary, making this perfect for beginners interested in engineering and technology.",
    category: "Engineering",
    level: "Beginner",
    duration: "2 hours",
    date: "June 15, 2023",
    time: "10:00 AM - 12:00 PM",
    location: "STEM Innovation Center, 123 Science Way",
    instructor: "Dr. Jane Smith",
    seats: 15,
    price: "$25",
    requirements: [
      "No prior experience required",
      "Suitable for ages 10-14",
      "All materials provided",
      "Bring a notebook and pencil",
    ],
    topics: [
      "Introduction to robotics",
      "Mechanical design basics",
      "Electronics fundamentals",
      "Programming with block-based code",
      "Building a functional robot",
      "Testing and troubleshooting",
    ],
  }

  const handleRegister = () => {
    setShowPaymentDialog(true)
  }

  const handlePayment = () => {
    setShowPaymentDialog(false)

    // Show success toast
    toast({
      title: "Registration successful!",
      description: "You have successfully registered for the Robotics Workshop.",
    })

    // Redirect to bookings page
    setTimeout(() => {
      router.push("/dashboard/bookings")
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/programs">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{program.title}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>About this Program</CardTitle>
                  <CardDescription>Program details and information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{program.longDescription}</p>

              <div>
                <h3 className="font-semibold mb-2">What You'll Learn</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {program.topics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {program.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{program.instructor}</h3>
                <p className="text-sm text-muted-foreground">
                  Robotics Engineer with over 10 years of experience teaching STEM subjects to young students.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{program.category}</Badge>
                <Badge variant="outline">{program.level}</Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">{program.date}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Time & Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {program.time} ({program.duration})
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{program.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Available Seats</p>
                    <p className="text-sm text-muted-foreground">{program.seats} seats remaining</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold">{program.price}</p>
                </div>
                <Button onClick={handleRegister}>Register Now</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Registration</DialogTitle>
            <DialogDescription>Please provide your payment details to register for {program.title}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Payment Method</h4>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit-card" id="credit-card" />
                  <Label htmlFor="credit-card" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal">PayPal</Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === "credit-card" && (
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input id="card-number" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" />
                  </div>
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="name">Name on Card</Label>
                  <Input id="name" placeholder="John Doe" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{program.price}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment}>Complete Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

