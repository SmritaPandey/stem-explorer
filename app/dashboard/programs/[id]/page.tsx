"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Calendar, Clock, CreditCard, MapPin, Rocket,
  Users, CheckCircle, Sparkles, Star, Beaker, Brain, Puzzle, Lightbulb, Loader2
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

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
  const { user } = useAuth()
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // Helper function to get icon based on program name
  function getIconForProgram(programName: string) {
    const lowerName = programName.toLowerCase()
    if (lowerName.includes('robot')) return Rocket
    if (lowerName.includes('cod') || lowerName.includes('program')) return Puzzle
    if (lowerName.includes('science')) return Beaker
    if (lowerName.includes('math')) return Brain
    if (lowerName.includes('wizard')) return Sparkles
    if (lowerName.includes('explor')) return Lightbulb
    return Rocket // Default icon
  }

  // Mock program data with more child-friendly descriptions
  const programOptions = [
    {
      id: "1",
      title: "Robot Builders Club",
      description:
        "Build your own robot friend and teach it to do cool tricks! Perfect for beginners who want to learn about robots in a fun way.",
      longDescription:
        "Join our exciting Robot Builders Club where you'll create your very own robot friend! 🤖 You'll learn how robots work, build cool mechanical parts, and program your robot to do amazing tricks. Work with other young inventors to solve fun challenges. All the tools and parts are provided, so just bring your imagination! No experience needed - this adventure is perfect for first-time robot builders!",
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
        "No experience needed - beginners welcome!",
        "For explorers ages 8-12",
        "All robot parts and tools provided",
        "Bring your creativity and a notebook",
      ],
      topics: [
        "Meet different types of robots",
        "Build cool robot parts",
        "Make your robot move with simple code",
        "Solve fun robot challenges",
        "Create your own robot friend",
        "Show off what your robot can do",
      ],
    },
    {
      id: "2",
      title: "Code Wizards",
      description:
        "Create your own games and animations with fun, colorful block coding! No experience needed.",
      longDescription:
        "Become a Code Wizard in this magical coding adventure! ✨ You'll learn how to create your very own games, stories, and animations using colorful blocks that snap together like puzzle pieces. No typing required! Design your own characters, make them move, and build exciting games that you can share with friends and family. This workshop is perfect for young creators who want to bring their ideas to life through code.",
      category: "Programming",
      level: "Beginner",
      duration: "1.5 hours",
      date: "June 20, 2023",
      time: "3:30 PM - 5:00 PM",
      location: "STEM Innovation Center, 123 Science Way",
      instructor: "Mr. Alex Johnson",
      seats: 12,
      price: "$20",
      requirements: [
        "No coding experience needed",
        "For explorers ages 7-10",
        "All computers provided",
        "Bring your imagination!",
      ],
      topics: [
        "Learn coding with colorful blocks",
        "Create your own characters",
        "Make animations and stories",
        "Build simple games",
        "Add sounds and special effects",
        "Share your creations with friends",
      ],
    },
    {
      id: "3",
      title: "Science Explorers",
      description:
        "Mix potions, launch rockets, and discover the secrets of nature with amazing experiments!",
      longDescription:
        "Calling all curious minds to join our Science Explorers adventure! 🔬 Get ready to mix colorful potions that bubble and change color, launch mini-rockets into the sky, and uncover amazing secrets about the world around us. You'll conduct real experiments like a scientist, make exciting discoveries, and take home some of your creations. This hands-on workshop is full of 'wow' moments that will make science your new favorite subject!",
      category: "Science",
      level: "Beginner",
      duration: "2 hours",
      date: "June 25, 2023",
      time: "10:00 AM - 12:00 PM",
      location: "STEM Innovation Center, 123 Science Way",
      instructor: "Dr. Maria Garcia",
      seats: 18,
      price: "$22",
      requirements: [
        "No experience needed - just curiosity!",
        "For explorers ages 6-11",
        "All materials provided",
        "Wear clothes that can get a little messy",
      ],
      topics: [
        "Mix colorful chemical reactions",
        "Launch mini-rockets",
        "Discover invisible ink secrets",
        "Create slime and bouncy balls",
        "Build a mini volcano",
        "Explore the science of rainbows",
      ],
    }
  ];

  // Find the program based on the ID
  const program = programOptions.find(p => p.id === params.id) || programOptions[0];
  const ProgramIcon = getIconForProgram(program.title);

  const handleRegister = () => {
    setShowPaymentDialog(true)
  }

  const handlePayment = () => {
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setShowPaymentDialog(false)
      setShowSuccessDialog(true)

      // Show success toast
      toast({
        title: "Hooray! Registration complete! 🎉",
        description: `You've joined the ${program.title} adventure!`,
      })
    }, 2000)
  }

  const handleSuccessClose = () => {
    setShowSuccessDialog(false)

    // Redirect to bookings page
    router.push("/dashboard/bookings")
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-[0.625rem] border-2 border-[#D6EBFF]">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" className="rounded-full border-2 border-[#D6EBFF] text-[#0078FF]" asChild>
            <Link href="/dashboard/programs">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-[2.5rem] font-bold text-black">{program.title}</h1>
        </div>
        <p className="text-black text-lg ml-14">Join this exciting adventure and learn amazing things! 🚀</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <Card className="stem-card bg-white border-2 border-[#D6EBFF] overflow-hidden">
            <div className="bg-[#D6EBFF] h-2"></div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#F0F8FF] p-3">
                  <ProgramIcon className="h-6 w-6 text-[#0078FF] wiggling" />
                </div>
                <div>
                  <CardTitle className="text-black text-[1.5rem] font-bold">About This Adventure</CardTitle>
                  <CardDescription className="text-black">What you'll do and learn</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-black text-lg">{program.longDescription}</p>
              <div className="bg-[#F0F8FF] p-5 rounded-xl border border-[#D6EBFF]">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-5 w-5 text-[#00B300]" />
                  <h3 className="font-bold text-lg text-[#0078FF]">Cool Things You'll Learn</h3>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {program.topics.map((topic, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="bg-white p-1 rounded-full">
                        <CheckCircle className="h-4 w-4 text-[#00B300]" />
                      </div>
                      <span className="text-black">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#F8F0FF] p-5 rounded-xl border border-[#D6EBFF]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-[#7B00FF]" />
                  <h3 className="font-bold text-lg text-[#7B00FF]">What You Need to Know</h3>
                </div>
                <ul className="space-y-2">
                  {program.requirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="bg-white p-1 rounded-full">
                        <CheckCircle className="h-4 w-4 text-[#00B300]" />
                      </div>
                      <span className="text-black">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
          <Card className="stem-card bg-white border-2 border-[#D6EBFF] overflow-hidden">
            <div className="bg-[#D6EBFF] h-2"></div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#F0FFF0] p-3">
                  <Users className="h-6 w-6 text-[#00B300]" />
                </div>
                <CardTitle className="text-black text-[1.25rem] font-bold">Your Guide</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex items-start gap-5">
              <div className="h-20 w-20 rounded-full bg-white border-2 border-[#D6EBFF] flex items-center justify-center shadow-md">
                <div className="text-4xl">👩‍🔬</div>
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#00B300]">{program.instructor}</h3>
                <p className="text-black mt-1">
                  An amazing teacher who loves helping young explorers discover the wonders of {program.category}!
                  With lots of experience making learning fun and exciting for kids of all ages.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-8">
          <Card className="stem-card bg-white border-2 border-[#D6EBFF] overflow-hidden sticky top-4">
            <div className="bg-[#D6EBFF] h-2"></div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#F8F0FF] p-3">
                  <Calendar className="h-6 w-6 text-[#7B00FF]" />
                </div>
                <CardTitle className="text-black text-[1.25rem] font-bold">Adventure Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-[#F0F8FF] text-[#0078FF] border border-[#D6EBFF] text-sm py-1 px-3">{program.category}</Badge>
                <Badge variant="outline" className="border-2 border-[#00B300] text-[#00B300] text-sm py-1 px-3">{program.level}</Badge>
              </div>
              <div className="bg-[#F8F0FF] rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    <Calendar className="h-5 w-5 text-[#7B00FF]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#7B00FF]">When</p>
                    <p className="text-black">{program.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    <Clock className="h-5 w-5 text-[#7B00FF]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#7B00FF]">Time</p>
                    <p className="text-black">
                      {program.time} <span className="text-sm">({program.duration})</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    <MapPin className="h-5 w-5 text-[#7B00FF]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#7B00FF]">Where</p>
                    <p className="text-black">{program.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    <Users className="h-5 w-5 text-[#7B00FF]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#7B00FF]">Spots Left</p>
                    <p className="text-black">{program.seats} spots available</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#F0F8FF] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-[#0078FF]">Adventure Price</p>
                    <p className="text-3xl font-bold text-[#0078FF]">{program.price}</p>
                  </div>
                  <div className="text-5xl">🎒</div>
                </div>
                <Button
                  onClick={handleRegister}
                  className="w-full py-6 text-lg rounded-[0.625rem] bg-[#0078FF] text-white hover:bg-[#005fcc] shadow-sm hover:shadow-md transition-all btn-primary"
                >
                  Join This Adventure!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px] border-2 border-blue-200 rounded-xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <DialogTitle className="text-2xl font-bold text-blue-700">Almost There!</DialogTitle>
            </div>
            <DialogDescription className="text-foreground text-base">
              Just one more step to join the {program.title} adventure!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white p-2 rounded-full">
                  <ProgramIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-blue-700">{program.title}</h3>
              </div>
              <div className="flex items-center gap-2 ml-12 text-foreground">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{program.date} • {program.time}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-lg text-purple-700 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </h4>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="credit-card" id="credit-card" className="border-2 border-purple-300 text-purple-600" />
                  <Label htmlFor="credit-card" className="flex items-center gap-2 font-medium cursor-pointer">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    Credit Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paypal" id="paypal" className="border-2 border-purple-300 text-purple-600" />
                  <Label htmlFor="paypal" className="font-medium cursor-pointer">PayPal</Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === "credit-card" && (
              <div className="space-y-4 bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="card-number" className="font-medium text-green-700">Card Number</Label>
                  <Input id="card-number" placeholder="1234 5678 9012 3456" className="border-2 border-green-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid w-full items-center gap-2">
                    <Label htmlFor="expiry" className="font-medium text-green-700">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" className="border-2 border-green-200" />
                  </div>
                  <div className="grid w-full items-center gap-2">
                    <Label htmlFor="cvc" className="font-medium text-green-700">CVC</Label>
                    <Input id="cvc" placeholder="123" className="border-2 border-green-200" />
                  </div>
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="name" className="font-medium text-green-700">Name on Card</Label>
                  <Input id="name" placeholder="Parent/Guardian Name" className="border-2 border-green-200" />
                </div>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center justify-between">
              <div>
                <p className="font-medium text-yellow-700">Total Price</p>
                <p className="text-2xl font-bold text-yellow-600">{program.price}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              className="rounded-full border-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              Go Back
            </Button>
            <Button
              onClick={handlePayment}
              className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 px-8"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Complete Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[500px] border-2 border-green-200 rounded-xl">
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700">Woohoo! You're All Set!</h2>
            <p className="text-foreground text-lg">
              You've successfully joined the {program.title} adventure!
              We can't wait to see you there!
            </p>
            <div className="text-6xl my-4">🎉</div>
            <Button
              onClick={handleSuccessClose}
              className="rounded-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 py-6 px-8 mt-4"
            >
              See My Adventures
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

