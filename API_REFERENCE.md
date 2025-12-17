# Admin Dashboard API Reference

## Stats Endpoint
**Path**: `GET /api/stats`

**Response Example**:
```json
{
  "ordersCount": 156,
  "productsCount": 45,
  "usersCount": 180,
  "totalRevenue": 445000,
  
  "conversionRate": 2.5,
  "averageOrderValue": 3500,
  "totalVisitors": 450,
  "conversionChangePercent": 12,
  "aovChangePercent": -5,
  
  "revenueTrend": [
    { "date": "2025-12-10", "revenue": 25000 },
    { "date": "2025-12-11", "revenue": 32000 },
    ...
  ],
  "revenueChangePercent": 15,
  "ordersChangePercent": 8,
  
  "ordersByStatus": [
    { "status": "pending", "count": 12 },
    { "status": "processing", "count": 7 },
    { "status": "completed", "count": 137 }
  ],
  "ordersByStage": [
    { "status": "pending", "count": 12, "_count": 12 }
  ],
  "paidOrders": 140,
  "unpaidOrders": 16,
  "deliveredOrders": 110,
  
  "topProducts": [
    {
      "id": "prod-1",
      "name": "Red T-Shirt",
      "image": "https://...",
      "price": 499,
      "totalSold": 24,
      "orderCount": 18
    }
  ],
  "lowStockProducts": [
    {
      "id": "prod-5",
      "name": "Black Hoodie",
      "stock": 3
    }
  ],
  
  "revenueBySource": [
    { "name": "Custom Upload", "value": 200250, "percentage": 45 },
    { "name": "AI Generated", "value": 155750, "percentage": 35 },
    { "name": "Pre-Made", "value": 89000, "percentage": 20 }
  ],
  
  "topCustomers": [
    {
      "id": "user-1",
      "name": "Rajesh Kumar",
      "email": "rajesh@example.com",
      "orders": 8,
      "totalSpend": 24999
    }
  ],
  
  "aiStats": {
    "totalGenerated": 124,
    "convertedOrders": 38,
    "conversionRate": 30.6
  },
  
  "newUsersThisMonth": 45,
  "recentOrdersCount": 20,
  "recentRevenue": 85000
}
```

---

## Recent Orders Endpoint
**Path**: `GET /api/orders/recent`

**Response Example**:
```json
[
  {
    "id": "ORD-12345",
    "customer": "John Doe",
    "email": "john@example.com",
    "amount": 2499,
    "status": "delivered",
    "isPaid": true,
    "date": "2025-12-17"
  },
  {
    "id": "ORD-12344",
    "customer": "Sarah Smith",
    "email": "sarah@example.com",
    "amount": 5999,
    "status": "processing",
    "isPaid": true,
    "date": "2025-12-16"
  }
]
```

---

## Recent Users Endpoint
**Path**: `GET /api/users/recent`

**Response Example**:
```json
[
  {
    "id": "USR-001",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "joinDate": "2025-12-17",
    "rank": "Initiate"
  },
  {
    "id": "USR-002",
    "name": "Rohan Kumar",
    "email": "rohan@example.com",
    "joinDate": "2025-12-16",
    "rank": "Initiate"
  }
]
```

---

## Database Queries Used

### Get Low Stock Products
```prisma
Product.findMany({
  where: { stock: { lte: 10 } },
  select: { id: true, name: true, stock: true },
  take: 5,
  orderBy: { stock: 'asc' }
})
```

### Get Top Customers
```prisma
Order.groupBy({
  by: ['userId'],
  _sum: { totalPrice: true },
  _count: true,
  orderBy: { _sum: { totalPrice: 'desc' } },
  take: 5,
  where: { isPaid: true }
})
```

### Get Revenue by Period
```prisma
Order.aggregate({
  _sum: { totalPrice: true },
  _count: true,
  where: {
    isPaid: true,
    createdAt: { gte: sevenDaysAgo }
  }
})
```

---

## Frontend Integration Examples

### Use Stats in Component
```typescript
const { data: stats, isLoading } = useQuery({
  queryKey: ["admin-stats"],
  queryFn: async () => {
    const { data } = await axios.get("/api/stats");
    return data;
  },
});

// Access data
stats?.totalRevenue
stats?.conversionRate
stats?.topCustomers
```

### Use Recent Orders
```typescript
const { data: orders = [], isLoading } = useQuery({
  queryKey: ["recent-orders"],
  queryFn: async () => {
    const { data } = await axios.get("/api/orders/recent");
    return data;
  },
});

orders.forEach(order => {
  console.log(order.customer, order.amount);
});
```

---

## Cache Strategy

- Stats data: Cached for immediate reuse
- Recent orders: Refetch on-demand
- Recent users: Refetch on-demand
- Stale time: Default (0ms) - refetch immediately
- GC time: 5 minutes - keep in cache for 5 mins of inactivity

---

## Error Handling

All endpoints return 500 error with message:
```json
{
  "error": "Failed to fetch [resource]"
}
```

Handled in frontend with fallback values:
- Loading: Skeleton loaders
- Error: Graceful degradation or error toast
- Empty: "No data yet" message

