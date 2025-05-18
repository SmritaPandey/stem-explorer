"use client"

import type React from "react"

import { useEffect, useState, useCallback, useTransition } from "react"
import Link from "next/link"
import { Filter, Search } from "lucide-react"
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
        <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
        <p className="text-muted-foreground">Browse and register for STEM programs and workshops</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="search"
            placeholder="Search programs..."
            className="w-full"
            value={searchValue}
            onChange={handleSearchChange}
          />
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Select value={category} onValueChange={(value) => updateFilters("category", value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="computer-science">Computer Science</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={(value) => updateFilters("level", value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ageGroup} onValueChange={(value) => updateFilters("ageGroup", value)}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="in-person">In-person</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
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
          <h3 className="text-lg font-semibold">No programs found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your filters or search terms</p>
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Card key={program.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2">
                    <program.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{program.title}</CardTitle>
                </div>
                <CardDescription>{program.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{program.category}</Badge>
                    <Badge variant="outline">{program.level}</Badge>
                    {program.format && (
                      <Badge variant="outline" className="bg-primary/5">
                        {program.format}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{program.date}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time</p>
                      <p className="font-medium">{program.time}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{program.duration}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Seats</p>
                      <p className="font-medium">{program.seats} available</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{program.price}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href={`/dashboard/programs/${program.id}`}>Register Now</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

