"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { z } from "zod"

const signUpSchema = z.object({
	email: z.string().email("Invalid email address"),
	name: z.string().min(2, "Name must be at least 2 characters"),
	password: z.string().min(8, "Password must be at least 8 characters")
})

export default function SignUpPage() {
	const [formData, setFormData] = useState({
		email: "",
		name: "",
		password: ""
	})
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState("")
	const router = useRouter()

			const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setIsLoading(true)
		setError("")

		try {
			// Validate form data
			const validatedData = signUpSchema.parse(formData)

			// Create user
			const response = await fetch("/api/auth/sign-up", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validatedData)
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || "Failed to create account")
			}

			// Sign in the user
			const result = await signIn("credentials", {
				email: validatedData.email,
				password: validatedData.password,
				redirect: false
			})

			if (result?.error) {
				setError("Account created but sign-in failed. Please try signing in.")
			} else {
				router.push("/dashboard")
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				setError(error.errors[0].message)
			} else {
				setError(error instanceof Error ? (error as Error).message : "An error occurred")
			}
		} finally {
			setIsLoading(false)
		}
	}

	const handleInputChange = (field: string, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }))
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl text-center">Create Account</CardTitle>
					<CardDescription className="text-center">
						Enter your details to create a new account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="Enter your full name"
								value={formData.name}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("name", e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="Enter your email"
								value={formData.email}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("email", e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="Create a password (min 8 characters)"
								value={formData.password}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("password", e.target.value)}
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
							{isLoading ? "Creating account..." : "Create Account"}
						</Button>
					</form>
					<div className="mt-4 text-center text-sm">
						Already have an account?{" "}
						<Link href="/sign-in" className="text-primary hover:underline">
							Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
