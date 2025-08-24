import { Packable, PackedPackage, PackingResult } from "./types";
import { packagesConfig, shippingEnv } from "./env";

export function packItems(items: Packable[]): PackingResult {
  const packages: PackedPackage[] = [];
  let oversize = false;
  let totalWeightKg = 0;
  let totalDimWeightKg = 0;

  // Group items by packaging preference and framed status
  const tubeItems = items.filter(item => 
    item.preferred === "TUBE" && !item.framed
  );
  const boxItems = items.filter(item => 
    item.preferred === "BOX" || item.framed
  );

  // Pack tube items
  if (tubeItems.length > 0) {
    const tubePackages = packTubeItems(tubeItems);
    packages.push(...tubePackages.packages);
    oversize = oversize || tubePackages.oversize;
    totalWeightKg += tubePackages.totalWeightKg;
    totalDimWeightKg += tubePackages.totalDimWeightKg;
  }

  // Pack box items
  if (boxItems.length > 0) {
    const boxPackages = packBoxItems(boxItems);
    packages.push(...boxPackages.packages);
    oversize = oversize || boxPackages.oversize;
    totalWeightKg += boxPackages.totalWeightKg;
    totalDimWeightKg += boxPackages.totalDimWeightKg;
  }

  return {
    packages,
    oversize,
    totalWeightKg,
    totalDimWeightKg
  };
}

function packTubeItems(items: Packable[]): PackingResult {
  const packages: PackedPackage[] = [];
  let oversize = false;
  let totalWeightKg = 0;
  let totalDimWeightKg = 0;

  for (const item of items) {
    const { lengthCm, widthCm, heightCm } = getItemDimensions(item);
    const longEdge = Math.max(lengthCm, widthCm, heightCm);
    const shortEdge = Math.min(lengthCm, widthCm, heightCm);

    // Check for oversize
    if (longEdge > shippingEnv.SHIP_MAX_SIDE_CM) {
      oversize = true;
    }

    // Find suitable tube
    const tube = findSuitableTube(longEdge, shortEdge, item.weightKg || 0);
    
    if (!tube) {
      // If no suitable tube, use box instead
      const boxPackage = packItemInBox(item);
      packages.push(boxPackage);
      totalWeightKg += boxPackage.weightKg;
      totalDimWeightKg += boxPackage.dimWeightKg;
      continue;
    }

    const weightKg = estimateWeight(item);
    const dimWeightKg = calculateDimWeight(lengthCm, widthCm, heightCm);
    const finalWeightKg = Math.max(weightKg, dimWeightKg);

    packages.push({
      kind: "TUBE",
      refId: tube.id,
      lengthCm: tube.innerL,
      diameterCm: tube.innerDia,
      weightKg: finalWeightKg,
      dimWeightKg,
      items: [{ orderItemId: item.orderItemId, qty: item.qty }]
    });

    totalWeightKg += finalWeightKg;
    totalDimWeightKg += dimWeightKg;
  }

  return { packages, oversize, totalWeightKg, totalDimWeightKg };
}

function packBoxItems(items: Packable[]): PackingResult {
  const packages: PackedPackage[] = [];
  let oversize = false;
  let totalWeightKg = 0;
  let totalDimWeightKg = 0;

  // Try to pack multiple items in the same box if possible
  const remainingItems = [...items];
  
  while (remainingItems.length > 0) {
    const currentItems: Packable[] = [];
    let currentWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    // Try to add items to current package
    for (let i = 0; i < remainingItems.length; i++) {
      const item = remainingItems[i];
      const { lengthCm, widthCm, heightCm } = getItemDimensions(item);
      const weightKg = estimateWeight(item);

      // Check if item fits in current package
      const newMaxLength = Math.max(maxLength, lengthCm);
      const newMaxWidth = Math.max(maxWidth, widthCm);
      const newMaxHeight = Math.max(maxHeight, heightCm);
      const newWeight = currentWeight + weightKg;

      // Find suitable box for new dimensions
      const box = findSuitableBox(newMaxLength, newMaxWidth, newMaxHeight, newWeight);
      
      if (box && newWeight <= box.maxKg) {
        // Item fits, add it
        currentItems.push(item);
        currentWeight = newWeight;
        maxLength = newMaxLength;
        maxWidth = newMaxWidth;
        maxHeight = newMaxHeight;
        remainingItems.splice(i, 1);
        i--; // Adjust index after removal
      }
    }

    if (currentItems.length === 0) {
      // No items could be packed together, pack the first item alone
      const item = remainingItems.shift()!;
      const boxPackage = packItemInBox(item);
      packages.push(boxPackage);
      totalWeightKg += boxPackage.weightKg;
      totalDimWeightKg += boxPackage.dimWeightKg;
      
      const { lengthCm, widthCm, heightCm } = getItemDimensions(item);
      if (Math.max(lengthCm, widthCm, heightCm) > shippingEnv.SHIP_MAX_SIDE_CM) {
        oversize = true;
      }
      continue;
    }

    // Create package for current items
    const dimWeightKg = calculateDimWeight(maxLength, maxWidth, maxHeight);
    const finalWeightKg = Math.max(currentWeight, dimWeightKg);

    packages.push({
      kind: "BOX",
      refId: findSuitableBox(maxLength, maxWidth, maxHeight, finalWeightKg)?.id,
      lengthCm: maxLength,
      widthCm: maxWidth,
      heightCm: maxHeight,
      weightKg: finalWeightKg,
      dimWeightKg,
      items: currentItems.map(item => ({ orderItemId: item.orderItemId, qty: item.qty }))
    });

    totalWeightKg += finalWeightKg;
    totalDimWeightKg += dimWeightKg;

    // Check for oversize
    if (Math.max(maxLength, maxWidth, maxHeight) > shippingEnv.SHIP_MAX_SIDE_CM) {
      oversize = true;
    }
  }

  return { packages, oversize, totalWeightKg, totalDimWeightKg };
}

function packItemInBox(item: Packable): PackedPackage {
  const { lengthCm, widthCm, heightCm } = getItemDimensions(item);
  const weightKg = estimateWeight(item);
  const dimWeightKg = calculateDimWeight(lengthCm, widthCm, heightCm);
  const finalWeightKg = Math.max(weightKg, dimWeightKg);

  const box = findSuitableBox(lengthCm, widthCm, heightCm, finalWeightKg);

  return {
    kind: "BOX",
    refId: box?.id,
    lengthCm,
    widthCm,
    heightCm,
    weightKg: finalWeightKg,
    dimWeightKg,
    items: [{ orderItemId: item.orderItemId, qty: item.qty }]
  };
}

function getItemDimensions(item: Packable): { lengthCm: number; widthCm: number; heightCm: number } {
  const { widthCm, heightCm, depthCm = 0 } = item;
  
  // For framed items, add frame depth
  const frameDepth = item.framed ? 3 : 0; // 3cm frame depth
  const totalDepth = depthCm + frameDepth;

  return {
    lengthCm: Math.max(widthCm, heightCm),
    widthCm: Math.min(widthCm, heightCm),
    heightCm: totalDepth
  };
}

function estimateWeight(item: Packable): number {
  if (item.weightKg) {
    return item.weightKg;
  }

  const area = (item.widthCm * item.heightCm) / 10000; // m²
  const baseWeight = item.framed ? 1.0 : 0.45; // kg per 0.1 m²
  return Math.max(0.1, area * baseWeight * 10); // Convert to kg
}

function calculateDimWeight(lengthCm: number, widthCm: number, heightCm: number): number {
  const volume = lengthCm * widthCm * heightCm;
  return Math.ceil(volume / shippingEnv.SHIP_DIM_WEIGHT_DIVISOR);
}

function findSuitableTube(longEdge: number, shortEdge: number, weightKg: number): any {
  const tubes = packagesConfig.tubes || [];
  
  for (const tube of tubes) {
    if (longEdge <= tube.innerL && 
        shortEdge <= tube.innerDia && 
        weightKg <= tube.maxKg) {
      return tube;
    }
  }
  
  return null;
}

function findSuitableBox(lengthCm: number, widthCm: number, heightCm: number, weightKg: number): any {
  const boxes = packagesConfig.boxes || [];
  
  for (const box of boxes) {
    if (lengthCm <= box.innerL && 
        widthCm <= box.innerW && 
        heightCm <= box.innerH && 
        weightKg <= box.maxKg) {
      return box;
    }
  }
  
  return null;
}
