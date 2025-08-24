import { prisma } from "../index";
import type { ArtworkKind } from "@prisma/client";

interface GetOrCreateCartParams {
  userId?: string;
  anonymousId?: string;
  currency?: string;
}

interface AddItemToCartParams {
  cartId: string;
  kind: ArtworkKind;
  artworkId?: string | null;
  editionId?: string | null;
  quantity: number;
}

export async function getOrCreateCart({ 
  userId, 
  anonymousId, 
  currency = "EUR" 
}: GetOrCreateCartParams) {
  // Try to find existing cart
  let cart = await prisma.cart.findFirst({
    where: {
      OR: [
        { userId: userId || null },
        { anonymousId: anonymousId || null }
      ]
    },
    include: {
      items: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  // Create new cart if none exists
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: userId || null,
        anonymousId: anonymousId || null,
        currency
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
  }

  return cart;
}

export async function addItemToCart({
  cartId,
  kind,
  artworkId,
  editionId,
  quantity
}: AddItemToCartParams) {
  // Validate inputs
  if (!artworkId && !editionId) {
    throw new Error("Either artworkId or editionId is required");
  }

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  // Get artwork and artist info
  let artistId: string;
  let unitAmount: number;

  if (kind === "ORIGINAL") {
    if (!artworkId) {
      throw new Error("artworkId is required for ORIGINAL items");
    }

    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      include: { artist: true }
    });

    if (!artwork) {
      throw new Error("Artwork not found");
    }

    if (artwork.status !== "PUBLISHED") {
      throw new Error("Artwork is not available for purchase");
    }

    artistId = artwork.artistId;
    unitAmount = artwork.priceAmount;

    // For ORIGINAL, force quantity to 1 and check for duplicates
    quantity = 1;
    
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        artworkId,
        kind: "ORIGINAL"
      }
    });

    if (existingItem) {
      throw new Error("Original artwork already in cart");
    }
  } else {
    // EDITIONED or DIGITAL
    if (!editionId) {
      throw new Error("editionId is required for EDITIONED/DIGITAL items");
    }

    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
      include: { artwork: { include: { artist: true } } }
    });

    if (!edition) {
      throw new Error("Edition not found");
    }

    if (edition.artwork.status !== "PUBLISHED") {
      throw new Error("Artwork is not available for purchase");
    }

    // Check availability for editions
    if (edition.available !== null && edition.available < quantity) {
      throw new Error(`Only ${edition.available} items available`);
    }

    artistId = edition.artwork.artistId;
    unitAmount = edition.unitAmount;
  }

  // Create cart item
  const cartItem = await prisma.cartItem.create({
    data: {
      cartId,
      artistId,
      kind,
      artworkId,
      editionId,
      quantity,
      unitAmount,
      currency: "EUR"
    }
  });

  return cartItem;
}

export async function updateItemQuantity(itemId: string, quantity: number) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      edition: true
    }
  });

  if (!item) {
    throw new Error("Cart item not found");
  }

  // For ORIGINAL, force quantity to 1
  if (item.kind === "ORIGINAL") {
    quantity = 1;
  } else if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  // Check availability for editions
  if (item.kind !== "ORIGINAL" && item.edition) {
    if (item.edition.available !== null && item.edition.available < quantity) {
      throw new Error(`Only ${item.edition.available} items available`);
    }
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity }
  });

  return updatedItem;
}

export async function removeItem(itemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    throw new Error("Cart item not found");
  }

  await prisma.cartItem.delete({
    where: { id: itemId }
  });

  return true;
}

export async function emptyCart(cartId: string) {
  await prisma.cartItem.deleteMany({
    where: { cartId }
  });

  return true;
}

export async function getCartWithItems(cartId: string) {
  return await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

export async function consolidateCarts(userId: string, anonymousId: string) {
  // Find both carts
  const userCart = await prisma.cart.findFirst({
    where: { userId }
  });

  const anonymousCart = await prisma.cart.findFirst({
    where: { anonymousId },
    include: { items: true }
  });

  if (!anonymousCart || anonymousCart.items.length === 0) {
    return userCart;
  }

  if (!userCart) {
    // Move anonymous cart to user
    await prisma.cart.update({
      where: { id: anonymousCart.id },
      data: { userId, anonymousId: null }
    });
    return anonymousCart;
  }

  // Merge items from anonymous cart to user cart
  for (const item of anonymousCart.items) {
    try {
      await addItemToCart({
        cartId: userCart.id,
        kind: item.kind,
        artworkId: item.artworkId,
        editionId: item.editionId,
        quantity: item.quantity
      });
    } catch (error) {
      // Skip items that can't be added (e.g., already in cart, out of stock)
      console.warn(`Could not merge cart item: ${error}`);
    }
  }

  // Delete anonymous cart
  await prisma.cart.delete({
    where: { id: anonymousCart.id }
  });

  return await getCartWithItems(userCart.id);
}
