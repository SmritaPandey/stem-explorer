"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Phone, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 234 567 890",
    avatar: "/placeholder.svg"
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setProfile(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // TODO: Implement photo upload logic
      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated successfully."
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // TODO: Implement API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-[2.5rem] font-bold text-black">Profile</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="stem-card bg-white border-2 border-[#D6EBFF] rounded-[0.625rem] p-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black text-[2rem] font-bold">Personal Information</CardTitle>
            <CardDescription className="text-black">Update your personal details here</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20 border-2 border-[#D6EBFF]">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-[#0078FF] text-white">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    id="photo"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <Button type="button" variant="outline" onClick={() => document.getElementById('photo')?.click()}>
                    Change Photo
                  </Button>
                </div>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-black">Full Name</Label>
                  <div className="flex">
                    <User className="w-4 h-4 mt-3 -mr-8 z-10 text-[#0078FF]" />
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={handleInputChange}
                      className="pl-10 border-[#D6EBFF] text-black bg-white"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-black">Email</Label>
                  <div className="flex">
                    <Mail className="w-4 h-4 mt-3 -mr-8 z-10 text-[#0078FF]" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={handleInputChange}
                      className="pl-10 border-[#D6EBFF] text-black bg-white"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="text-black">Phone</Label>
                  <div className="flex">
                    <Phone className="w-4 h-4 mt-3 -mr-8 z-10 text-[#0078FF]" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={handleInputChange}
                      className="pl-10 border-[#D6EBFF] text-black bg-white"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} variant="default">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
