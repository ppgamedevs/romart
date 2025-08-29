import { PrismaClient, QAIssueCode, QAIssueSeverity, QAIssueStatus } from '@artfromromania/db';
import pLimit from 'p-limit';
import { 
  ImageProbeResult, 
  QAIssueData, 
  QAScanConfig, 
  QAScanResult 
} from './types';
import { probeImageWithTimeout, getConfigFromEnv } from './utils';

export class QAScanner {
  private prisma: PrismaClient;
  private config: QAScanConfig;

  constructor(prisma: PrismaClient, config?: Partial<QAScanConfig>) {
    this.prisma = prisma;
    this.config = {
      ...getConfigFromEnv().scan,
      ...config
    };
  }

  async scanArtworkImages(): Promise<QAScanResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    let totalScanned = 0;
    let issuesFound = 0;
    let issuesCreated = 0;
    let issuesUpdated = 0;

    // Get artworks with images
    const artworks = await this.prisma.artwork.findMany({
      where: {
        status: 'PUBLISHED',
        images: {
          some: {
            kind: 'ARTWORK'
          }
        }
      },
      select: {
        id: true,
        artistId: true,
        images: {
          where: { kind: 'ARTWORK' },
          select: { url: true }
        }
      },
      take: this.config.batchSize
    });

    const limit = pLimit(this.config.concurrency);
    const scanPromises = artworks.map(artwork => 
      limit(() => this.scanArtwork(artwork, errors))
    );

    const results = await Promise.allSettled(scanPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        totalScanned += result.value.scanned;
        issuesFound += result.value.issuesFound;
        issuesCreated += result.value.issuesCreated;
        issuesUpdated += result.value.issuesUpdated;
      } else {
        errors.push(`Scan error: ${result.reason}`);
      }
    }

    return {
      totalScanned,
      issuesFound,
      issuesCreated,
      issuesUpdated,
      scanDuration: Date.now() - startTime,
      errors
    };
  }

  async scanCollections(): Promise<QAScanResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    let totalScanned = 0;
    let issuesFound = 0;
    let issuesCreated = 0;
    let issuesUpdated = 0;

    // Get collections without cover images
    const collections = await this.prisma.collection.findMany({
      where: {
        published: true,
        coverImageId: null
      },
      select: {
        id: true,
        title: true
      },
      take: this.config.batchSize
    });

    for (const collection of collections) {
      try {
        const issueData: QAIssueData = {
          code: 'COLLECTION_NO_COVER',
          severity: 'WARNING',
          title: `Collection "${collection.title}" has no cover image`,
          description: 'This collection is published but has no cover image set',
          collectionId: collection.id
        };

        const result = await this.upsertIssue(issueData);
        if (result.created) issuesCreated++;
        if (result.updated) issuesUpdated++;
        issuesFound++;
        totalScanned++;
      } catch (error) {
        errors.push(`Collection scan error: ${error}`);
      }
    }

    return {
      totalScanned,
      issuesFound,
      issuesCreated,
      issuesUpdated,
      scanDuration: Date.now() - startTime,
      errors
    };
  }

  async scanContentIssues(): Promise<QAScanResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    let totalScanned = 0;
    let issuesFound = 0;
    let issuesCreated = 0;
    let issuesUpdated = 0;

    // Check for missing prices
    const artworksWithoutPrice = await this.prisma.artwork.findMany({
      where: {
        status: 'PUBLISHED',
        priceMinor: null,
        saleMinor: null
      },
      select: {
        id: true,
        title: true,
        artistId: true
      },
      take: this.config.batchSize
    });

    for (const artwork of artworksWithoutPrice) {
      try {
        const issueData: QAIssueData = {
          code: 'MISSING_PRICE',
          severity: 'ERROR',
          title: `Artwork "${artwork.title}" has no price`,
          description: 'Published artwork must have a price set',
          artworkId: artwork.id,
          artistId: artwork.artistId
        };

        const result = await this.upsertIssue(issueData);
        if (result.created) issuesCreated++;
        if (result.updated) issuesUpdated++;
        issuesFound++;
        totalScanned++;
      } catch (error) {
        errors.push(`Content scan error: ${error}`);
      }
    }

    // Check for missing dimensions
    const artworksWithoutDimensions = await this.prisma.artwork.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { widthCm: null },
          { heightCm: null }
        ]
      },
      select: {
        id: true,
        title: true,
        artistId: true,
        widthCm: true,
        heightCm: true
      },
      take: this.config.batchSize
    });

    for (const artwork of artworksWithoutDimensions) {
      try {
        const missingFields = [];
        if (!artwork.widthCm) missingFields.push('width');
        if (!artwork.heightCm) missingFields.push('height');

        const issueData: QAIssueData = {
          code: 'MISSING_DIMENSIONS',
          severity: 'WARNING',
          title: `Artwork "${artwork.title}" missing dimensions`,
          description: `Missing: ${missingFields.join(', ')}`,
          artworkId: artwork.id,
          artistId: artwork.artistId
        };

        const result = await this.upsertIssue(issueData);
        if (result.created) issuesCreated++;
        if (result.updated) issuesUpdated++;
        issuesFound++;
        totalScanned++;
      } catch (error) {
        errors.push(`Content scan error: ${error}`);
      }
    }

    return {
      totalScanned,
      issuesFound,
      issuesCreated,
      issuesUpdated,
      scanDuration: Date.now() - startTime,
      errors
    };
  }

  private async scanArtwork(
    artwork: { id: string; artistId: string; images: { url: string }[] },
    errors: string[]
  ): Promise<{ scanned: number; issuesFound: number; issuesCreated: number; issuesUpdated: number }> {
    let scanned = 0;
    let issuesFound = 0;
    let issuesCreated = 0;
    let issuesUpdated = 0;

    for (const image of artwork.images) {
      try {
        const probeResult = await probeImageWithTimeout(
          image.url,
          this.config.timeoutMs,
          this.config.retryAttempts
        );

        const issues = this.detectImageIssues(probeResult, image.url);
        
        for (const issueData of issues) {
          issueData.artworkId = artwork.id;
          issueData.artistId = artwork.artistId;
          issueData.imageUrl = image.url;

          const result = await this.upsertIssue(issueData);
          if (result.created) issuesCreated++;
          if (result.updated) issuesUpdated++;
          issuesFound++;
        }

        scanned++;
      } catch (error) {
        // Create issue for failed image probe
        const issueData: QAIssueData = {
          code: this.getErrorCode(error as Error),
          severity: 'ERROR',
          title: `Image scan failed for artwork`,
          description: (error as Error).message,
          artworkId: artwork.id,
          artistId: artwork.artistId,
          imageUrl: image.url
        };

        const result = await this.upsertIssue(issueData);
        if (result.created) issuesCreated++;
        if (result.updated) issuesUpdated++;
        issuesFound++;
        scanned++;
      }
    }

    return { scanned, issuesFound, issuesCreated, issuesUpdated };
  }

  private detectImageIssues(probeResult: ImageProbeResult, imageUrl: string): QAIssueData[] {
    const issues: QAIssueData[] = [];

    // Check dimensions
    if (probeResult.width < this.config.minWidthPx || probeResult.height < this.config.minHeightPx) {
      issues.push({
        code: 'IMAGE_TOO_SMALL',
        severity: 'WARNING',
        title: 'Image dimensions too small',
        description: `Image is ${probeResult.width}x${probeResult.height}px, minimum is ${this.config.minWidthPx}x${this.config.minHeightPx}px`,
        metadata: {
          width: probeResult.width,
          height: probeResult.height,
          minWidth: this.config.minWidthPx,
          minHeight: this.config.minHeightPx
        }
      });
    }

    // Check file size
    if (probeResult.size < this.config.minSizeBytes) {
      issues.push({
        code: 'IMAGE_ZERO_BYTES',
        severity: 'ERROR',
        title: 'Image file too small',
        description: `Image size is ${probeResult.size} bytes, minimum is ${this.config.minSizeBytes} bytes`,
        metadata: {
          size: probeResult.size,
          minSize: this.config.minSizeBytes
        }
      });
    }

    // Check response time
    if (probeResult.responseTime > this.config.maxResponseTimeMs) {
      issues.push({
        code: 'IMAGE_SLOW_RESPONSE',
        severity: 'WARNING',
        title: 'Image response too slow',
        description: `Response time: ${probeResult.responseTime}ms, maximum: ${this.config.maxResponseTimeMs}ms`,
        metadata: {
          responseTime: probeResult.responseTime,
          maxResponseTime: this.config.maxResponseTimeMs
        }
      });
    }

    // Check content type
    if (!probeResult.mime.startsWith('image/')) {
      issues.push({
        code: 'IMAGE_WRONG_CONTENT_TYPE',
        severity: 'ERROR',
        title: 'Invalid image content type',
        description: `Content type: ${probeResult.mime}`,
        metadata: {
          contentType: probeResult.mime
        }
      });
    }

    return issues;
  }

  private getErrorCode(error: Error): QAIssueCode {
    const message = error.message.toLowerCase();
    
    if (message.includes('404')) return 'IMAGE_404';
    if (message.includes('5')) return 'IMAGE_5XX';
    if (message.includes('timeout') || message.includes('abort')) return 'IMAGE_TIMEOUT';
    if (message.includes('empty')) return 'IMAGE_ZERO_BYTES';
    
    return 'IMAGE_5XX'; // Default fallback
  }

  private async upsertIssue(issueData: QAIssueData): Promise<{ created: boolean; updated: boolean }> {
    const existingIssue = await this.prisma.qAIssue.findFirst({
      where: {
        code: issueData.code,
        status: 'OPEN',
        artworkId: issueData.artworkId,
        artistId: issueData.artistId,
        collectionId: issueData.collectionId,
        imageUrl: issueData.imageUrl
      }
    });

    if (existingIssue) {
      // Update existing issue
      await this.prisma.qAIssue.update({
        where: { id: existingIssue.id },
        data: {
          lastSeen: new Date(),
          title: issueData.title,
          description: issueData.description,
          metadata: issueData.metadata
        }
      });
      return { created: false, updated: true };
    } else {
      // Create new issue
      await this.prisma.qAIssue.create({
        data: {
          code: issueData.code,
          severity: issueData.severity,
          title: issueData.title,
          description: issueData.description,
          metadata: issueData.metadata,
          artworkId: issueData.artworkId,
          artistId: issueData.artistId,
          collectionId: issueData.collectionId,
          imageUrl: issueData.imageUrl
        }
      });
      return { created: true, updated: false };
    }
  }

  async autoResolveOldIssues(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.qAIssue.updateMany({
      where: {
        status: 'OPEN',
        lastSeen: {
          lt: cutoffDate
        }
      },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolution: 'Auto-resolved: Issue not seen recently'
      }
    });

    return result.count;
  }
}
