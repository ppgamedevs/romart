export async function triggerRevalidation(tags: string[]) {
  const secret = process.env.ON_DEMAND_REVALIDATE_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  
  if (!secret) {
    console.warn("ON_DEMAND_REVALIDATE_SECRET not set, skipping revalidation");
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/api/revalidate?secret=${secret}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tags }),
    });

    if (!response.ok) {
      console.error("Revalidation failed:", response.status, response.statusText);
    } else {
      console.log("Revalidation triggered for tags:", tags);
    }
  } catch (error) {
    console.error("Failed to trigger revalidation:", error);
  }
}

export async function purgeCloudflareCache(paths: string[]) {
  const apiToken = process.env.CF_API_TOKEN;
  const zoneId = process.env.CF_ZONE_ID;
  
  if (!apiToken || !zoneId) {
    console.warn("Cloudflare credentials not set, skipping cache purge");
    return;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: paths }),
      }
    );

    if (!response.ok) {
      console.error("Cloudflare cache purge failed:", response.status, response.statusText);
    } else {
      console.log("Cloudflare cache purged for paths:", paths);
    }
  } catch (error) {
    console.error("Failed to purge Cloudflare cache:", error);
  }
}
