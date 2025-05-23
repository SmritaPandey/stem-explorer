"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Calendar, Clock, CreditCard, MapPin, Rocket, Code, Atom, BookOpen, // Added Code, Atom, BookOpen
  Users, CheckCircle, Sparkles, Star, Beaker, Brain, Puzzle, Lightbulb, Loader2, AlertTriangle
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
// Import Program type, getProgramById, createStripeCheckoutSession, ProgramSession, getProgramSessions, Material, getMaterialsForProgram, getMaterialDownloadUrlClient
import { 
  type Program, getProgramById, createStripeCheckoutSession, // Updated createBooking to createStripeCheckoutSession
  type ProgramSession, getProgramSessions, type NewBookingData, // NewBookingData might be adjusted/removed if not directly used
  type Material, getMaterialsForProgram, getMaterialDownloadUrlClient
} from "@/lib/data" 
import type { LucideIcon } from "lucide-react"
import { Download, FileText, Image as ImageIcon, Video, Music, Archive, AlertCircle, ExternalLink } from "lucide-react" // Icons for materials & ExternalLink

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

// Icon mapping for program details
const IconMapDetails: Record<string, LucideIcon> = {
  Rocket: Rocket,
  Code: Code,
  Atom: Atom,
  Brain: Brain,
  Puzzle: Puzzle,
  Beaker: Beaker,
  Lightbulb: Lightbulb,
  Sparkles: Sparkles,
  // Add other icons as needed from Program.icon string
};

const getProgramIconComponent = (iconName?: string | null, className?: string): React.ReactElement => {
  const IconComponent = iconName ? IconMapDetails[iconName] : null;
  if (IconComponent) {
    return <IconComponent className={className || "h-6 w-6 text-primary"} />;
  }
  return <Star className={className || "h-6 w-6 text-gray-400"} />; // Default fallback icon
};


export default function ProgramDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth() // Assuming useAuth provides user info for registration logic

  const [program, setProgram] = useState<Program | null>(null)
  const [isLoading, setIsLoading] = useState(true) // For program details
  const [error, setError] = useState<string | null>(null) // For program details

  const [sessions, setSessions] = useState<ProgramSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const [materials, setMaterials] = useState<Material[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [materialsError, setMaterialsError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState<number | null>(null); // Store ID of material being downloaded

  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  useEffect(() => {
    const fetchProgramData = async () => {
      setIsLoading(true); 
      setSessionsLoading(true);
      setMaterialsLoading(true);
      setError(null);
      setSessionsError(null);
      setMaterialsError(null);
      
      const programIdStr = params.id as string;

      if (!programIdStr || isNaN(Number(programIdStr))) {
        setError("Invalid program ID.");
        setIsLoading(false); setSessionsLoading(false); setMaterialsLoading(false);
        setProgram(null);
        return;
      }
      const programId = Number(programIdStr);

      try {
        const fetchedProgram = await getProgramById(programId);
        if (fetchedProgram) {
          setProgram(fetchedProgram);
          // Fetch sessions
          try {
            const fetchedSessions = await getProgramSessions(programId);
            setSessions(fetchedSessions);
          } catch (sessionError: any) {
            console.error("Failed to fetch program sessions:", sessionError);
            setSessionsError("Could not load available sessions.");
          }
          // Fetch materials
          try {
            const fetchedMaterials = await getMaterialsForProgram(programId);
            setMaterials(fetchedMaterials);
          } catch (materialError: any) {
            console.error("Failed to fetch program materials:", materialError);
            setMaterialsError("Could not load course materials.");
          }
        } else {
          setError("Program not found.");
        }
      } catch (e: any) {
        console.error("Failed to fetch program details:", e);
        setError("Could not load program details.");
      } finally {
        setIsLoading(false);
        setSessionsLoading(false);
        setMaterialsLoading(false);
      }
    };

    if (params.id) {
      fetchProgramData();
    } else {
      setError("No program ID provided.");
      setIsLoading(false); setSessionsLoading(false); setMaterialsLoading(false);
    }
  }, [params.id]);


  const handleRegister = () => {
    if (!program) return;
    if (!selectedSessionId) {
      toast({
        title: "Select a Session",
        description: "Please select an available session before proceeding.",
        variant: "warning",
      });
      return;
    }
    setShowPaymentDialog(true);
  }

  const handlePayment = async () => {
    if (!program || !user || !selectedSessionId) {
      toast({
        title: "Error",
        description: "User, program, or session details are missing. Cannot proceed.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);

    try {
      // Call the API to create a Stripe Checkout session
      const checkoutResponse = await createStripeCheckoutSession(program.id, selectedSessionId);

      if (checkoutResponse && checkoutResponse.url) {
        // Redirect to Stripe Checkout page
        window.location.href = checkoutResponse.url;
        // No need to set success dialog here, Stripe will redirect to success/cancel URLs
      } else {
        toast({
          title: "Checkout Failed",
          description: "Could not initiate the payment process. Please try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    } catch (error: any) {
      setIsProcessing(false);
      console.error("Error creating Stripe Checkout session:", error);
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred with the payment setup. Please try again.",
        variant: "destructive",
      });
    }
    // Note: isProcessing will remain true if redirected, which is fine.
    // If not redirected (error), it's set to false.
  }

  const handleSuccessClose = () => {
    setShowSuccessDialog(false)
    router.push("/dashboard/bookings") // Redirect to bookings page
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">Loading adventure details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Oops! Something went wrong.</h2>
        <p className="text-foreground mb-6">{error}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/programs")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Programs
        </Button>
      </div>
    )
  }

  if (!program) {
    // This case should ideally be covered by error state from fetch, but as a fallback:
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Program Not Found</h2>
        <p className="text-foreground mb-6">The program you are looking for does not exist or may have been moved.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/programs")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Programs
        </Button>
      </div>
    )
  }
  
  const ProgramIconElement = getProgramIconComponent(program.icon, "h-6 w-6 text-primary wiggling");
  const DialogProgramIconElement = getProgramIconComponent(program.icon, "h-5 w-5 text-blue-600");


  return (
    <div className="space-y-8">
      <div className="bg-card p-6 rounded-lg border">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" className="rounded-full" asChild>
            <Link href="/dashboard/programs">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-[2.5rem] font-bold text-foreground">{program.title}</h1>
        </div>
        <p className="text-muted-foreground text-lg ml-14">Join this exciting adventure and learn amazing things! 🚀</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <Card className="overflow-hidden">
            <div className="bg-primary/10 h-2"></div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-3 border">
                  {ProgramIconElement}
                </div>
                <div>
                  <CardTitle className="text-foreground text-[1.5rem] font-bold">About This Adventure</CardTitle>
                  <CardDescription className="text-muted-foreground">What you'll do and learn</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-foreground text-lg">{program.long_description || program.description}</p>
              
              {/* Topics Section */}
              {program.topics && program.topics.length > 0 && (
                <div className="bg-muted/50 p-5 rounded-xl border">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-green-500 fill-green-500" />
                    <h3 className="font-bold text-lg text-primary">Cool Things You'll Learn</h3>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {program.topics.map((topic, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="bg-background p-1 rounded-full border">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <span className="text-foreground">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements Section */}
              {program.requirements && program.requirements.length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-500 fill-purple-500" />
                    <h3 className="font-bold text-lg text-purple-600 dark:text-purple-400">What You Need to Know</h3>
                  </div>
                  <ul className="space-y-2">
                    {program.requirements.map((req, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="bg-background p-1 rounded-full border">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <span className="text-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Materials Section */}
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-foreground text-[1.5rem] font-bold">Course Materials</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">Downloadable resources for this program.</CardDescription>
            </CardHeader>
            <CardContent>
              {materialsLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
              {materialsError && <p className="text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {materialsError}</p>}
              {!materialsLoading && !materialsError && materials.length === 0 && (
                <p className="text-muted-foreground">No materials available for this program yet.</p>
              )}
              {!materialsLoading && !materialsError && materials.length > 0 && (
                <ul className="space-y-3">
                  {materials.map((material) => (
                    <li key={material.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/20 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getMaterialFileIcon(material.file_type)}
                        <div>
                          <p className="font-semibold text-foreground">{material.title}</p>
                          <p className="text-xs text-muted-foreground">{material.file_name} ({(material.file_size / 1024).toFixed(1)} KB)</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadMaterial(material.id, material.file_name)}
                        disabled={isDownloading === material.id}
                      >
                        {isDownloading === material.id ? 
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                          <Download className="mr-2 h-4 w-4" />
                        }
                        Download
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {program.instructor && (
            <Card className="overflow-hidden">
              <div className="bg-green-500/10 h-2"></div>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-3 border">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-foreground text-[1.25rem] font-bold">Your Guide</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex items-start gap-5">
                <div className="h-20 w-20 rounded-full bg-muted border flex items-center justify-center shadow-md">
                  <div className="text-4xl">👩‍🔬</div> {/* Placeholder, consider storing instructor avatar URL */}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-green-600">{program.instructor}</h3>
                  <p className="text-muted-foreground mt-1">
                    An amazing teacher who loves helping young explorers discover the wonders of {program.category}!
                    With lots of experience making learning fun and exciting for kids of all ages.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="space-y-8">
          <Card className="overflow-hidden sticky top-20"> {/* Adjusted sticky top for better layout */}
            <div className="bg-purple-500/10 h-2"></div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-3 border">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-foreground text-[1.25rem] font-bold">Adventure Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Program Badges (Category, Level, etc.) */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{program.category}</Badge>
                <Badge variant="outline">{program.level}</Badge>
                {program.format && <Badge variant="outline">{program.format}</Badge>}
                {program.age_group && <Badge variant="outline">Ages: {program.age_group}</Badge>}
              </div>

              {/* Session Selection Section */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Available Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {sessionsLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  {sessionsError && <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4"/> {sessionsError}</p>}
                  {!sessionsLoading && !sessionsError && sessions.length === 0 && (
                    <p className="text-muted-foreground text-sm">No upcoming sessions for this program.</p>
                  )}
                  {!sessionsLoading && !sessionsError && sessions.length > 0 && (
                    <RadioGroup value={selectedSessionId || ""} onValueChange={setSelectedSessionId} className="max-h-60 overflow-y-auto pr-2 space-y-2">
                      {sessions.map((session) => {
                        const availableSeats = (session.max_capacity || program.seats) - session.current_capacity;
                        const isFull = availableSeats <= 0;
                        const isPast = new Date(session.start_time) < new Date();
                        const isDisabled = isFull || isPast || session.is_cancelled;
                        return (
                          <Label
                            key={session.id}
                            htmlFor={session.id}
                            className={`flex items-center justify-between rounded-md border p-3 hover:border-primary transition-all text-xs
                              ${selectedSessionId === session.id ? "border-primary ring-1 ring-primary" : "border-muted"}
                              ${isDisabled ? "opacity-60 cursor-not-allowed bg-muted/30" : "cursor-pointer"}`}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={session.id} id={session.id} disabled={isDisabled} />
                              <div>
                                <p className="font-medium text-sm">
                                  {new Date(session.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                  {' @ '}
                                  {new Date(session.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </p>
                                {session.is_cancelled && <Badge variant="destructive" className="text-xs mt-1">Cancelled</Badge>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium text-xs ${isFull ? 'text-destructive' : 'text-green-600'}`}>
                                {isFull ? "Full" : `${availableSeats} left`}
                              </p>
                            </div>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>
              
              {/* General Program Info (Location, Duration) */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3 border mt-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-purple-600">Default Location</p>
                    <p className="text-foreground">{program.location || "Check session details"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-purple-600">Typical Duration</p>
                    <p className="text-foreground">{program.duration}</p>
                  </div>
                </div>
              </div>
              
              {/* Price and Booking Button */}
              <div className="bg-primary/5 rounded-xl p-5 border border-primary/20 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-primary">Adventure Price</p>
                    <p className="text-3xl font-bold text-primary">{program.price}</p>
                  </div>
                  <div className="text-5xl">🎒</div>
                </div>
                <Button
                  onClick={handleRegister}
                  className="w-full py-6 text-lg"
                  variant="default"
                  disabled={!user || !selectedSessionId || sessionsLoading || sessions.find(s=>s.id === selectedSessionId)?.is_cancelled || (sessions.find(s=>s.id === selectedSessionId) && ((sessions.find(s=>s.id === selectedSessionId)!.max_capacity || program.seats) - sessions.find(s=>s.id === selectedSessionId)!.current_capacity <=0))}
                >
                  {user ? (selectedSessionId ? "Join This Session!" : "Select a Session") : "Login to Register"}
                </Button>
                {!user && <p className="text-xs text-center mt-2 text-muted-foreground">You need to be logged in to register for programs.</p>}
                 {user && !selectedSessionId && sessions.length > 0 && <p className="text-xs text-center mt-2 text-muted-foreground">Please choose a session above.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-lg">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <DialogTitle className="text-2xl font-bold text-primary">Confirm Your Adventure</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-base">
              You're about to register for {program?.title || "this adventure"}. Review the details and proceed to secure payment via Stripe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Program and Session Details */}
            <div className="bg-muted/50 p-4 rounded-xl border">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-background p-2 rounded-full border">
                  {DialogProgramIconElement}
                </div>
                <h3 className="font-bold text-primary">{program?.title}</h3>
              </div>
              <div className="flex items-center gap-2 ml-12 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  Session: {selectedSessionId ? 
                    new Date(sessions.find(s => s.id === selectedSessionId)?.start_time || '').toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short'}) : 
                    'N/A'}
                </span>
              </div>
            </div>
            
            {/* Price Confirmation */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700 flex items-center justify-between">
              <div>
                <p className="font-medium text-yellow-700">Total Price</p>
                <p className="text-2xl font-bold text-yellow-600">{program?.price}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              className="rounded-full"
            >
              Go Back
            </Button>
            <Button
              onClick={handlePayment}
              className="rounded-full py-6 px-8" 
              variant="default"
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
        <DialogContent className="sm:max-w-[500px] rounded-lg">
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">Woohoo! You're All Set!</h2>
            <p className="text-muted-foreground text-lg">
              You've successfully joined the {program?.title || "adventure"}!
              We can't wait to see you there!
            </p>
            <div className="text-6xl my-4">🎉</div>
            <Button
              onClick={handleSuccessClose}
              className="rounded-full py-6 px-8 mt-4"
              variant="default"
            >
              See My Adventures
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

