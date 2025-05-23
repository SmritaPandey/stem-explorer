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
// Updated import to use getPrograms
import { type Program, getPrograms } from "@/lib/data" 
import type { LucideIcon } from "lucide-react"

// Helper function to map icon string to Lucide component
const IconMap: Record<string, LucideIcon> = {
  Rocket: Rocket,
  Code: Code,
  Atom: Atom,
  Brain: Brain,
  // Add other icons as needed
};

const getIconComponent = (iconName?: string | null): React.ReactElement => {
  const IconComponent = iconName ? IconMap[iconName] : null;
  if (IconComponent) {
    // Common props for icons, adjust as needed
    return <IconComponent className="h-10 w-10 text-[#0078FF] group-hover:text-[#005fcc] transition-colors" />;
  }
  // Return a default icon or null if no match
  return <Star className="h-10 w-10 text-gray-400" />; // Default fallback icon
};

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
        // Use the new getPrograms function
        const data = await getPrograms({ 
          search,
          category,
          level,
          ageGroup, // Ensure your getPrograms handles mapping this to age_group if needed
          format,
        })
        setPrograms(data)
      } catch (error) {
        console.error("Failed to fetch programs:", error)
        setPrograms([]) // Set to empty array on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
  }, [search, category, level, ageGroup, format])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[2.5rem] font-bold text-foreground">Programs</h1>
        <p className="text-foreground">Browse and register for STEM programs and workshops</p>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="search"
            placeholder="Search programs..."
            className="w-full" // Rely on global input styling
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
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Computer Science">Computer Science</SelectItem>
              <SelectItem value="Science">Science</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={(value) => updateFilters("level", value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ageGroup} onValueChange={(value) => updateFilters("ageGroup", value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Age Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="8-12">8-12 years</SelectItem>
              <SelectItem value="10-14">10-14 years</SelectItem>
              <SelectItem value="12-16">12-16 years</SelectItem>
              <SelectItem value="14-18">14-18 years</SelectItem>
            </SelectContent>
          </Select>
          <Select value={format} onValueChange={(value) => updateFilters("format", value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="In-person">In-person</SelectItem>
              <SelectItem value="Virtual">Virtual</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
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
      <Separator /> 
      {isLoading || isPending ? ( // Show skeleton when loading or transitioning
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <ProgramCardSkeleton key={index} />
            ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-[1.5rem] font-bold text-foreground">No programs found</h3>
          <p className="text-foreground mt-2">Try adjusting your filters or search terms</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              router.push(pathname) // Reset to base URL without params
              setSearchValue("")    // Clear local search input state
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => {
            const programIconElement = getIconComponent(program.icon);
            
            // Determine category specific emoji (optional, can be removed if icon is primary)
            let categoryEmoji = "🚀"; // Default emoji
            switch(program.category) {
              case "Engineering": categoryEmoji = "🤖"; break;
              case "Computer Science": categoryEmoji = "💻"; break;
              case "Science": categoryEmoji = "🔬"; break;
              case "Mathematics": categoryEmoji = "🧮"; break;
            }

            // Difficulty stars
            let difficultyStars = null;
            switch(program.level) {
              case "Beginner":
                difficultyStars = <div className="flex"><Star className="h-4 w-4 text-green-500 fill-green-500" /></div>;
                break;
              case "Intermediate":
                difficultyStars = <div className="flex"><Star className="h-4 w-4 text-blue-500 fill-blue-500" /><Star className="h-4 w-4 text-blue-500 fill-blue-500" /></div>;
                break;
              case "Advanced":
                difficultyStars = <div className="flex"><Star className="h-4 w-4 text-purple-500 fill-purple-500" /><Star className="h-4 w-4 text-purple-500 fill-purple-500" /><Star className="h-4 w-4 text-purple-500 fill-purple-500" /></div>;
                break;
              default:
                difficultyStars = <div className="flex"><Star className="h-4 w-4 text-gray-400 fill-gray-400" /></div>;
            }
            return (
              <Card key={program.id} className="group flex flex-col">
                <CardHeader className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="rounded-full bg-muted border p-3 flex items-center justify-center group-hover:border-primary transition-colors">
                      {programIconElement}
                    </div>
                    <span className="text-2xl">{categoryEmoji}</span>
                    <Badge variant="outline" className="ml-auto">Ages {program.age_group || "N/A"}</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold">{program.title}</CardTitle>
                  <CardDescription className="text-lg font-semibold text-primary">{program.price}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <p className="text-sm mb-4 line-clamp-3">{program.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{new Date(program.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{program.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>{program.seats} spots</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Level:</span>
                    {difficultyStars}
                  </div>
                </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button variant="default" className="w-full" asChild>
                    <Link href={`/dashboard/programs/${program.id}`}>View Details</Link>
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

