import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Share2, Info, BookOpen, Calendar, Star } from "lucide-react"

interface ProgramCardProps {
  title: string
  description: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  onViewDetails: () => void
  onShare: () => void
  onBookmark: () => void
  onReschedule?: () => void
}

export function ProgramCard({ 
  title, 
  description, 
  status,
  onViewDetails,
  onShare,
  onBookmark,
  onReschedule 
}: ProgramCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewDetails}>
              <Info className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Program
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBookmark}>
              <Star className="mr-2 h-4 w-4" />
              Add to Wishlist
            </DropdownMenuItem>
            {status === 'cancelled' && onReschedule && (
              <DropdownMenuItem onClick={onReschedule}>
                <Calendar className="mr-2 h-4 w-4" />
                Find Similar Programs
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-2">
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
            ${status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 
              status === 'ongoing' ? 'bg-green-100 text-green-700' : 
              status === 'completed' ? 'bg-gray-100 text-gray-700' : 
              'bg-red-100 text-red-700'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onViewDetails}>
          <BookOpen className="mr-2 h-4 w-4" />
          View Program Details
        </Button>
      </CardFooter>
    </Card>
  )
}
