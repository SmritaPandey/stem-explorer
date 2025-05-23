"use client"

import { useState, useEffect } from "react" // Added useEffect
import api from "@/lib/api" // Import the API client
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Phone, User, Loader2 } from "lucide-react" // Added Loader2
import { useToast } from "@/components/ui/use-toast"

// Adjusted UserProfile interface to match API response and form fields
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  profilePicture: string | null; // Changed from avatar
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profilePicture: "/placeholder.svg" // Default placeholder
  })

  useEffect(() => {
    const fetchProfile = async () => {
      setIsFetching(true);
      try {
        const response = await api.get('/api/users/profile');
        const data = response.data;
        setProfile({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          profilePicture: data.profilePicture || "/placeholder.svg",
        });
      } catch (error) {
        console.error("Failed to fetch profile", error);
        toast({
          title: "Error fetching profile",
          description: "Could not load your profile data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    // Handle potential combined name field if needed, or ensure separate firstName/lastName inputs
    if (id === "name") { // Assuming 'name' input field for simplicity, split into first/last
        const parts = value.split(" ");
        setProfile(prev => ({
            ...prev,
            firstName: parts[0] || "",
            lastName: parts.slice(1).join(" ") || ""
        }));
    } else {
        setProfile(prev => ({
            ...prev,
            [id]: value
        }));
    }
  }
  
  // Specific handler for firstName
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({ ...prev, firstName: e.target.value }));
  }

  // Specific handler for lastName
  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({ ...prev, lastName: e.target.value }));
  }


  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // TODO: Implement actual photo upload logic (e.g., to Supabase Storage)
      // For now, just update the local preview if desired
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Photo selected",
        description: "Photo ready for upload. Save changes to update your profile picture."
        // Note: Actual upload should happen in handleSubmit
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Prepare data for API, ensure it matches what the API expects
      const profileDataToUpdate = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        // profilePicture: profile.profilePicture, // Only send if it's a new URL after upload
      };
      // If profilePicture has changed and is a data URL (local preview),
      // it means a new file was selected. Handle upload here or get a URL from an upload service.
      // For this example, we'll assume profilePicture URL is already updated if changed.
      // In a real app: if (newImageFile) { uploadedUrl = await uploadService(newImageFile); profileDataToUpdate.profilePicture = uploadedUrl; }


      const response = await api.put('/api/users/profile', profileDataToUpdate);
      const updatedProfile = response.data;
      
      setProfile({ // Update state with response from API
          firstName: updatedProfile.firstName || "",
          lastName: updatedProfile.lastName || "",
          email: updatedProfile.email || profile.email, // Email shouldn't change here, keep existing
          phone: updatedProfile.phone || "",
          profilePicture: updatedProfile.profilePicture || profile.profilePicture,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      })
    } catch (error: any) {
      console.error("Failed to update profile", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update profile. Please try again.",
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
