import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"

const programClasses = [
  "Science",
  "Technology",
  "Engineering",
  "Mathematics",
  "Robotics",
  "Coding",
  "Physics",
  "Chemistry",
  "Biology"
]

export function ProgramFilter({ onFilterChange }: { onFilterChange: (filters: string[]) => void }) {
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([])

  const handleFilterChange = (value: string) => {
    const newFilters = selectedFilters.includes(value)
      ? selectedFilters.filter(item => item !== value)
      : [...selectedFilters, value]
    
    setSelectedFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex gap-2">
          <Filter className="h-4 w-4" />
          Filter Programs
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Program Categories</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {programClasses.map((category) => (
          <DropdownMenuCheckboxItem
            key={category}
            checked={selectedFilters.includes(category)}
            onCheckedChange={() => handleFilterChange(category)}
          >
            {category}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
