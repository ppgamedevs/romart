"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Palette } from "lucide-react"

export function BecomeArtistButton() {
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const handleBecomeArtist = async () => {
		setIsLoading(true)

		try {
			const response = await fetch("/api/auth/become-artist", {
				method: "POST"
			})

			if (response.ok) {
				router.push("/studio")
				router.refresh()
			} else {
				throw new Error("Failed to upgrade to artist")
			}
		} catch (error) {
			console.error("Error becoming artist:", error)
			alert("Failed to upgrade to artist. Please try again.")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Button 
			className="w-full" 
			onClick={handleBecomeArtist}
			disabled={isLoading}
		>
			<Palette className="w-4 h-4 mr-2" />
			{isLoading ? "Upgrading..." : "Become an Artist"}
		</Button>
	)
}
