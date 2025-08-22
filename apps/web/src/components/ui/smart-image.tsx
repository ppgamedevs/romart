import Image from "next/image"
import { cn } from "@/lib/utils"

interface SmartImageProps {
	src: string
	alt: string
	width?: number
	height?: number
	sizes?: string
	priority?: boolean
	className?: string
	placeholder?: "empty" | "blur"
	quality?: number
}

export function SmartImage({
	src,
	alt,
	width,
	height,
	sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
	priority = false,
	className,
	placeholder = "empty",
	quality = 75
}: SmartImageProps) {
	return (
		<Image
			src={src}
			alt={alt}
			width={width}
			height={height}
			sizes={sizes}
			priority={priority}
			className={cn("object-cover", className)}
			placeholder={placeholder}
			quality={quality}
		/>
	)
}
