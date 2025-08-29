import { QAIssueCode, QAIssueSeverity, QAIssueStatus } from '@artfromromania/db';

export interface ImageProbeResult {
  width: number;
  height: number;
  type: string;
  mime: string;
  size: number;
  responseTime: number;
  status: number;
}

export interface QAIssueData {
  code: QAIssueCode;
  severity: QAIssueSeverity;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  artworkId?: string;
  artistId?: string;
  collectionId?: string;
  imageUrl?: string;
}

export interface QAScanConfig {
  batchSize: number;
  concurrency: number;
  timeoutMs: number;
  retryAttempts: number;
  minWidthPx: number;
  minHeightPx: number;
  maxResponseTimeMs: number;
  minSizeBytes: number;
}

export interface QAScanResult {
  totalScanned: number;
  issuesFound: number;
  issuesCreated: number;
  issuesUpdated: number;
  scanDuration: number;
  errors: string[];
}

export interface AlertConfig {
  emailTo: string;
  emailFrom: string;
  slackWebhook?: string;
  minSeverity: QAIssueSeverity;
}

export interface QAIssueFilter {
  status?: QAIssueStatus;
  severity?: QAIssueSeverity;
  code?: QAIssueCode;
  artworkId?: string;
  artistId?: string;
  collectionId?: string;
  page?: number;
  pageSize?: number;
}
