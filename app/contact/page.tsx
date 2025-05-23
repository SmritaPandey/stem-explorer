"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Atom, Mail, MapPin, Phone, Send, Sparkles, Lightbulb, Rocket, BookOpen, Puzzle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export default function ContactPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      })

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 w-full border-b border-[#D6EBFF] bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative">
                <Atom className="h-7 w-7 text-[#0078FF] wiggling" />
                <Sparkles className="h-4 w-4 text-[#FFC800] absolute -top-1 -right-1" />
              </div>
              <span className="text-black">STEM Explorer</span>
            </Link>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="nav-link">
              <Atom className="h-5 w-5 text-[#0078FF] mr-2" />
              Home
            </Link>
            <Link href="/#features" className="nav-link">
              <Lightbulb className="h-5 w-5 text-[#FFC800] mr-2" />
              Features
            </Link>
            <Link href="/#programs" className="nav-link">
              <Rocket className="h-5 w-5 text-[#7B00FF] mr-2" />
              Programs
            </Link>
            <Link href="/#about" className="nav-link">
              <BookOpen className="h-5 w-5 text-[#00B300] mr-2" />
              About
            </Link>
            <Link href="/contact" className="nav-link active">
              <Mail className="h-5 w-5 text-[#0078FF] mr-2" />
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button className="btn-outline">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button className="btn-primary">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl md:text-5xl">
              Contact Us
            </h1>
            <p className="mt-4 text-lg text-black max-w-2xl mx-auto">
              Have questions about our STEM programs? We're here to help! Fill out the form below and our team will get back to you as soon as possible.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2">
            <div className="stem-card">
              <h2 className="text-2xl font-bold text-black mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="form-label">
                    Your Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="border-[#D6EBFF] text-black"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                    className="border-[#D6EBFF] text-black"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="subject" className="form-label">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Program Inquiry"
                    required
                    className="border-[#D6EBFF] text-black"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="form-label">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your message here..."
                    rows={5}
                    required
                    className="border-[#D6EBFF] text-black"
                  />
                </div>
                <Button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>

            <div className="stem-card">
              <h2 className="text-2xl font-bold text-black mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-[#0078FF]/20 p-3">
                    <MapPin className="h-6 w-6 text-[#0078FF]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-black">Our Location</h3>
                    <p className="text-black mt-1">
                      123 STEM Way<br />
                      Innovation District<br />
                      San Francisco, CA 94103
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-[#00B300]/20 p-3">
                    <Mail className="h-6 w-6 text-[#00B300]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-black">Email Us</h3>
                    <p className="text-black mt-1">
                      info@stemexplorer.com<br />
                      support@stemexplorer.com
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-[#7B00FF]/20 p-3">
                    <Phone className="h-6 w-6 text-[#7B00FF]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-black">Call Us</h3>
                    <p className="text-black mt-1">
                      +1 (555) 123-4567<br />
                      Mon-Fri, 9am-5pm PST
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-[#D6EBFF]">
                  <h3 className="font-medium text-black mb-3">Follow Us</h3>
                  <div className="flex gap-4">
                    <a href="#" className="bg-[#F0F8FF] p-2 rounded-full hover:bg-[#D6EBFF] transition-colors">
                      <svg className="h-5 w-5 text-[#0078FF]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a href="#" className="bg-[#F0F8FF] p-2 rounded-full hover:bg-[#D6EBFF] transition-colors">
                      <svg className="h-5 w-5 text-[#0078FF]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </a>
                    <a href="#" className="bg-[#F0F8FF] p-2 rounded-full hover:bg-[#D6EBFF] transition-colors">
                      <svg className="h-5 w-5 text-[#0078FF]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-[#D6EBFF] py-8 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Atom className="h-7 w-7 text-[#0078FF] wiggling" />
                <Sparkles className="h-4 w-4 text-[#FFC800] absolute -top-1 -right-1" />
              </div>
              <span className="font-bold text-xl text-black">STEM Explorer</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-center md:justify-end md:gap-8">
              <Link href="#" className="nav-link">
                <BookOpen className="h-5 w-5 text-[#00B300] mr-2" />
                Parent Guide
              </Link>
              <Link href="#" className="nav-link">
                <Puzzle className="h-5 w-5 text-[#0078FF] mr-2" />
                Fun Activities
              </Link>
              <Link href="/contact" className="nav-link active">
                <Lightbulb className="h-5 w-5 text-[#FFC800] mr-2" />
                Contact Us
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <p className="text-center text-black md:text-left">
              © {new Date().getFullYear()} STEM Explorer. Making learning fun for kids everywhere! 🌟
            </p>
            <div className="flex gap-4">
              <div className="bg-[#F0F8FF] p-2 rounded-full border border-[#D6EBFF]">
                <div className="text-2xl">🔍</div>
              </div>
              <div className="bg-[#F0F8FF] p-2 rounded-full border border-[#D6EBFF]">
                <div className="text-2xl">🧪</div>
              </div>
              <div className="bg-[#F0F8FF] p-2 rounded-full border border-[#D6EBFF]">
                <div className="text-2xl">🧩</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
