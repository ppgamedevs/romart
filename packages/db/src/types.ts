// Re-export commonly used Prisma types for domain use
import type {
	User,
	Artist,
	Artwork,
	Edition,
	Image,
	Order,
	OrderItem,
	Address,
	Payout,
	AuditLog,
	UserRole,
	ArtworkStatus,
	ArtworkVisibility,
	ArtworkKind,
	EditionType,
	OrderStatus,
	PaymentProvider,
	OrderItemKind,
	PayoutStatus,
	PayoutProvider
} from "@prisma/client"

export type {
	User,
	Artist,
	Artwork,
	Edition,
	Image,
	Order,
	OrderItem,
	Address,
	Payout,
	AuditLog,
	UserRole,
	ArtworkStatus,
	ArtworkVisibility,
	ArtworkKind,
	EditionType,
	OrderStatus,
	PaymentProvider,
	OrderItemKind,
	PayoutStatus,
	PayoutProvider
}

// Common type utilities
export type UserWithArtist = User & {
	artist: Artist | null
}

export type ArtistWithUser = Artist & {
	user: User
}

export type ArtworkWithArtist = Artwork & {
	artist: Artist
	editions: Edition[]
	images: Image[]
}

export type OrderWithItems = Order & {
	items: OrderItem[]
	buyer: User
}

export type OrderItemWithDetails = OrderItem & {
	artwork: Artwork | null
	edition: Edition | null
	artist: Artist
}
