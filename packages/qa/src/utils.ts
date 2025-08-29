import probe from 'probe-image-size';

export async function fetchWithTimeout(
  url: string, 
  timeoutMs: number,
  retryAttempts: number = 0
): Promise<{ response: Response; responseTime: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'RomArt-QA-Scanner/1.0'
        }
      });
      const responseTime = Date.now() - startTime;
      
      clearTimeout(timeoutId);
      return { response, responseTime };
    } catch (error) {
      lastError = error as Error;
      if (attempt < retryAttempts) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  clearTimeout(timeoutId);
  throw lastError!;
}

export async function probeImageWithTimeout(
  url: string,
  timeoutMs: number,
  retryAttempts: number = 0
): Promise<{
  width: number;
  height: number;
  type: string;
  mime: string;
  size: number;
  responseTime: number;
  status: number;
}> {
  const { response, responseTime } = await fetchWithTimeout(url, timeoutMs, retryAttempts);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  const size = buffer.byteLength;
  
  if (size === 0) {
    throw new Error('Empty image file');
  }
  
  // Probe image dimensions and type
  const probeResult = await probe(Buffer.from(buffer));
  
  return {
    width: probeResult.width,
    height: probeResult.height,
    type: probeResult.type,
    mime: probeResult.mime,
    size,
    responseTime,
    status: response.status
  };
}

export function getConfigFromEnv(): {
  scan: {
    batchSize: number;
    concurrency: number;
    timeoutMs: number;
    retryAttempts: number;
    minWidthPx: number;
    minHeightPx: number;
    maxResponseTimeMs: number;
    minSizeBytes: number;
  };
  alert: {
    emailTo: string;
    emailFrom: string;
    slackWebhook?: string;
    minSeverity: 'WARNING' | 'ERROR' | 'CRITICAL';
  };
  queue: {
    pageSize: number;
    autoResolveDays: number;
  };
} {
  return {
    scan: {
      batchSize: parseInt(process.env.QA_SCAN_BATCH_SIZE || '50'),
      concurrency: parseInt(process.env.QA_SCAN_CONCURRENCY || '10'),
      timeoutMs: parseInt(process.env.QA_SCAN_TIMEOUT_MS || '10000'),
      retryAttempts: parseInt(process.env.QA_SCAN_RETRY_ATTEMPTS || '2'),
      minWidthPx: parseInt(process.env.QA_IMAGE_MIN_WIDTH_PX || '200'),
      minHeightPx: parseInt(process.env.QA_IMAGE_MIN_HEIGHT_PX || '200'),
      maxResponseTimeMs: parseInt(process.env.QA_IMAGE_MAX_RESPONSE_TIME_MS || '5000'),
      minSizeBytes: parseInt(process.env.QA_IMAGE_MIN_SIZE_BYTES || '1024')
    },
    alert: {
      emailTo: process.env.QA_ALERT_EMAIL_TO || 'admin@artfromromania.com',
      emailFrom: process.env.QA_ALERT_EMAIL_FROM || 'noreply@artfromromania.com',
      slackWebhook: process.env.QA_ALERT_SLACK_WEBHOOK,
      minSeverity: (process.env.QA_ALERT_MIN_SEVERITY as 'WARNING' | 'ERROR' | 'CRITICAL') || 'WARNING'
    },
    queue: {
      pageSize: parseInt(process.env.QA_QUEUE_PAGE_SIZE || '20'),
      autoResolveDays: parseInt(process.env.QA_QUEUE_AUTO_RESOLVE_DAYS || '7')
    }
  };
}
