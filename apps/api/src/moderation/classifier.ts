import { scoreText } from "@artfromromania/shared";

// Vision provider configuration
const VISION_PROVIDER = process.env.VISION_PROVIDER || "NONE";
const VISION_API_KEY = process.env.VISION_API_KEY;
const VISION_PROJECT_ID = process.env.VISION_PROJECT_ID;
const VISION_REGION = process.env.VISION_REGION;

// Image classification result interface
export interface ImageClassificationResult {
  nsfwScores: Record<string, number>;
  label: string;
}

// Text classification result interface
export interface TextClassificationResult {
  profanity: boolean;
  links: boolean;
  wordsHit: string[];
}

/**
 * Classify image content using configured vision provider
 * Falls back to manual review if no provider is configured
 */
export async function classifyImage({ key }: { key: string }): Promise<ImageClassificationResult> {
  if (VISION_PROVIDER === "NONE" || !VISION_API_KEY) {
    // Fallback to manual review
    return {
      nsfwScores: {},
      label: "unknown"
    };
  }

  try {
    switch (VISION_PROVIDER) {
      case "GCV":
        return await classifyWithGoogleCloudVision(key);
      case "AWS":
        return await classifyWithAWSRekognition(key);
      case "CF_WORKERS_AI":
        return await classifyWithCloudflareWorkersAI(key);
      default:
        console.warn(`Unknown vision provider: ${VISION_PROVIDER}`);
        return {
          nsfwScores: {},
          label: "unknown"
        };
    }
  } catch (error) {
    console.error("Image classification failed:", error);
    // Don't block the flow, return unknown for manual review
    return {
      nsfwScores: {},
      label: "unknown"
    };
  }
}

/**
 * Classify text content for profanity and spam
 */
export async function classifyText({ text }: { text: string }): Promise<TextClassificationResult> {
  return scoreText(text);
}

// Google Cloud Vision implementation (stub)
async function classifyWithGoogleCloudVision(key: string): Promise<ImageClassificationResult> {
  // TODO: Implement Google Cloud Vision API
  console.log("Google Cloud Vision classification not implemented yet");
  return {
    nsfwScores: {},
    label: "unknown"
  };
}

// AWS Rekognition implementation (stub)
async function classifyWithAWSRekognition(key: string): Promise<ImageClassificationResult> {
  // TODO: Implement AWS Rekognition API
  console.log("AWS Rekognition classification not implemented yet");
  return {
    nsfwScores: {},
    label: "unknown"
  };
}

// Cloudflare Workers AI implementation (stub)
async function classifyWithCloudflareWorkersAI(key: string): Promise<ImageClassificationResult> {
  // TODO: Implement Cloudflare Workers AI API
  console.log("Cloudflare Workers AI classification not implemented yet");
  return {
    nsfwScores: {},
    label: "unknown"
  };
}

/**
 * Determine content rating based on classification results
 */
export function determineContentRating(
  imageResult: ImageClassificationResult,
  textResult: TextClassificationResult
): "SAFE" | "MATURE" | "PROHIBITED" {
  const { AUTO_THRESHOLD_MATURE, AUTO_THRESHOLD_REJECT } = require("@artfromromania/shared");
  
  // Check for prohibited content first
  const maxNsfwScore = Math.max(...Object.values(imageResult.nsfwScores), 0);
  if (maxNsfwScore >= AUTO_THRESHOLD_REJECT) {
    return "PROHIBITED";
  }
  
  // Check for mature content
  if (maxNsfwScore >= AUTO_THRESHOLD_MATURE || textResult.profanity) {
    return "MATURE";
  }
  
  // Default to safe
  return "SAFE";
}

/**
 * Create moderation signals from classification results
 */
export function createModerationSignals(
  imageResult: ImageClassificationResult,
  textResult: TextClassificationResult
) {
  return {
    image: {
      nsfwScores: imageResult.nsfwScores,
      label: imageResult.label
    },
    text: {
      profanity: textResult.profanity,
      links: textResult.links,
      wordsHit: textResult.wordsHit
    },
    timestamp: new Date().toISOString()
  };
}
