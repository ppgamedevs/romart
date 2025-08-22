import { cn } from "@/lib/utils"

interface SectionProps {
	title?: string
	description?: string
	cta?: React.ReactNode
	children: React.ReactNode
	className?: string
}

export function Section({
	title,
	description,
	cta,
	children,
	className
}: SectionProps) {
	return (
		<section className={cn("space-y-6", className)}>
			{(title || description || cta) && (
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						{title && (
							<h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
						)}
						{description && (
							<p className="text-muted-foreground">{description}</p>
						)}
					</div>
					{cta && <div className="flex items-center gap-2">{cta}</div>}
				</div>
			)}
			{children}
		</section>
	)
}
