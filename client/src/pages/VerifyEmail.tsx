import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [location, setLocation] = useLocation();
  const [searchParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params;
  });

  const token = searchParams.get("token");
  const verifyEmailMutation = trpc.expertVerification.verifyEmail.useMutation();
  const [verificationStatus, setVerificationStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus("error");
        setErrorMessage("No verification token provided");
        return;
      }

      try {
        await verifyEmailMutation.mutateAsync({ token });
        setVerificationStatus("success");
        // Redirect to expert portal after 3 seconds
        setTimeout(() => {
          setLocation("/expert/register");
        }, 3000);
      } catch (error) {
        setVerificationStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to verify email. The code may have expired."
        );
      }
    };

    verifyEmail();
  }, [token, verifyEmailMutation, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>Verifying your email address...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {verificationStatus === "verifying" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">
                Please wait while we verify your email...
              </p>
            </>
          )}

          {verificationStatus === "success" && (
            <>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-center text-green-700 font-semibold">
                Email verified successfully!
              </p>
              <p className="text-center text-sm text-gray-600">
                Redirecting to registration form...
              </p>
            </>
          )}

          {verificationStatus === "error" && (
            <>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-center text-red-700 font-semibold">
                Verification Failed
              </p>
              <p className="text-center text-sm text-gray-600">
                {errorMessage}
              </p>
              <p className="text-center text-sm text-gray-600 mt-4">
                Please{" "}
                <button
                  onClick={() => setLocation("/expert/register")}
                  className="text-blue-600 hover:underline"
                >
                  go back to registration
                </button>{" "}
                and try again.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
