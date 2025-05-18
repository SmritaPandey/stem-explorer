"use client"

import type React from "react"

import { useEffect, useState, useCallback, useTransition } from "react"
import Link from "next/link"
import { Filter, Search, Rocket, Code, Atom, Brain, Star, Calendar, Clock, MapPin, Users } from "lucide-react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { debounce } from "lodash"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ProgramCardSkeleton } from "@/components/program-card-skeleton"
import { type Program, getFilteredPrograms } from "@/lib/data"

export default function ProgramsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Get filter values from URL
  const search = searchParams.get("search") || ""
  const category = searchParams.get("category") || "all"
  const level = searchParams.get("level") || "all"
  const ageGroup = searchParams.get("ageGroup") || "all"
  const format = searchParams.get("format") || "all"

  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchValue, setSearchValue] = useState(search)

  // Create URL with updated search params
  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())

      // Update search params
      Object.entries(params).forEach(([name, value]) => {
        if (value === null || value === "" || value === "all") {
          newSearchParams.delete(name)
        } else {
          newSearchParams.set(name, value)
        }
      })

      return newSearchParams.toString()
    },
    [searchParams],
  )

  // Update URL when filters change
  const updateFilters = useCallback(
    (name: string, value: string) => {
      startTransition(() => {
        router.push(`${pathname}?${createQueryString({ [name]: value })}`)
      })
    },
    [pathname, router, createQueryString],
  )

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      updateFilters("search", value)
    }, 500),
    [updateFilters],
  )

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  // Fetch programs based on filters
  useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoading(true)
      try {
        const data = await getFilteredPrograms({
          search,
          category,
          level,
          ageGroup,
          format,
        })
        setPrograms(data)
      } catch (error) {
        console.error("Failed to fetch programs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
  }, [search, category, level, ageGroup, format])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">Programs</h1>
        <p className="text-black">Browse and register for STEM programs and workshops</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="search"
            placeholder="Search programs..."
            className="w-full border-[#D6EBFF] text-black"
            value={searchValue}
            onChange={handleSearchChange}
          />
          <Button type="submit" size="icon" className="bg-[#0078FF] text-white">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Select value={category} onValueChange={(value) => updateFilters("category", value)}>
            <SelectTrigger className="w-[180px] border-[#D6EBFF] text-black">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#D6EBFF]">
              <SelectItem value="all" className="text-black">All Categories</SelectItem>
              <SelectItem value="engineering" className="text-black">Engineering</SelectItem>
              <SelectItem value="computer-science" className="text-black">Computer Science</SelectItem>
              <SelectItem value="science" className="text-black">Science</SelectItem>
              <SelectItem value="mathematics" className="text-black">Mathematics</SelectItem>
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={(value) => updateFilters("level", value)}>
            <SelectTrigger className="w-[180px] border-[#D6EBFF] text-black">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#D6EBFF]">
              <SelectItem value="all" className="text-black">All Levels</SelectItem>
              <SelectItem value="beginner" className="text-black">Beginner</SelectItem>
              <SelectItem value="intermediate" className="text-black">Intermediate</SelectItem>
              <SelectItem value="advanced" className="text-black">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ageGroup} onValueChange={(value) => updateFilters("ageGroup", value)}>
            <SelectTrigger className="w-[180px] border-[#D6EBFF] text-black">
              <SelectValue placeholder="Age Group" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#D6EBFF]">
              <SelectItem value="all" className="text-black">All Ages</SelectItem>
              <SelectItem value="8-12" className="text-black">8-12 years</SelectItem>
              <SelectItem value="10-14" className="text-black">10-14 years</SelectItem>
              <SelectItem value="12-16" className="text-black">12-16 years</SelectItem>
              <SelectItem value="14-18" className="text-black">14-18 years</SelectItem>
            </SelectContent>
          </Select>
          <Select value={format} onValueChange={(value) => updateFilters("format", value)}>
            <SelectTrigger className="w-[180px] border-[#D6EBFF] text-black">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#D6EBFF]">
              <SelectItem value="all" className="text-black">All Formats</SelectItem>
              <SelectItem value="in-person" className="text-black">In-person</SelectItem>
              <SelectItem value="virtual" className="text-black">Virtual</SelectItem>
              <SelectItem value="hybrid" className="text-black">Hybrid</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="btn-outline"
            size="icon"
            onClick={() => {
              // Reset all filters
              router.push(pathname)
              setSearchValue("")
            }}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Reset Filters</span>
          </Button>
        </div>
      </div>

      <Separator />

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <ProgramCardSkeleton key={index} />
            ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-lg font-semibold text-black">No programs found</h3>
          <p className="text-black mt-2">Try adjusting your filters or search terms</p>
          <Button
            className="btn-outline mt-4"
            onClick={() => {
              router.push(pathname)
              setSearchValue("")
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => {
            // Get category-specific elements
            let categoryColor = "";
            let categoryIcon = null;
            let categoryEmoji = "";

            switch(program.category) {
              case "Engineering":
              case "engineering":
                categoryColor = "bg-[#0078FF]";
                categoryIcon = <Rocket className="h-10 w-10 text-white wiggling" />;
                categoryEmoji = "🤖";
                break;
              case "Computer Science":
              case "computer-science":
                categoryColor = "bg-[#00B300]";
                categoryIcon = <Code className="h-10 w-10 text-white wiggling" />;
                categoryEmoji = "💻";
                break;
              case "Science":
              case "science":
                categoryColor = "bg-[#7B00FF]";
                categoryIcon = <Atom className="h-10 w-10 text-white wiggling" />;
                categoryEmoji = "🔬";
                break;
              case "Mathematics":
              case "mathematics":
                categoryColor = "bg-[#FFC800]";
                categoryIcon = <Brain className="h-10 w-10 text-white wiggling" />;
                categoryEmoji = "🧮";
                break;
              default:
                categoryColor = "bg-[#0078FF]";
                categoryIcon = <Rocket className="h-10 w-10 text-white wiggling" />;
                categoryEmoji = "🚀";
            }

            // Get difficulty stars
            let difficultyStars = null;
            switch(program.level) {
              case "Beginner":
              case "beginner":
                difficultyStars = <div className="flex"><Star className="h-4 w-4 text-[#00B300]" /></div>;
                break;
              case "Intermediate":
              case "intermediate":
                difficultyStars = <div className="flex"><Star className="h-4 w-4 text-[#0078FF]" /><Star className="h-4 w-4 text-[#0078FF]" /></div>;
                break;
              case "Advanced":
              case "advanced":
                difficultyStars = <div className="flex"><Star className="h-4 w-4 text-[#7B00FF]" /><Star className="h-4 w-4 text-[#7B00FF]" /><Star className="h-4 w-4 text-[#7B00FF]" /></div>;
                break;
              default:
                difficultyStars = <div className="flex"><Star className="h-4 w-4 text-[#00B300]" /></div>;
            }

            return (
              <Card key={program.id} className="program-card overflow-hidden">
                <div className={`${categoryColor} p-6 flex justify-between items-center`}>
                  <div className="bg-white/20 p-3 rounded-full">
                    {categoryIcon}
                  </div>
                  <div className="badge">
                    Ages {program.ageGroup || "8-12"}
                  </div>
                </div>
                <div className="card-content">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-black">{program.title}</h3>
                    <div className="text-2xl">{categoryEmoji}</div>
                  </div>
                  <p className="text-black mb-4">{program.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-[#555555]">Date</p>
                      <p className="font-medium text-black">{program.date}</p>
                    </div>
                    <div>
                      <p className="text-[#555555]">Time</p>
                      <p className="font-medium text-black">{program.time}</p>
                    </div>
                    <div>
                      <p className="text-[#555555]">Duration</p>
                      <p className="font-medium text-black">{program.duration}</p>
                    </div>
                    <div>
                      <p className="text-[#555555]">Seats</p>
                      <p className="font-medium text-black">{program.seats} available</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-black text-sm">Difficulty:</span>
                      {difficultyStars}
                    </div>
                    <div className="text-lg font-bold text-black">
                      {program.price}
                    </div>
                  </div>
                </div>
              </div>
              <CardFooter>
                <Button className="btn-primary w-full" asChild>
                  <Link href={`/dashboard/programs/${program.id}`}>Register Now</Link>
                </Button>
              </CardFooter>
            </Card>
          )})}
        </div>
      )}
    </div>
  )
}

