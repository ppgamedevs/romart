// Auto-moderation thresholds
export const AUTO_THRESHOLD_MATURE = 0.8;
export const AUTO_THRESHOLD_REJECT = 0.95;

// NSFW content tags
export const NSFW_TAGS = [
  "explicit_nudity",
  "sexual_activity", 
  "graphic_violence",
  "hate_symbol",
  "violence",
  "gore",
  "blood",
  "weapons"
];

// Report categories
export const REPORT_CATEGORIES = {
  NUDITY: "nudity",
  HATE: "hate", 
  COPYRIGHT: "copyright",
  SPAM: "spam",
  VIOLENCE: "violence",
  OTHER: "other"
} as const;

export type ReportCategory = typeof REPORT_CATEGORIES[keyof typeof REPORT_CATEGORIES];

// Moderation actions
export const MODERATION_ACTIONS = {
  APPROVE: "APPROVE",
  REJECT: "REJECT", 
  MARK_MATURE: "MARK_MATURE",
  BAN: "BAN",
  UNBAN: "UNBAN",
  SHADOWBAN: "SHADOWBAN",
  UNSHADOWBAN: "UNSHADOWBAN"
} as const;

export type ModerationAction = typeof MODERATION_ACTIONS[keyof typeof MODERATION_ACTIONS];

// Entity types for moderation
export const ENTITY_TYPES = {
  ARTWORK: "ARTWORK",
  ARTIST: "ARTIST",
  IMAGE: "IMAGE"
} as const;

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];

// Report statuses
export const REPORT_STATUSES = {
  OPEN: "OPEN",
  CLOSED: "CLOSED", 
  MERGED: "MERGED"
} as const;

export type ReportStatus = typeof REPORT_STATUSES[keyof typeof REPORT_STATUSES];

// Audit log actions
export const AUDIT_ACTIONS = {
  UPLOAD_IMAGE: "UPLOAD_IMAGE",
  CREATE_ARTWORK: "CREATE_ARTWORK",
  PUBLISH_ARTWORK: "PUBLISH_ARTWORK",
  MODERATION_DECISION: "MODERATION_DECISION",
  BAN_ARTIST: "BAN_ARTIST",
  UNBAN_ARTIST: "UNBAN_ARTIST",
  SHADOWBAN_ARTIST: "SHADOWBAN_ARTIST",
  UNSHADOWBAN_ARTIST: "UNSHADOWBAN_ARTIST",
  CREATE_REPORT: "CREATE_REPORT",
  CLOSE_REPORT: "CLOSE_REPORT"
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// Rate limiting constants
export const RATE_LIMITS = {
  UPLOAD_MAX_PER_HOUR: 120,
  REPORTS_RATE_PER_HOUR: 30,
  MODERATION_ACTIONS_PER_MINUTE: 60
} as const;

// Trust score constants
export const TRUST_SCORES = {
  INITIAL: 50,
  MIN_TO_PUBLISH: 0,
  BAN_THRESHOLD: 10,
  SHADOWBAN_THRESHOLD: 25
} as const;
