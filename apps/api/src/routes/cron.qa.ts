import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { QAScanner, QAAlertService } from "@artfromromania/qa";

export default async function routes(app: FastifyInstance) {
  // Cron job for QA scanning
  app.post("/cron/qa/scan", async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== process.env.ADMIN_CRON_TOKEN) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const scanner = new QAScanner(prisma);
    const alertService = new QAAlertService();

    try {
      console.log('Starting scheduled QA scan...');
      
      // Run all scans
      const [imageResults, collectionResults, contentResults] = await Promise.allSettled([
        scanner.scanArtworkImages(),
        scanner.scanCollections(),
        scanner.scanContentIssues()
      ]);

      const results = {
        images: imageResults.status === 'fulfilled' ? imageResults.value : null,
        collections: collectionResults.status === 'fulfilled' ? collectionResults.value : null,
        content: contentResults.status === 'fulfilled' ? contentResults.value : null
      };

      // Send alerts for each scan type
      if (imageResults.status === 'fulfilled') {
        await alertService.sendScanSummary("Artwork Images", imageResults.value);
      }
      if (collectionResults.status === 'fulfilled') {
        await alertService.sendScanSummary("Collections", collectionResults.value);
      }
      if (contentResults.status === 'fulfilled') {
        await alertService.sendScanSummary("Content Issues", contentResults.value);
      }

      // Auto-resolve old issues
      const autoResolveDays = parseInt(process.env.QA_QUEUE_AUTO_RESOLVE_DAYS || '7');
      const resolvedCount = await scanner.autoResolveOldIssues(autoResolveDays);

      console.log('QA scan completed successfully');
      
      res.send({ 
        success: true, 
        results,
        autoResolved: resolvedCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('QA cron job error:', error);
      
      // Send alert for cron job failure
      await alertService.sendAlert(
        'ERROR',
        'QA Cron Job Failed',
        `Scheduled QA scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { timestamp: new Date().toISOString() }
      );
      
      res.status(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}
