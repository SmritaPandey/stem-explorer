"use client"

import type React from "react"

import { useEffect, useState, useCallback, useTransition } from "react"
import Link from "next/link"
import { Filter, Search, Star, Calendar, Clock, Users } from "lucide-react" // Removed Rocket, Code, Atom, Brain, MapPin
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
    <div className="space-y-8">
      <div>
        <h1 className="text-[2.5rem] font-bold text-black">Programs</h1>
        <p className="text-black">Browse and register for STEM programs and workshops</p>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="search"
            placeholder="Search programs..."
            className="w-full border-[#D6EBFF] text-black bg-white placeholder:text-[#888] focus-visible:ring-[#0078FF]"
            value={searchValue}
            onChange={handleSearchChange}
          />
          <Button type="submit" size="icon" variant="default">
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
            variant="outline"
            size="icon"
            onClick={() => {
              router.push(pathname)
              setSearchValue("")
            }}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Reset Filters</span>
          </Button>
        </div>
      </div>
      <Separator className="bg-[#D6EBFF]" />
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
          <h3 className="text-[1.5rem] font-bold text-black">No programs found</h3>
          <p className="text-black mt-2">Try adjusting your filters or search terms</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              router.push(pathname)
              setSearchValue("")
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => {
            // Get category-specific elements
            // Get category-specific emoji (optional, as icon is now dynamic)
            let categoryEmoji = "🚀" // Default emoji
            if (program.category) {
              const catLower = program.category.toLowerCase()
              if (catLower.includes("engineering")) categoryEmoji = "🤖"
              else if (catLower.includes("computer science") || catLower.includes("coding")) categoryEmoji = "💻"
              else if (catLower.includes("science")) categoryEmoji = "🔬"
              else if (catLower.includes("mathematics")) categoryEmoji = "🧮"
            }

            // Difficulty stars based on program.level (which is "N/A" from getFilteredPrograms)
            let difficultyStars = null
            // The program.level is "N/A" as per lib/data.ts for getFilteredPrograms
            // So, we won't render stars unless we change that.
            // For now, let's reflect "N/A" or hide this section.
            if (program.level && program.level.toLowerCase() !== "n/a") {
              switch (program.level.toLowerCase()) {
                case "beginner":
                  difficultyStars = <div className="flex"><Star className="h-4 w-4 text-[#00B300]" /></div>
                  break
                case "intermediate":
                  difficultyStars = <div className="flex"><Star className="h-4 w-4 text-[#0078FF]" /><Star className="h-4 w-4 text-[#0078FF]" /></div>
                  break
                case "advanced":
                  difficultyStars = <div className="flex"><Star className="h-4 w-4 text-[#7B00FF]" /><Star className="h-4 w-4 text-[#7B00FF]" /><Star className="h-4 w-4 text-[#7B00FF]" /></div>
                  break
                default:
                  difficultyStars = <span className="text-sm text-gray-500">Not Rated</span>
              }
            } else {
              difficultyStars = <span className="text-sm text-gray-500">Level: N/A</span>
            }

            const ProgramIcon = program.icon // program.icon is already a LucideIcon component

            return (
              <Card key={program.id} className="stem-card bg-white border-2 border-[#D6EBFF] rounded-[0.625rem] p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-full bg-white border-2 border-[#D6EBFF] p-3 flex items-center justify-center">
                    {ProgramIcon && <ProgramIcon className="h-10 w-10 text-[#0078FF] wiggling" />}
                  </div>
                  <span className="text-2xl">{categoryEmoji}</span>
                  <Badge className="bg-[#F0F8FF] text-black border border-[#D6EBFF] ml-auto">
                    Ages {program.ageGroup || "N/A"}
                  </Badge>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[1.5rem] font-bold text-black">{program.title}</h3>
                  <span className="text-lg font-bold text-black">{program.price}</span>
                </div>
                <p className="text-black mb-4 h-20 overflow-hidden text-ellipsis">{program.description}</p> {/* Added height and overflow */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4"> {/* Adjusted gap for better wrapping */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#0078FF]" />
                    <span className="text-black">{program.date}</span> {/* Will display "TBD" */}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#0078FF]" />
                    <span className="text-black">{program.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#0078FF]" />
                    <span className="text-black">{program.seats} spots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Difficulty stars or N/A text is now handled by difficultyStars variable */}
                    {difficultyStars}
                  </div>
                </div>
                <CardFooter className="p-0 pt-2">
                  <Button className="bg-[#0078FF] text-white rounded-[0.625rem] w-full hover:bg-[#005fcc] shadow-sm hover:shadow-md transition-all btn-primary" asChild>
                    <Link href={`/dashboard/programs/${program.id}`}>Register Now</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

