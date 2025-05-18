"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Calendar, DollarSign, LineChart, Loader2, PieChart, Users } from "lucide-react";
import { getAdminDashboard, getRevenueAnalytics, getProgramAnalytics, getUserAnalytics } from "@/lib/admin-api";

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [programData, setProgramData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch dashboard overview data
        const dashboardResponse = await getAdminDashboard();
        
        if (dashboardResponse.success) {
          setDashboardData(dashboardResponse.data);
          
          // Fetch analytics data
          try {
            const [revenueResponse, programResponse, userResponse] = await Promise.all([
              getRevenueAnalytics(),
              getProgramAnalytics(),
              getUserAnalytics()
            ]);
            
            if (revenueResponse.success) setRevenueData(revenueResponse.data);
            if (programResponse.success) setProgramData(programResponse.data);
            if (userResponse.success) setUserData(userResponse.data);
          } catch (analyticsError) {
            console.error("Error fetching analytics:", analyticsError);
            // Don't set main error for analytics, just log it
          }
        } else {
          setError(dashboardResponse.error || "Failed to fetch dashboard data");
        }
      } catch (error: any) {
        console.error("Error fetching admin dashboard:", error);
        setError(
          error.response?.data?.error || 
          "An error occurred while fetching dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold">Loading dashboard data...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform statistics and management tools
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered platform users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.stats?.totalPrograms || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available STEM programs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.stats?.totalBookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Program registrations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardData?.stats?.totalRevenue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              From confirmed bookings
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>
                  Latest program registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.recentBookings?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentBookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{booking.program_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.email} • {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            booking.status === "Confirmed" 
                              ? "bg-green-100 text-green-800" 
                              : booking.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No recent bookings</p>
                )}
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push("/dashboard/admin/bookings")}
                  >
                    View All Bookings
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Upcoming Programs</CardTitle>
                <CardDescription>
                  Programs scheduled in the near future
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.upcomingPrograms?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.upcomingPrograms.map((program: any) => (
                      <div key={program.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{program.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(program.date).toLocaleDateString()} • {program.time}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm">
                            {program.booked_seats || 0}/{program.seats} seats
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No upcoming programs</p>
                )}
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push("/dashboard/admin/programs")}
                  >
                    Manage Programs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    onClick={() => router.push("/dashboard/admin/programs/new")}
                  >
                    <Calendar className="h-6 w-6" />
                    <span>Add New Program</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    onClick={() => router.push("/dashboard/admin/materials/new")}
                  >
                    <Calendar className="h-6 w-6" />
                    <span>Upload Materials</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    onClick={() => router.push("/dashboard/admin/users")}
                  >
                    <Users className="h-6 w-6" />
                    <span>Manage Users</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Month</CardTitle>
                <CardDescription>
                  Monthly revenue for the past year
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center text-center">
                  <LineChart className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Revenue analytics visualization would appear here
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push("/dashboard/admin/analytics")}
                  >
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Popular Programs</CardTitle>
                <CardDescription>
                  Programs with the most bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center text-center">
                  <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Program popularity visualization would appear here
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push("/dashboard/admin/analytics")}
                  >
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
                <CardDescription>
                  User age groups and registration trends
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center text-center">
                  <PieChart className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    User demographics visualization would appear here
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push("/dashboard/admin/analytics")}
                  >
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>
                  Revenue breakdown by program category
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center text-center">
                  <PieChart className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Category revenue visualization would appear here
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push("/dashboard/admin/analytics")}
                  >
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
