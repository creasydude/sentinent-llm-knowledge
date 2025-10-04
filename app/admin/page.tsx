"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, LogOut, Download, Check, UserPlus, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile, getUsers, getAnswers, validateAnswer, promoteUser, demoteUser, exportAnswers, createQuestion } from "@/lib/api";

interface Submission {
  id: string
  text: string
  question: { id: string; text: string; topic: string } | null
  userEmail: string | null
  isGoodAnswer: boolean
}

interface UserData {
  id: string
  email: string
  points: number
  isAdmin: boolean
}

export default function AdminPanel() {
  const [user, setUser] = useState<{ email: string; points: number; isAdmin: boolean } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [newQuestion, setNewQuestion] = useState({ text: "", topic: "" });
  const router = useRouter();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const profileRes = await getProfile();
        if (!profileRes.data.isAdmin) {
          router.push("/dashboard");
          return;
        }
        setUser(profileRes.data);

        const usersRes = await getUsers();
        setUsers(usersRes.data);

        const answersRes = await getAnswers();
        setSubmissions(answersRes.data);
      } catch (error) {
        console.error(error);
        router.push("/");
      }
    };

    fetchAdminData();
  }, [router]);

  const handleValidateSubmission = async (submissionId: string) => {
    try {
      await validateAnswer(submissionId);
      const answersRes = await getAnswers();
      setSubmissions(answersRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await exportAnswers();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "dataset.json");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      if (isAdmin) {
        await demoteUser(userId);
      } else {
        await promoteUser(userId);
      }
      const usersRes = await getUsers();
      setUsers(usersRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createQuestion(newQuestion.topic);
      setNewQuestion({ text: "", topic: "" });
      alert("Question created successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to create question.");
    }
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
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Admin Panel
            </Badge>
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
                      {user?.email.charAt(0).toUpperCase() ?? "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>User Dashboard</span>
                  </Link>
                </DropdownMenuItem>
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
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="submissions">Submissions Review</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="questions">Question Management</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Review User Submissions</CardTitle>
                <Button onClick={handleExportData} className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Export Validated Dataset (.json)</span>
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Submitted Answer</TableHead>
                      <TableHead>User Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="max-w-xs">
                          <p className="truncate" title={submission.question.text}>
                            {submission.question.text}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <p className="truncate" title={submission.text}>
                            {submission.text}
                          </p>
                        </TableCell>
                        <TableCell>{submission.userEmail ?? "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={submission.isGoodAnswer ? "default" : "secondary"}
                            className={
                              submission.isGoodAnswer
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }
                          >
                            {submission.isGoodAnswer ? "Validated" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!submission.isGoodAnswer ? (
                            <Button
                              size="sm"
                              onClick={() => handleValidateSubmission(submission.id)}
                              className="flex items-center space-x-1"
                            >
                              <Check className="h-3 w-3" />
                              <span>Validate</span>
                            </Button>
                          ) : (
                            <Button size="sm" disabled variant="outline">
                              Validated
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Email</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Admin Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {user.points}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isAdmin ? "default" : "secondary"}
                            className={
                              user.isAdmin
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }
                          >
                            {user.isAdmin ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                            className="flex items-center space-x-1"
                          >
                            {user.isAdmin ? (
                              <>
                                <UserMinus className="h-3 w-3" />
                                <span>Revoke Admin</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3" />
                                <span>Make Admin</span>
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Question</CardTitle>
                <p className="text-sm text-muted-foreground">
                  The question will be automatically generated by an LLM based on the topic you provide.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateQuestion} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionTopic">Topic</Label>
                    <Input
                      id="questionTopic"
                      placeholder="e.g., Science, History, Technology"
                      value={newQuestion.topic}
                      onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Generate Question
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
