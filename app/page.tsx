import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Atom, BookOpen, Code, Rocket } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Atom className="h-6 w-6 text-primary" />
            <span>STEM Explorer</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#programs" className="text-muted-foreground hover:text-foreground transition-colors">
              Programs
            </Link>
            <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Discover the World of STEM
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    An educational platform designed for young aspiring engineers to explore, learn, and grow in
                    Science, Technology, Engineering, and Mathematics.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="gap-1.5">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#programs">
                    <Button size="lg" variant="outline">
                      Explore Programs
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-[350px] md:h-[450px] md:w-[450px]">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[250px] w-[250px] md:h-[350px] md:w-[350px] bg-primary/20 rounded-full animate-pulse"></div>
                  <div className="absolute top-0 left-1/4 bg-blue-500/90 p-4 rounded-xl shadow-lg">
                    <Code className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute bottom-1/4 right-0 bg-green-500/90 p-4 rounded-xl shadow-lg">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-1/3 bg-purple-500/90 p-4 rounded-xl shadow-lg">
                    <Rocket className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute top-1/3 right-1/4 bg-orange-500/90 p-4 rounded-xl shadow-lg">
                    <Atom className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Platform Features</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to explore and engage with STEM education
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/20 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Educational Programs</h3>
                <p className="text-center text-muted-foreground">
                  Access a wide range of STEM programs and workshops designed for young engineers.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/20 p-3">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Personalized Dashboard</h3>
                <p className="text-center text-muted-foreground">
                  Track your progress and manage your educational journey with a customized dashboard.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/20 p-3">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Booking System</h3>
                <p className="text-center text-muted-foreground">
                  Easily register for programs and workshops with our intuitive booking system.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="programs" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Featured Programs</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Explore our most popular STEM programs for young aspiring engineers
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Robotics Workshop",
                  description: "Learn to build and program robots with hands-on activities.",
                  icon: <Rocket className="h-10 w-10 text-white" />,
                  color: "bg-blue-500",
                },
                {
                  title: "Coding Bootcamp",
                  description: "Master programming fundamentals through interactive projects.",
                  icon: <Code className="h-10 w-10 text-white" />,
                  color: "bg-green-500",
                },
                {
                  title: "Science Exploration",
                  description: "Discover scientific principles through experiments and research.",
                  icon: <Atom className="h-10 w-10 text-white" />,
                  color: "bg-purple-500",
                },
              ].map((program, index) => (
                <div key={index} className="group relative overflow-hidden rounded-lg border">
                  <div className={`${program.color} p-6 flex justify-center`}>{program.icon}</div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold">{program.title}</h3>
                    <p className="text-muted-foreground mt-2">{program.description}</p>
                    <Link href="/login">
                      <Button className="mt-4 w-full">Register Now</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">About STEM Explorer</h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    STEM Explorer is dedicated to inspiring the next generation of engineers and scientists through
                    engaging educational programs and workshops.
                  </p>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Our platform provides a comprehensive learning experience, connecting young minds with the resources
                    they need to excel in Science, Technology, Engineering, and Mathematics.
                  </p>
                </div>
                <div>
                  <Link href="/register">
                    <Button size="lg">Join Our Community</Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-40 rounded-lg bg-blue-500/20"></div>
                  <div className="h-40 rounded-lg bg-green-500/20"></div>
                  <div className="h-40 rounded-lg bg-purple-500/20"></div>
                  <div className="h-40 rounded-lg bg-orange-500/20"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex items-center gap-2 font-bold">
            <Atom className="h-5 w-5 text-primary" />
            <span>STEM Explorer</span>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} STEM Explorer. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

