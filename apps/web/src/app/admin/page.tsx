"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, 
  Package, 
  Users, 
  FileText, 
  Settings, 
  Search,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle
} from "lucide-react"

// Dashboard KPI Component
function DashboardKPI() {
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKPI()
  }, [])

  const fetchKPI = async () => {
    try {
      const response = await fetch('/api/admin/kpi', {
        headers: {
          'x-admin-token': 'admin-secret'
        }
      })
      const data = await response.json()
      if (data.success) {
        setKpis(data.kpis)
      }
    } catch (error) {
      console.error('Failed to fetch KPIs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading KPIs...</div>
  }

  if (!kpis) {
    return <div>Failed to load KPIs</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.ordersCount}</div>
          <p className="text-xs text-muted-foreground">
            Last 30 days
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">GMV</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{(kpis.gmv / 100).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Net: €{(kpis.netRevenue / 100).toFixed(2)}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AOV</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{(kpis.aov / 100).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Average order value
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Refund Rate</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.refundRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Fulfillment: {kpis.onTimeRate.toFixed(0)}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Orders Management Component
function OrdersManagement() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [search, status])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('q', search)
      if (status) params.append('status', status)
      
      const response = await fetch(`/api/admin/orders?${params}`, {
        headers: {
          'x-admin-token': 'admin-secret'
        }
      })
      const data = await response.json()
      if (data.success) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PAID': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'REFUNDED': 'bg-gray-100 text-gray-800'
    }
    return variants[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div>Loading orders...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>
      
      <div className="space-y-2">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{order.id}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.buyer?.email} • {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm">
                    €{(order.totalAmount / 100).toFixed(2)} • {order.items.length} items
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusBadge(order.status)}>
                    {order.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Fulfillment Management Component
function FulfillmentManagement() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Shipping & Returns</CardTitle>
          <CardDescription>
            Manage shipments, labels, and returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-2">Ready to Ship</h3>
              <div className="text-2xl font-bold text-blue-600">12</div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Pending Returns</h3>
              <div className="text-2xl font-bold text-orange-600">3</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">#ORD-123</span>
                <Badge>In Transit</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">#ORD-124</span>
                <Badge>Delivered</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">#RET-001</span>
                <Badge variant="secondary">QC Pending</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">#RET-002</span>
                <Badge variant="destructive">QC Failed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Artists & Users Management Component
function ArtistsUsersManagement() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage artists and customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="font-medium mb-2">Total Artists</h3>
              <div className="text-2xl font-bold">156</div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Active Artists</h3>
              <div className="text-2xl font-bold text-green-600">142</div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Banned Artists</h3>
              <div className="text-2xl font-bold text-red-600">2</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex gap-4">
        <Input
          placeholder="Search artists or users..."
          className="max-w-sm"
        />
        <Button>Search</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">Artist &quot;John Doe&quot; published new artwork</span>
              <span className="text-xs text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">User &quot;jane@example.com&quot; placed order #ORD-125</span>
              <span className="text-xs text-muted-foreground">4 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Catalog Management Component
function CatalogManagement() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Catalog Overview</CardTitle>
          <CardDescription>
            Manage artworks and catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <h3 className="font-medium mb-2">Total Artworks</h3>
              <div className="text-2xl font-bold">1,234</div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Published</h3>
              <div className="text-2xl font-bold text-green-600">1,156</div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Pending Review</h3>
              <div className="text-2xl font-bold text-yellow-600">45</div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Rejected</h3>
              <div className="text-2xl font-bold text-red-600">33</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex gap-4">
        <Input
          placeholder="Search artworks..."
          className="max-w-sm"
        />
        <Button>Search</Button>
        <Button variant="outline">Add Artwork</Button>
      </div>
    </div>
  )
}

// Payouts Management Component
function PayoutsManagement() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payouts Overview</CardTitle>
          <CardDescription>
            Manage artist payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="font-medium mb-2">Pending Payouts</h3>
              <div className="text-2xl font-bold text-orange-600">€2,450</div>
            </div>
            <div>
              <h3 className="font-medium mb-2">This Month</h3>
              <div className="text-2xl font-bold text-green-600">€12,800</div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Total Artists</h3>
              <div className="text-2xl font-bold">89</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium">Artist Name</span>
                <div className="text-sm text-muted-foreground">€150.00</div>
              </div>
              <Badge>Completed</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium">Another Artist</span>
                <div className="text-sm text-muted-foreground">€75.50</div>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Exports Component
function ExportsManagement() {
  const [exportType, setExportType] = useState("orders")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secret'
        },
        body: JSON.stringify({
          kind: exportType,
          from: dateFrom,
          to: dateTo
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // Create and download CSV file
        const blob = new Blob([data.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Data Exports</CardTitle>
          <CardDescription>
            Export data in CSV format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Export Type</label>
            <select 
              value={exportType} 
              onChange={(e) => setExportType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="orders">Orders</option>
              <option value="payouts">Payouts</option>
              <option value="artworks">Artworks</option>
            </select>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          
          <Button onClick={handleExport} className="w-full">
            Export CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Settings Component
function SettingsManagement() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
          <CardDescription>
            Configure admin preferences and system settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">System Configuration</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Export Max Rows</span>
                <span className="font-mono">50,000</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Download URL TTL</span>
                <span className="font-mono">3600s</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Impersonation Enabled</span>
                <Badge variant="outline">Yes</Badge>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Security</h3>
            <Button variant="outline">Change Admin Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Console</h1>
        <p className="text-muted-foreground">
          Manage orders, users, catalog, and system settings
        </p>
      </div>
      
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="fulfillment" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Fulfillment
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Exports
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <DashboardKPI />
        </TabsContent>
        
        <TabsContent value="orders" className="space-y-4">
          <OrdersManagement />
        </TabsContent>
        
        <TabsContent value="fulfillment" className="space-y-4">
          <FulfillmentManagement />
        </TabsContent>
        
        <TabsContent value="moderation" className="space-y-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Moderation interface will be implemented here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <ArtistsUsersManagement />
        </TabsContent>
        
        <TabsContent value="catalog" className="space-y-4">
          <CatalogManagement />
        </TabsContent>
        
        <TabsContent value="payouts" className="space-y-4">
          <PayoutsManagement />
        </TabsContent>
        
        <TabsContent value="exports" className="space-y-4">
          <ExportsManagement />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <SettingsManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
