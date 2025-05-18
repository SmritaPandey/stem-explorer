import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Atom, BookOpen, Code, Rocket, Brain, Microscope, Beaker, Lightbulb, Sparkles, Puzzle, Clock } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-[#D6EBFF] bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="relative">
              <Atom className="h-7 w-7 text-[#0078FF] wiggling" />
              <Sparkles className="h-4 w-4 text-[#FFC800] absolute -top-1 -right-1" />
            </div>
            <span className="text-black">STEM Explorer</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="nav-link">
              <Lightbulb className="h-5 w-5 text-[#FFC800] mr-2" />
              Features
            </Link>
            <Link href="#programs" className="nav-link">
              <Rocket className="h-5 w-5 text-[#7B00FF] mr-2" />
              Programs
            </Link>
            <Link href="#about" className="nav-link">
              <BookOpen className="h-5 w-5 text-[#00B300] mr-2" />
              About
            </Link>
            <Link href="/contact" className="nav-link">
              <Atom className="h-5 w-5 text-[#0078FF] mr-2" />
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button className="btn-outline">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="btn-primary">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-6">
                <div className="speech-bubble mb-4 max-w-xs">
                  <p className="text-lg font-medium text-black">Hi there, young explorer! Ready for an adventure?</p>
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-black">
                    Discover the Amazing World of STEM!
                  </h1>
                  <p className="max-w-[600px] text-black text-xl">
                    Join us on an exciting journey through Science, Technology, Engineering, and Mathematics!
                    <span className="block mt-2">🚀 Build robots! 💻 Code games! 🔬 Conduct experiments!</span>
                  </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button className="btn-fun">
                      Start Your Adventure
                      <Rocket className="ml-2 h-5 w-5 wiggling" />
                    </Button>
                  </Link>
                  <Link href="#programs">
                    <Button className="btn-outline">
                      See Cool Programs
                      <Sparkles className="ml-2 h-5 w-5 text-[#FFC800]" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[400px] w-[400px] md:h-[500px] md:w-[500px]">
                  {/* Background circle with gradient */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] md:h-[400px] md:w-[400px] bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-green-400/30 rounded-full"></div>

                  {/* Floating icons with animations */}
                  <div className="absolute top-0 left-1/4 bg-blue-500 p-5 rounded-2xl shadow-lg floating">
                    <Code className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute bottom-1/4 right-0 bg-green-500 p-5 rounded-2xl shadow-lg floating" style={{ animationDelay: "1s" }}>
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-1/3 bg-purple-500 p-5 rounded-2xl shadow-lg floating" style={{ animationDelay: "1.5s" }}>
                    <Rocket className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute top-1/3 right-1/4 bg-orange-500 p-5 rounded-2xl shadow-lg floating" style={{ animationDelay: "0.5s" }}>
                    <Atom className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute top-1/2 left-0 bg-red-500 p-5 rounded-2xl shadow-lg floating" style={{ animationDelay: "2s" }}>
                    <Beaker className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute top-1/4 right-0 bg-yellow-500 p-5 rounded-2xl shadow-lg floating" style={{ animationDelay: "2.5s" }}>
                    <Brain className="h-10 w-10 text-white" />
                  </div>

                  {/* Central character */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] bouncing">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <div className="text-5xl">👩‍🔬</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-[#F0F8FF]">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-black">Platform Features</h2>
                <p className="max-w-[900px] text-black md:text-xl">
                  Everything you need to explore and engage with STEM education
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="stem-card flex flex-col items-center space-y-4">
                <div className="rounded-full bg-[#0078FF]/20 p-4">
                  <BookOpen className="h-8 w-8 text-[#0078FF]" />
                </div>
                <h3 className="text-xl font-bold text-black">Educational Programs</h3>
                <p className="text-center text-black">
                  Access a wide range of STEM programs and workshops designed for young engineers.
                </p>
              </div>
              <div className="stem-card flex flex-col items-center space-y-4">
                <div className="rounded-full bg-[#00B300]/20 p-4">
                  <Code className="h-8 w-8 text-[#00B300]" />
                </div>
                <h3 className="text-xl font-bold text-black">Personalized Dashboard</h3>
                <p className="text-center text-black">
                  Track your progress and manage your educational journey with a customized dashboard.
                </p>
              </div>
              <div className="stem-card flex flex-col items-center space-y-4">
                <div className="rounded-full bg-[#7B00FF]/20 p-4">
                  <Rocket className="h-8 w-8 text-[#7B00FF]" />
                </div>
                <h3 className="text-xl font-bold text-black">Booking System</h3>
                <p className="text-center text-black">
                  Easily register for programs and workshops with our intuitive booking system.
                </p>
              </div>
            </div>

            <div className="alert mx-auto max-w-5xl mt-8">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-[#FFC800]/20 p-3 flex-shrink-0">
                  <Lightbulb className="h-6 w-6 text-[#FFC800]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">What is STEM?</h3>
                  <p className="text-black">STEM stands for Science, Technology, Engineering, and Mathematics. These interconnected disciplines form the foundation for innovation and problem-solving in our modern world.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="programs" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-black">Featured Programs</h2>
                <p className="max-w-[900px] text-black md:text-xl">
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
                  color: "bg-[#0078FF]",
                  badge: "Ages 8-12"
                },
                {
                  title: "Coding Bootcamp",
                  description: "Master programming fundamentals through interactive projects.",
                  icon: <Code className="h-10 w-10 text-white" />,
                  color: "bg-[#00B300]",
                  badge: "Ages 7-10"
                },
                {
                  title: "Science Exploration",
                  description: "Discover scientific principles through experiments and research.",
                  icon: <Atom className="h-10 w-10 text-white" />,
                  color: "bg-[#7B00FF]",
                  badge: "Ages 6-11"
                },
              ].map((program, index) => (
                <div key={index} className="program-card group relative overflow-hidden">
                  <div className={`${program.color} p-6 flex justify-between items-center`}>
                    <div className="bg-white/20 p-3 rounded-full">{program.icon}</div>
                    <div className="badge">{program.badge}</div>
                  </div>
                  <div className="card-content">
                    <h3 className="text-xl font-bold text-black">{program.title}</h3>
                    <p className="text-black mt-2">{program.description}</p>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-[#555555]" />
                        <span className="text-[#555555] text-sm">8 weeks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-[#FFC800]" />
                        <Sparkles className="h-3 w-3 text-[#FFC800]" />
                      </div>
                    </div>
                    <Link href="/login">
                      <Button className="btn-primary mt-4 w-full">Register Now</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/login">
                <Button className="btn-outline">
                  View All Programs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-[#F0F8FF]">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center space-y-6">
                <div className="badge badge-primary self-start">
                  Who We Are
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl text-black">
                    About STEM Explorer
                  </h2>
                  <div className="space-y-4">
                    <p className="text-black text-xl">
                      <span className="font-bold">STEM Explorer</span> is a magical place where curious kids can discover the wonders of science, technology, engineering, and math! 🌈
                    </p>
                    <p className="text-black text-xl">
                      We believe learning should be <span className="font-bold text-[#7B00FF]">FUN</span> and <span className="font-bold text-[#00B300]">EXCITING</span>! Our programs are designed to spark imagination and creativity while building important skills. 💡
                    </p>
                    <div className="alert alert-success mt-6">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-6 w-6 text-[#FFC800]" />
                        <p className="font-bold text-lg text-black">Join over 5,000 happy explorers on their STEM journey!</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Link href="/register">
                    <Button className="btn-fun">
                      Become an Explorer!
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full h-[400px]">
                  {/* Decorative elements */}
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="relative w-full h-full">
                      {/* Image grid with fun illustrations */}
                      <div className="grid grid-cols-2 gap-6 h-full">
                        <div className="stem-card bg-[#F0F8FF] flex items-center justify-center overflow-hidden">
                          <div className="text-8xl bouncing">👨‍🔬</div>
                        </div>
                        <div className="stem-card bg-[#F0FFF0] flex items-center justify-center overflow-hidden">
                          <div className="text-8xl floating" style={{ animationDelay: "1s" }}>👩‍💻</div>
                        </div>
                        <div className="stem-card bg-[#F8F0FF] flex items-center justify-center overflow-hidden">
                          <div className="text-8xl floating" style={{ animationDelay: "1.5s" }}>🚀</div>
                        </div>
                        <div className="stem-card bg-[#FFFCF0] flex items-center justify-center overflow-hidden">
                          <div className="text-8xl bouncing" style={{ animationDelay: "0.5s" }}>🔭</div>
                        </div>
                      </div>

                      {/* Decorative elements */}
                      <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#D6EBFF] rounded-full"></div>
                      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#D6FFD6] rounded-full"></div>
                      <div className="absolute top-1/2 -right-6 w-12 h-12 bg-[#FFEDB3] rounded-full"></div>
                      <div className="absolute bottom-1/2 -left-6 w-12 h-12 bg-[#E6D6FF] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
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
              <Link href="/contact" className="nav-link">
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

