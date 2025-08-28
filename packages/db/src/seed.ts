import { prisma } from "./index"
import { UserRole, ArtworkStatus, ArtworkVisibility, ArtworkKind, EditionType, OrderStatus, PaymentProvider, OrderItemKind, PayoutStatus, PayoutProvider, KycStatus, KycDocumentType } from "@prisma/client"
import * as argon2 from "argon2"
import { seedPricing } from "./seed.pricing"
import { seedCosting } from "./seed.costing"
import { seedCollections } from "./seed.collections"

async function main() {
	console.log("🌱 Seeding database...")

	// Clean up existing data
	await prisma.orderItem.deleteMany()
	await prisma.order.deleteMany()
	await prisma.artwork.deleteMany()
	await prisma.kycVerification.deleteMany()
	await prisma.artist.deleteMany()
	await prisma.user.deleteMany()
	await prisma.address.deleteMany()
	await prisma.auditLog.deleteMany()

	const passwordHash = await argon2.hash("RomArt123!")

	const adminUser = await prisma.user.create({
		data: {
			email: "admin@romart.com",
			name: "Admin User",
			role: UserRole.ADMIN,
			passwordHash
		}
	})

	const buyerUser = await prisma.user.create({
		data: {
			email: "buyer@romart.com",
			name: "John Buyer",
			role: UserRole.BUYER,
			passwordHash
		}
	})

	const artistUser = await prisma.user.create({
		data: {
			email: "artist@romart.com",
			name: "Maria Popescu",
			role: UserRole.ARTIST,
			passwordHash
		}
	})

	const artist = await prisma.artist.create({
		data: {
			userId: artistUser.id,
			displayName: "Maria Popescu",
			slug: "maria-popescu",
			bio: "Contemporary Romanian artist exploring themes of identity and cultural heritage through mixed media and digital art.",
			statement: "My work investigates the intersection of traditional Romanian folk art with modern digital aesthetics, creating a dialogue between past and present.",
			locationCity: "București",
			locationCountry: "RO",
			avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
			coverUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=400&fit=crop",
			socials: {
				website: "https://mariapopescu.art",
				instagram: "maria_popescu_art",
				facebook: "mariapopescuart",
				x: "maria_popescu",
				tiktok: "maria_popescu_art",
				youtube: "mariapopescuart"
			},
			education: [
				{
					school: "Universitatea Națională de Arte București",
					program: "Fine Arts",
					year: 2020
				},
				{
					school: "Academia de Arte Vizuale",
					program: "Digital Arts",
					year: 2022
				}
			],
			exhibitions: [
				{
					title: "Romanian Contemporary Art Exhibition",
					venue: "Muzeul Național de Artă",
					year: 2023
				},
				{
					title: "Digital Heritage",
					venue: "Centrul Cultural European",
					year: 2022
				}
			],
			awards: [
				{
					title: "Best Emerging Artist",
					org: "Romanian Art Association",
					year: 2023
				}
			],
			onboardingStep: 6,
			completionScore: 100,
			slugLockedAt: new Date(),
			kycStatus: KycStatus.APPROVED
		}
	})

	// Create KYC verification for the artist
	await prisma.kycVerification.create({
		data: {
			artistId: artist.id,
			status: KycStatus.APPROVED,
			provider: "MANUAL",
			country: "RO",
			documentType: KycDocumentType.ID_CARD,
			docLast4: "1234",
			frontImageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
			backImageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
			selfieImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
			reviewedById: adminUser.id,
			reviewedAt: new Date()
		}
	})

	// Create artworks
	const originalArtwork = await prisma.artwork.create({
		data: {
			artistId: artist.id,
			slug: "abstract-harmony-2023",
			title: "Abstract Harmony",
			description: "A vibrant abstract composition exploring the relationship between color and emotion. This original piece features bold brushstrokes and a dynamic color palette.",
			year: 2023,
			medium: "Acrylic on canvas",
			widthCm: 100,
			heightCm: 80,
			framed: true,
			category: "Abstract",
			status: ArtworkStatus.PUBLISHED,
			visibility: ArtworkVisibility.PUBLIC,
			heroImageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop",
			priceMinor: 250000, // €2,500.00
			currency: "EUR",
			kind: ArtworkKind.ORIGINAL
		}
	})

	const printArtwork = await prisma.artwork.create({
		data: {
			artistId: artist.id,
			slug: "digital-dreams-2023",
			title: "Digital Dreams",
			description: "A limited edition print exploring the intersection of digital and traditional art forms. Each print is hand-signed and numbered.",
			year: 2023,
			medium: "Digital print on archival paper",
			widthCm: 60,
			heightCm: 40,
			framed: false,
			category: "Digital Art",
			status: ArtworkStatus.PUBLISHED,
			visibility: ArtworkVisibility.PUBLIC,
			heroImageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop",
			priceMinor: 0, // Editions have their own pricing
			currency: "EUR",
			kind: ArtworkKind.EDITIONED
		}
	})

	const digitalArtwork = await prisma.artwork.create({
		data: {
			artistId: artist.id,
			slug: "virtual-reality-2023",
			title: "Virtual Reality",
			description: "A digital artwork exploring the concept of virtual spaces and digital identity. Available as a high-resolution digital download.",
			year: 2023,
			medium: "Digital art",
			widthCm: 1920,
			heightCm: 1080,
			framed: false,
			category: "Digital Art",
			status: ArtworkStatus.PUBLISHED,
			visibility: ArtworkVisibility.PUBLIC,
			heroImageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop",
			priceMinor: 15000, // €150.00
			currency: "EUR",
			kind: ArtworkKind.DIGITAL
		}
	})

	// Create editions for the print artwork
	const printEdition = await prisma.edition.create({
		data: {
			artworkId: printArtwork.id,
			sku: "DD-2023-PRINT-001",
			runSize: 50,
			available: 48,
			type: EditionType.PRINT,
			priceMinor: 15000, // €150.00
			currency: "EUR"
		}
	})

	// Create images for artworks
	await prisma.image.createMany({
		data: [
			{
				artworkId: originalArtwork.id,
				url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop",
				width: 800,
				height: 600,
				position: 0,
				alt: "Abstract Harmony - Main view"
			},
			{
				artworkId: originalArtwork.id,
				url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop",
				width: 800,
				height: 600,
				position: 1,
				alt: "Abstract Harmony - Detail view"
			},
			{
				artworkId: printArtwork.id,
				url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop",
				width: 800,
				height: 600,
				position: 0,
				alt: "Digital Dreams - Print edition"
			},
			{
				artworkId: digitalArtwork.id,
				url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop",
				width: 800,
				height: 600,
				position: 0,
				alt: "Virtual Reality - Digital artwork"
			}
		]
	})

	// Create shipping address for buyer
	const shippingAddress = await prisma.address.create({
		data: {
			userId: buyerUser.id,
			type: "SHIPPING",
			firstName: "John",
			lastName: "Doe",
			addressLine1: "123 Main Street",
			addressLine2: "Apt 4B",
			city: "Bucharest",
			region: "București",
			postalCode: "010001",
			country: "Romania"
		}
	})

	// Create order with 2 items
	const order = await prisma.order.create({
		data: {
			buyerId: buyerUser.id,
			status: OrderStatus.PAID,
			platformFeeBps: 3000, // 30%
			totalAmount: 280000, // €2,800.00 (2500 + 150*2)
			currency: "EUR",
			paymentProvider: PaymentProvider.TEST,
			providerIntentId: "pi_test_123456789",
			shippingAddressId: shippingAddress.id,
			billingAddressId: shippingAddress.id
		}
	})

	// Create order items
	const originalItem = await prisma.orderItem.create({
		data: {
			orderId: order.id,
			artistId: artist.id,
			kind: OrderItemKind.ORIGINAL,
			artworkId: originalArtwork.id,
			quantity: 1,
			unitAmount: 250000, // €2,500.00
			subtotal: 250000
		}
	})

	const printItem = await prisma.orderItem.create({
		data: {
			orderId: order.id,
			artistId: artist.id,
			kind: OrderItemKind.PRINT,
			artworkId: printArtwork.id,
			editionId: printEdition.id,
			quantity: 2,
			unitAmount: 15000, // €150.00
			subtotal: 30000
		}
	})

	// Create payouts (70% artist, 30% platform)
	// Original artwork payout: 2500 * 0.7 = 1750
	await prisma.payout.create({
		data: {
			artistId: artist.id,
			orderItemId: originalItem.id,
			amount: 175000, // €1,750.00
			currency: "EUR",
			status: PayoutStatus.PENDING,
			provider: PayoutProvider.TEST
		}
	})

	// Print edition payouts: 150 * 2 * 0.7 = 210
	await prisma.payout.create({
		data: {
			artistId: artist.id,
			orderItemId: printItem.id,
			amount: 21000, // €210.00
			currency: "EUR",
			status: PayoutStatus.PENDING,
			provider: PayoutProvider.TEST
		}
	})

	// Create audit log entries
	await prisma.auditLog.create({
		data: {
			actor: {
				connect: { id: adminUser.id }
			},
			action: "SEED_DATA_CREATED",
			entityType: "Database",
			entityId: "seed",
			data: {
				usersCreated: 3,
				artworksCreated: 3,
				ordersCreated: 1,
				payoutsCreated: 2
			}
		}
	})

	// Seed pricing rules
	await seedPricing();

	// Seed costing data
	await seedCosting();
	
	// Seed collections
	await seedCollections();

	console.log("✅ Database seeded successfully!")
	console.log(`📊 Created:`)
	console.log(`   - ${3} users (admin, buyer, artist)`)
	console.log(`   - ${1} artist profile`)
	console.log(`   - ${3} artworks (original, print, digital)`)
	console.log(`   - ${1} print edition`)
	console.log(`   - ${4} artwork images`)
	console.log(`   - ${1} order with 2 items`)
	console.log(`   - ${2} payouts (70% artist, 30% platform)`)
	console.log(`   - ${1} audit log entry`)
}

main()
	.catch((e) => {
		console.error("❌ Error seeding database:", e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
