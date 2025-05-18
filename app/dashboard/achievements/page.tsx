"use client"

import { useState } from "react"
import { Star, Trophy, Award, Medal, Sparkles, Rocket, Code, Atom, Brain } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: "robotics" | "coding" | "science" | "math"
  difficulty: "easy" | "medium" | "advanced"
  earned: boolean
  earnedDate?: string
  progress?: number
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "1",
      title: "Robot Builder",
      description: "Successfully built your first robot in the Robotics Workshop",
      icon: <Rocket className="h-8 w-8 text-[#0078FF] wiggling" />,
      category: "robotics",
      difficulty: "easy",
      earned: true,
      earnedDate: "2023-05-15",
    },
    {
      id: "2",
      title: "Code Master",
      description: "Completed all exercises in the Coding Bootcamp",
      icon: <Code className="h-8 w-8 text-[#00B300] wiggling" />,
      category: "coding",
      difficulty: "medium",
      earned: true,
      earnedDate: "2023-06-10",
    },
    {
      id: "3",
      title: "Science Explorer",
      description: "Conducted 5 different science experiments",
      icon: <Atom className="h-8 w-8 text-[#7B00FF] wiggling" />,
      category: "science",
      difficulty: "easy",
      earned: true,
      earnedDate: "2023-04-22",
    },
    {
      id: "4",
      title: "Math Genius",
      description: "Solved 10 advanced math problems in the Math Challenge",
      icon: <Brain className="h-8 w-8 text-[#FFC800] wiggling" />,
      category: "math",
      difficulty: "advanced",
      earned: false,
      progress: 70,
    },
    {
      id: "5",
      title: "Robotics Champion",
      description: "Won first place in the Robotics Competition",
      icon: <Trophy className="h-8 w-8 text-[#0078FF] wiggling" />,
      category: "robotics",
      difficulty: "advanced",
      earned: false,
      progress: 50,
    },
    {
      id: "6",
      title: "App Developer",
      description: "Created your first mobile application",
      icon: <Code className="h-8 w-8 text-[#00B300] wiggling" />,
      category: "coding",
      difficulty: "medium",
      earned: false,
      progress: 30,
    },
    {
      id: "7",
      title: "Chemistry Whiz",
      description: "Completed all chemistry experiments with perfect results",
      icon: <Atom className="h-8 w-8 text-[#7B00FF] wiggling" />,
      category: "science",
      difficulty: "medium",
      earned: false,
      progress: 20,
    },
    {
      id: "8",
      title: "Math Olympiad",
      description: "Participated in the Math Olympiad",
      icon: <Brain className="h-8 w-8 text-[#FFC800] wiggling" />,
      category: "math",
      difficulty: "advanced",
      earned: false,
      progress: 10,
    },
  ])

  const earnedAchievements = achievements.filter(a => a.earned)
  const inProgressAchievements = achievements.filter(a => !a.earned)

  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return <div className="flex"><Star className="h-4 w-4 text-[#00B300]" /></div>
      case "medium":
        return <div className="flex"><Star className="h-4 w-4 text-[#0078FF]" /><Star className="h-4 w-4 text-[#0078FF]" /></div>
      case "advanced":
        return <div className="flex"><Star className="h-4 w-4 text-[#7B00FF]" /><Star className="h-4 w-4 text-[#7B00FF]" /><Star className="h-4 w-4 text-[#7B00FF]" /></div>
      default:
        return null
    }
  }

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case "robotics":
        return "🤖"
      case "coding":
        return "💻"
      case "science":
        return "🔬"
      case "math":
        return "🧮"
      default:
        return "🏆"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">Achievements</h1>
        <p className="text-black">Track your progress and earn badges on your STEM journey!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="stem-card col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle className="text-black">Achievement Progress</CardTitle>
            <CardDescription className="text-black">You've earned {earnedAchievements.length} out of {achievements.length} achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={(earnedAchievements.length / achievements.length) * 100} className="h-2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stem-card p-4 text-center">
                  <Trophy className="h-8 w-8 text-[#0078FF] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-black">{earnedAchievements.length}</p>
                  <p className="text-black">Earned</p>
                </div>
                <div className="stem-card p-4 text-center">
                  <Medal className="h-8 w-8 text-[#00B300] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-black">{inProgressAchievements.length}</p>
                  <p className="text-black">In Progress</p>
                </div>
                <div className="stem-card p-4 text-center">
                  <Award className="h-8 w-8 text-[#7B00FF] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-black">
                    {achievements.filter(a => a.difficulty === "advanced" && a.earned).length}
                  </p>
                  <p className="text-black">Advanced</p>
                </div>
                <div className="stem-card p-4 text-center">
                  <Sparkles className="h-8 w-8 text-[#FFC800] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-black">
                    {Math.round((earnedAchievements.length / achievements.length) * 100)}%
                  </p>
                  <p className="text-black">Completion</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="earned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="earned">Earned Achievements</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="all">All Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="earned" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {earnedAchievements.map((achievement) => (
              <Card key={achievement.id} className="stem-card overflow-hidden">
                <div className={`p-4 flex justify-between items-center ${
                  achievement.category === "robotics" ? "bg-[#F0F8FF]" :
                  achievement.category === "coding" ? "bg-[#F0FFF0]" :
                  achievement.category === "science" ? "bg-[#F8F0FF]" :
                  "bg-[#FFFCF0]"
                }`}>
                  <div className="floating">
                    {achievement.icon}
                  </div>
                  <div className="text-4xl">{getCategoryEmoji(achievement.category)}</div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-black">{achievement.title}</CardTitle>
                    {getDifficultyStars(achievement.difficulty)}
                  </div>
                  <CardDescription className="text-black">{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#F0FFF0] text-[#00B300] border border-[#D6FFD6]">
                      <Trophy className="mr-1 h-3 w-3" />
                      Earned
                    </Badge>
                    <span className="text-black text-sm">
                      {achievement.earnedDate && new Date(achievement.earnedDate).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">Share Achievement</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="in-progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inProgressAchievements.map((achievement) => (
              <Card key={achievement.id} className="stem-card overflow-hidden">
                <div className={`p-4 flex justify-between items-center ${
                  achievement.category === "robotics" ? "bg-[#F0F8FF]" :
                  achievement.category === "coding" ? "bg-[#F0FFF0]" :
                  achievement.category === "science" ? "bg-[#F8F0FF]" :
                  "bg-[#FFFCF0]"
                }`}>
                  <div>
                    {achievement.icon}
                  </div>
                  <div className="text-4xl">{getCategoryEmoji(achievement.category)}</div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-black">{achievement.title}</CardTitle>
                    {getDifficultyStars(achievement.difficulty)}
                  </div>
                  <CardDescription className="text-black">{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-black text-sm">
                      <span>Progress</span>
                      <span>{achievement.progress}%</span>
                    </div>
                    <Progress value={achievement.progress} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">View Requirements</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="stem-card overflow-hidden">
                <div className={`p-4 flex justify-between items-center ${
                  achievement.category === "robotics" ? "bg-[#F0F8FF]" :
                  achievement.category === "coding" ? "bg-[#F0FFF0]" :
                  achievement.category === "science" ? "bg-[#F8F0FF]" :
                  "bg-[#FFFCF0]"
                }`}>
                  <div className={achievement.earned ? "floating" : ""}>
                    {achievement.icon}
                  </div>
                  <div className="text-4xl">{getCategoryEmoji(achievement.category)}</div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-black">{achievement.title}</CardTitle>
                    {getDifficultyStars(achievement.difficulty)}
                  </div>
                  <CardDescription className="text-black">{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {achievement.earned ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#F0FFF0] text-[#00B300] border border-[#D6FFD6]">
                        <Trophy className="mr-1 h-3 w-3" />
                        Earned
                      </Badge>
                      <span className="text-black text-sm">
                        {achievement.earnedDate && new Date(achievement.earnedDate).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between text-black text-sm">
                        <span>Progress</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <Progress value={achievement.progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={achievement.earned ? "outline" : "default"}
                    className="w-full"
                  >
                    {achievement.earned ? "Share Achievement" : "View Requirements"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
