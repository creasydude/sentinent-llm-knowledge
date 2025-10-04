"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile, getUnansweredQuestion, submitAnswer } from "@/lib/api";

export default function Dashboard() {
  const [user, setUser] = useState<{ email: string; points: number; isAdmin: boolean; dailyAnswerCount: number; lastAnswerDate: string | null } | null>(null);
  const [question, setQuestion] = useState<{ id: string; topic: string; text: string } | null>(null);
  const [answer, setAnswer] = useState("");
  const [showAlert, setShowAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dailyLimit, setDailyLimit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const profileRes = await getProfile();
        setUser(profileRes.data);

        const questionRes = await getUnansweredQuestion();
        setQuestion(questionRes.data);
      } catch (error) {
        console.error(error);
        router.push("/");
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !question) return;

    try {
      await submitAnswer(question.id, answer);
      setShowAlert({
        type: "success",
        message: "Answer submitted! +10 points awarded.",
      });
      setAnswer("");
      // Refresh user points
      const profileRes = await getProfile();
      setUser(profileRes.data);
      // Fetch a new question
      const questionRes = await getUnansweredQuestion();
      setQuestion(questionRes.data);
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        if (error.response.data.message === "Answer text cannot be empty") {
          setShowAlert({
            type: "error",
            message: "Answer text cannot be empty.",
          });
        } else {
          setShowAlert({
            type: "error",
            message: "Daily limit reached. Please come back tomorrow to answer more questions.",
          });
          setDailyLimit(true);
        }
      } else {
        setShowAlert({
          type: "error",
          message: "An error occurred. Please try again.",
        });
      }
    }

    // Hide alert after 3 seconds
    setTimeout(() => setShowAlert(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <img src="/icon.png" alt="KnowledgeHub Logo" className="w-6 h-6" />
              <span>KnowledgeHub</span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Points: {user?.points ?? 0}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user?.email.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile - Left Column */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user?.email ?? "..."}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Points</p>
                  <p className="font-medium text-blue-600">{user?.points ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Daily Answer Limit</p>
                  <p className="font-medium">{user?.dailyAnswerCount ?? 0}/5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <Badge variant={user?.isAdmin ? "default" : "secondary"}>{user?.isAdmin ? "Admin" : "User"}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Card - Right Column */}
          <div className="lg:col-span-2">
            {showAlert && (
              <Alert
                className={`mb-4 ${showAlert.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
              >
                {showAlert.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={showAlert.type === "success" ? "text-green-800" : "text-red-800"}>
                  {showAlert.message}
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardDescription className="text-blue-600 font-medium">Topic: {question?.topic}</CardDescription>
                <CardTitle className="text-xl leading-relaxed">{question?.text}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Share your knowledge here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="min-h-[200px] resize-none"
                  disabled={dailyLimit}
                />
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || dailyLimit}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Submit Answer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}