"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

function SignInForm() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState("")
	const router = useRouter()
	const searchParams = useSearchParams()
	const callbackUrl = searchParams.get("next") || "/dashboard"

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setIsLoading(true)
		setError("")

		try {
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false
			})

			if (result?.error) {
				setError("Invalid email or password")
			} else {
				router.push(callbackUrl || "/dashboard" as any)
			}
		} catch (error) {
			setError("An error occurred. Please try again.")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl text-center">Sign In</CardTitle>
					<CardDescription className="text-center">
						Enter your credentials to access your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="Enter your password"
								value={password}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Signing in..." : "Sign In"}
						</Button>
					</form>
					<div className="mt-4 text-center text-sm">
						Don&apos;t have an account?{" "}
						<Link href="/sign-up" className="text-primary hover:underline">
							Sign up
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default function SignInPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardContent className="p-6">
						<div className="animate-pulse space-y-4">
							<div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
							<div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
							<div className="space-y-2">
								<div className="h-4 bg-gray-200 rounded w-1/4"></div>
								<div className="h-10 bg-gray-200 rounded"></div>
							</div>
							<div className="space-y-2">
								<div className="h-4 bg-gray-200 rounded w-1/4"></div>
								<div className="h-10 bg-gray-200 rounded"></div>
							</div>
							<div className="h-10 bg-gray-200 rounded"></div>
						</div>
					</CardContent>
				</Card>
			</div>
		}>
			<SignInForm />
		</Suspense>
	)
}
