"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { sendOtp, verifyOtp } from "@/lib/api";

export default function AuthPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSendCode = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      await sendOtp(email);
      setStep(2);
    } catch (error) {
      console.error(error);
      // Handle error appropriately in the UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLogin = async () => {
    if (!otp || otp.length !== 6) return;
    setIsLoading(true);
    try {
      const data = await verifyOtp(email, otp);
      localStorage.setItem("token", data.data.accessToken);
      // Assuming the token contains user info, or you get it from another endpoint
      // For now, we'll just redirect
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      // Handle error appropriately in the UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await sendOtp(email);
    } catch (error) {
      console.error(error);
      // Handle error appropriately in the UI
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <img src="/icon.png" alt="KnowledgeHub Logo" className="w-32 h-32 mx-auto" />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 text-center">
            Login or Register
          </CardTitle>
          <CardDescription className="text-gray-600">
            {step === 1 ? "Enter your email to get started" : "Enter the 6-digit code sent to your email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={step === 2}
              className="w-full"
            />
          </div>

          {step === 2 && (
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                6-Digit Code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
          )}

          {step === 1 ? (
            <Button
              onClick={handleSendCode}
              disabled={!email || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Sending..." : "Send Code"}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleVerifyLogin}
                disabled={otp.length !== 6 || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Verifying..." : "Verify & Login"}
              </Button>
              <div className="text-center">
                <button
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  {"Didn't get a code? Resend"}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}