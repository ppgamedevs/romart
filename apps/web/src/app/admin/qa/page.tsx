"use client";

import { useEffect, useState } from "react";

interface QAIssue {
  id: string;
  code: string;
  severity: "WARNING" | "ERROR" | "CRITICAL";
  status: "OPEN" | "RESOLVED" | "IGNORED";
  title: string;
  description?: string;
  metadata?: any;
  firstSeen: string;
  lastSeen: string;
  resolvedAt?: string;
  resolution?: string;
  artworkId?: string;
  artistId?: string;
  collectionId?: string;
  imageUrl?: string;
  artwork?: {
    title: string;
    slug: string;
    artist: {
      displayName: string;
      slug: string;
    };
  };
  collection?: {
    title: string;
    slug: string;
  };
}

interface QAStats {
  totalIssues: number;
  openIssues: number;
  issuesBySeverity: Record<string, number>;
  issuesByCode: Record<string, number>;
  recentIssues: number;
}

export default function AdminQA() {
  const [issues, setIssues] = useState<QAIssue[]>([]);
  const [stats, setStats] = useState<QAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filters, setFilters] = useState({
    status: "OPEN" as "OPEN" | "RESOLVED" | "IGNORED",
    severity: "" as "" | "WARNING" | "ERROR" | "CRITICAL",
    code: "",
    page: 1
  });

  useEffect(() => {
    loadIssues();
    loadStats();
  }, [filters]);

  async function loadIssues() {
    try {
      const params = new URLSearchParams({
        status: filters.status,
        page: filters.page.toString(),
        pageSize: "20"
      });
      if (filters.severity) params.append("severity", filters.severity);
      if (filters.code) params.append("code", filters.code);

      const response = await fetch(`/api/admin/qa/issues?${params}`, {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || "dev-admin-token"}`
        }
      });
      const data = await response.json();
      setIssues(data.issues || []);
    } catch (error) {
      console.error("Failed to load issues:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const response = await fetch("/api/admin/qa/stats", {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || "dev-admin-token"}`
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }

  async function triggerScan() {
    setScanning(true);
    try {
      const response = await fetch("/api/admin/qa/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || "dev-admin-token"}`
        },
        body: JSON.stringify({ type: "all" })
      });
      const data = await response.json();
      if (data.success) {
        alert("QA scan completed successfully!");
        loadIssues();
        loadStats();
      } else {
        alert("QA scan failed: " + data.error);
      }
    } catch (error) {
      alert("QA scan failed: " + error);
    } finally {
      setScanning(false);
    }
  }

  async function updateIssueStatus(issueId: string, status: "OPEN" | "RESOLVED" | "IGNORED", resolution?: string) {
    try {
      const response = await fetch(`/api/admin/qa/issues/${issueId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || "dev-admin-token"}`
        },
        body: JSON.stringify({ status, resolution })
      });
      const data = await response.json();
      if (data.success) {
        loadIssues();
        loadStats();
      }
    } catch (error) {
      console.error("Failed to update issue status:", error);
    }
  }

  async function recheckIssue(issueId: string) {
    try {
      const response = await fetch(`/api/admin/qa/issues/${issueId}/recheck`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || "dev-admin-token"}`
        }
      });
      const data = await response.json();
      if (data.success) {
        alert("Re-check completed!");
        loadIssues();
        loadStats();
      } else {
        alert("Re-check failed: " + data.error);
      }
    } catch (error) {
      console.error("Failed to recheck issue:", error);
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case "CRITICAL": return "text-red-600 bg-red-50";
      case "ERROR": return "text-red-600 bg-red-50";
      case "WARNING": return "text-yellow-600 bg-yellow-50";
      default: return "text-gray-600 bg-gray-50";
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "OPEN": return "text-red-600 bg-red-50";
      case "RESOLVED": return "text-green-600 bg-green-50";
      case "IGNORED": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Content QA & Broken Images Monitor</h1>
        <button
          onClick={triggerScan}
          disabled={scanning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {scanning ? "Scanning..." : "Run QA Scan"}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Total Issues</div>
            <div className="text-2xl font-bold">{stats.totalIssues}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Open Issues</div>
            <div className="text-2xl font-bold text-red-600">{stats.openIssues}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Critical</div>
            <div className="text-2xl font-bold text-red-600">{stats.issuesBySeverity.CRITICAL || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Last 24h</div>
            <div className="text-2xl font-bold">{stats.recentIssues}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <h3 className="font-medium">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any, page: 1 })}
            className="border rounded-lg px-3 py-2"
          >
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
            <option value="IGNORED">Ignored</option>
          </select>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value as any, page: 1 })}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Severities</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <input
            type="text"
            placeholder="Issue code..."
            value={filters.code}
            onChange={(e) => setFilters({ ...filters, code: e.target.value, page: 1 })}
            className="border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-medium">QA Issues</h3>
        </div>
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : issues.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No issues found</div>
        ) : (
          <div className="divide-y">
            {issues.map((issue) => (
              <div key={issue.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </span>
                      <span className="text-xs text-gray-500">{issue.code}</span>
                    </div>
                    <h4 className="font-medium">{issue.title}</h4>
                    {issue.description && (
                      <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    )}
                    {issue.artwork && (
                      <div className="text-sm text-gray-500 mt-1">
                        Artwork: {issue.artwork.title} by {issue.artwork.artist.displayName}
                      </div>
                    )}
                    {issue.collection && (
                      <div className="text-sm text-gray-500 mt-1">
                        Collection: {issue.collection.title}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      First seen: {new Date(issue.firstSeen).toLocaleString()}
                      {issue.lastSeen !== issue.firstSeen && (
                        <> • Last seen: {new Date(issue.lastSeen).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {issue.status === "OPEN" && (
                      <>
                        <button
                          onClick={() => recheckIssue(issue.id)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Re-check
                        </button>
                        <button
                          onClick={() => updateIssueStatus(issue.id, "RESOLVED")}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => updateIssueStatus(issue.id, "IGNORED")}
                          className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Ignore
                        </button>
                      </>
                    )}
                    {issue.status === "RESOLVED" && (
                      <button
                        onClick={() => updateIssueStatus(issue.id, "OPEN")}
                        className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Reopen
                      </button>
                    )}
                    {issue.status === "IGNORED" && (
                      <button
                        onClick={() => updateIssueStatus(issue.id, "OPEN")}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Unignore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && issues.length > 0 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
            disabled={filters.page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">Page {filters.page}</span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={issues.length < 20}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
