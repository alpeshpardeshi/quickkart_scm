import type {
  Vendor, Warehouse, Product, InventoryItem, Batch, PurchaseOrder,
  ReceivingRecord, QcInspection, PutAwayTask, Customer, SalesOrder,
  Picklist, DispatchRecord, ReturnRecord, Task, AppUser, Role,
  NotificationItem, StockMovement, AuditRecord, WastageRecord,
  ApprovalHistoryItem, ZohoSyncRecord,
} from '../../types'

export const vendors: Vendor[] = [
  { id: 'v1', name: 'ABC Foods', code: 'VEN-001', contact: 'Rajesh Mehta', email: 'rajesh@abcfoods.in', phone: '+91 98200 11223', city: 'Mumbai', status: 'Active', categories: ['Dairy', 'Grocery'], leadTimeDays: 3, createdAt: '2025-11-12' },
  { id: 'v2', name: 'FreshMart Supply', code: 'VEN-002', contact: 'Priya Nair', email: 'priya@freshmart.co', phone: '+91 98765 44321', city: 'Pune', status: 'Active', categories: ['Produce', 'Frozen'], leadTimeDays: 2, createdAt: '2025-10-04' },
  { id: 'v3', name: 'Prime Distributors', code: 'VEN-003', contact: 'Amit Shah', email: 'amit@primedist.com', phone: '+91 97654 88776', city: 'Nashik', status: 'Active', categories: ['Oil', 'Staples'], leadTimeDays: 4, createdAt: '2025-08-21' },
  { id: 'v4', name: 'Metro Wholesale', code: 'VEN-004', contact: 'Sneha Patil', email: 'sneha@metrowholesale.in', phone: '+91 98111 33445', city: 'Thane', status: 'On Hold', categories: ['Snacks', 'Beverages'], leadTimeDays: 5, createdAt: '2025-07-15' },
  { id: 'v5', name: 'Green Valley Farms', code: 'VEN-005', contact: 'Karan Desai', email: 'karan@greenvalley.in', phone: '+91 99000 55667', city: 'Nashik', status: 'Active', categories: ['Produce'], leadTimeDays: 1, createdAt: '2026-01-08' },
  { id: 'v6', name: 'Oceanic Seafood Co.', code: 'VEN-006', contact: 'Meera Joshi', email: 'meera@oceanic.in', phone: '+91 98222 77889', city: 'Mumbai', status: 'Inactive', categories: ['Frozen', 'Seafood'], leadTimeDays: 2, createdAt: '2025-05-30' },
]

export const warehouses: Warehouse[] = [
  { id: 'w1', name: 'Mumbai Central', code: 'WH-MUM', city: 'Mumbai', address: 'Plot 14, Andheri East Logistics Park', zones: 8, capacity: 45000, utilization: 72, status: 'Active', manager: 'Ankit Verma' },
  { id: 'w2', name: 'Pune Distribution Center', code: 'WH-PUN', city: 'Pune', address: 'MIDC Hinjewadi Phase 2', zones: 6, capacity: 32000, utilization: 64, status: 'Active', manager: 'Neha Kulkarni' },
  { id: 'w3', name: 'Nashik Warehouse', code: 'WH-NSK', city: 'Nashik', address: 'Satpur Industrial Estate', zones: 4, capacity: 18000, utilization: 81, status: 'Active', manager: 'Rohit Pawar' },
  { id: 'w4', name: 'Thane Cold Storage', code: 'WH-THN', city: 'Thane', address: 'Wagle Estate, Road No. 16', zones: 3, capacity: 12000, utilization: 58, status: 'Maintenance', manager: 'Deepa Iyer' },
]

export const products: Product[] = [
  { id: 'p1', sku: 'SKU-10021', name: 'Organic Milk 1L', category: 'Dairy', uom: 'PCS', safetyStock: 200, reorderPoint: 350, unitPrice: 68, status: 'Active', perishable: true },
  { id: 'p2', sku: 'SKU-10022', name: 'Basmati Rice 5kg', category: 'Staples', uom: 'BAG', safetyStock: 120, reorderPoint: 200, unitPrice: 520, status: 'Active', perishable: false },
  { id: 'p3', sku: 'SKU-10023', name: 'Cooking Oil 1L', category: 'Oil', uom: 'PCS', safetyStock: 180, reorderPoint: 280, unitPrice: 145, status: 'Active', perishable: false },
  { id: 'p4', sku: 'SKU-10024', name: 'Packaged Snacks Assorted', category: 'Snacks', uom: 'CTN', safetyStock: 90, reorderPoint: 150, unitPrice: 380, status: 'Active', perishable: false },
  { id: 'p5', sku: 'SKU-10025', name: 'Fresh Produce Mix', category: 'Produce', uom: 'KG', safetyStock: 80, reorderPoint: 140, unitPrice: 95, status: 'Active', perishable: true },
  { id: 'p6', sku: 'SKU-10026', name: 'Greek Yogurt 400g', category: 'Dairy', uom: 'PCS', safetyStock: 150, reorderPoint: 240, unitPrice: 85, status: 'Active', perishable: true },
  { id: 'p7', sku: 'SKU-10027', name: 'Wheat Flour 10kg', category: 'Staples', uom: 'BAG', safetyStock: 100, reorderPoint: 180, unitPrice: 420, status: 'Active', perishable: false },
  { id: 'p8', sku: 'SKU-10028', name: 'Cold Brew Coffee 250ml', category: 'Beverages', uom: 'PCS', safetyStock: 60, reorderPoint: 100, unitPrice: 175, status: 'Active', perishable: true },
]

export const inventory: InventoryItem[] = [
  { id: 'inv1', sku: 'SKU-10021', product: 'Organic Milk 1L', warehouseId: 'w1', warehouse: 'Mumbai Central', zone: 'A', rack: 'R12', shelf: 'S3', bin: 'B04', batch: 'B102', available: 420, reserved: 80, locked: 0, qcHold: 20, damaged: 0, expired: 0, inTransit: 60, status: 'Available', expiry: '2026-09-18', mfgDate: '2026-06-10' },
  { id: 'inv2', sku: 'SKU-10022', product: 'Basmati Rice 5kg', warehouseId: 'w1', warehouse: 'Mumbai Central', zone: 'B', rack: 'R04', shelf: 'S1', bin: 'B12', batch: 'B210', available: 860, reserved: 120, locked: 0, qcHold: 0, damaged: 4, expired: 0, inTransit: 0, status: 'Available', expiry: '2027-03-01', mfgDate: '2026-03-01' },
  { id: 'inv3', sku: 'SKU-10023', product: 'Cooking Oil 1L', warehouseId: 'w2', warehouse: 'Pune Distribution Center', zone: 'C', rack: 'R08', shelf: 'S2', bin: 'B07', batch: 'B318', available: 310, reserved: 40, locked: 10, qcHold: 0, damaged: 0, expired: 0, inTransit: 100, status: 'Available', expiry: '2027-01-15', mfgDate: '2026-01-15' },
  { id: 'inv4', sku: 'SKU-10024', product: 'Packaged Snacks Assorted', warehouseId: 'w2', warehouse: 'Pune Distribution Center', zone: 'D', rack: 'R02', shelf: 'S4', bin: 'B01', batch: 'B441', available: 95, reserved: 30, locked: 0, qcHold: 0, damaged: 2, expired: 0, inTransit: 0, status: 'Low Stock', expiry: '2026-12-20', mfgDate: '2026-04-20' },
  { id: 'inv5', sku: 'SKU-10025', product: 'Fresh Produce Mix', warehouseId: 'w3', warehouse: 'Nashik Warehouse', zone: 'E', rack: 'R01', shelf: 'S1', bin: 'B03', batch: 'B505', available: 140, reserved: 50, locked: 0, qcHold: 15, damaged: 8, expired: 12, inTransit: 0, status: 'QC Hold', expiry: '2026-09-14', mfgDate: '2026-09-01' },
  { id: 'inv6', sku: 'SKU-10026', product: 'Greek Yogurt 400g', warehouseId: 'w1', warehouse: 'Mumbai Central', zone: 'A', rack: 'R14', shelf: 'S2', bin: 'B08', batch: 'B103', available: 250, reserved: 60, locked: 0, qcHold: 0, damaged: 0, expired: 0, inTransit: 40, status: 'Available', expiry: '2026-10-05', mfgDate: '2026-06-20' },
  { id: 'inv7', sku: 'SKU-10027', product: 'Wheat Flour 10kg', warehouseId: 'w3', warehouse: 'Nashik Warehouse', zone: 'B', rack: 'R06', shelf: 'S3', bin: 'B11', batch: 'B612', available: 480, reserved: 70, locked: 0, qcHold: 0, damaged: 0, expired: 0, inTransit: 0, status: 'Available', expiry: '2027-02-28', mfgDate: '2026-02-28' },
  { id: 'inv8', sku: 'SKU-10028', product: 'Cold Brew Coffee 250ml', warehouseId: 'w4', warehouse: 'Thane Cold Storage', zone: 'F', rack: 'R03', shelf: 'S1', bin: 'B02', batch: 'B720', available: 42, reserved: 18, locked: 5, qcHold: 0, damaged: 0, expired: 0, inTransit: 0, status: 'Low Stock', expiry: '2026-09-22', mfgDate: '2026-07-01' },
  { id: 'inv9', sku: 'SKU-10021', product: 'Organic Milk 1L', warehouseId: 'w2', warehouse: 'Pune Distribution Center', zone: 'A', rack: 'R09', shelf: 'S2', bin: 'B05', batch: 'B104', available: 300, reserved: 40, locked: 0, qcHold: 0, damaged: 0, expired: 0, inTransit: 0, status: 'Available', expiry: '2026-11-18', mfgDate: '2026-07-01' },
  { id: 'inv10', sku: 'SKU-10025', product: 'Fresh Produce Mix', warehouseId: 'w1', warehouse: 'Mumbai Central', zone: 'E', rack: 'R05', shelf: 'S1', bin: 'B09', batch: 'B506', available: 0, reserved: 0, locked: 0, qcHold: 0, damaged: 0, expired: 28, inTransit: 0, status: 'Expired', expiry: '2026-09-02', mfgDate: '2026-08-20' },
]

export const batches: Batch[] = [
  { id: 'b1', batchNo: 'B102', sku: 'SKU-10021', product: 'Organic Milk 1L', warehouse: 'Mumbai Central', qty: 420, mfgDate: '2026-06-10', expiry: '2026-09-18', fefoPriority: 1, status: 'Near Expiry', vendor: 'ABC Foods' },
  { id: 'b2', batchNo: 'B103', sku: 'SKU-10026', product: 'Greek Yogurt 400g', warehouse: 'Mumbai Central', qty: 250, mfgDate: '2026-06-20', expiry: '2026-10-05', fefoPriority: 2, status: 'Active', vendor: 'ABC Foods' },
  { id: 'b3', batchNo: 'B104', sku: 'SKU-10021', product: 'Organic Milk 1L', warehouse: 'Pune Distribution Center', qty: 300, mfgDate: '2026-07-01', expiry: '2026-11-18', fefoPriority: 3, status: 'Active', vendor: 'ABC Foods' },
  { id: 'b4', batchNo: 'B210', sku: 'SKU-10022', product: 'Basmati Rice 5kg', warehouse: 'Mumbai Central', qty: 860, mfgDate: '2026-03-01', expiry: '2027-03-01', fefoPriority: 1, status: 'Active', vendor: 'Prime Distributors' },
  { id: 'b5', batchNo: 'B318', sku: 'SKU-10023', product: 'Cooking Oil 1L', warehouse: 'Pune Distribution Center', qty: 310, mfgDate: '2026-01-15', expiry: '2027-01-15', fefoPriority: 1, status: 'Active', vendor: 'Prime Distributors' },
  { id: 'b6', batchNo: 'B441', sku: 'SKU-10024', product: 'Packaged Snacks Assorted', warehouse: 'Pune Distribution Center', qty: 95, mfgDate: '2026-04-20', expiry: '2026-12-20', fefoPriority: 1, status: 'Active', vendor: 'Metro Wholesale' },
  { id: 'b7', batchNo: 'B505', sku: 'SKU-10025', product: 'Fresh Produce Mix', warehouse: 'Nashik Warehouse', qty: 140, mfgDate: '2026-09-01', expiry: '2026-09-14', fefoPriority: 1, status: 'Near Expiry', vendor: 'Green Valley Farms' },
  { id: 'b8', batchNo: 'B506', sku: 'SKU-10025', product: 'Fresh Produce Mix', warehouse: 'Mumbai Central', qty: 28, mfgDate: '2026-08-20', expiry: '2026-09-02', fefoPriority: 1, status: 'Expired', vendor: 'Green Valley Farms' },
  { id: 'b9', batchNo: 'B612', sku: 'SKU-10027', product: 'Wheat Flour 10kg', warehouse: 'Nashik Warehouse', qty: 480, mfgDate: '2026-02-28', expiry: '2027-02-28', fefoPriority: 1, status: 'Active', vendor: 'Prime Distributors' },
  { id: 'b10', batchNo: 'B720', sku: 'SKU-10028', product: 'Cold Brew Coffee 250ml', warehouse: 'Thane Cold Storage', qty: 42, mfgDate: '2026-07-01', expiry: '2026-09-22', fefoPriority: 1, status: 'Near Expiry', vendor: 'FreshMart Supply' },
]

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1', poNumber: 'PO-10231', vendorId: 'v1', vendor: 'ABC Foods', warehouseId: 'w1', warehouse: 'Mumbai Central',
    expectedDelivery: '2026-09-12', status: 'Published', amount: 84200, itemCount: 18, createdAt: '2026-09-01', createdBy: 'Neha Kulkarni',
    zohoStatus: 'Synced',
    items: [
      { id: 'poi1', sku: 'SKU-10021', product: 'Organic Milk 1L', orderedQty: 400, receivedQty: 0, pendingQty: 400, unitPrice: 68, total: 27200, status: 'Pending' },
      { id: 'poi2', sku: 'SKU-10026', product: 'Greek Yogurt 400g', orderedQty: 300, receivedQty: 0, pendingQty: 300, unitPrice: 85, total: 25500, status: 'Pending' },
    ],
  },
  {
    id: 'po2', poNumber: 'PO-10232', vendorId: 'v3', vendor: 'Prime Distributors', warehouseId: 'w2', warehouse: 'Pune Distribution Center',
    expectedDelivery: '2026-09-15', status: 'Pending Approval', amount: 41600, itemCount: 11, createdAt: '2026-09-03', createdBy: 'Ankit Verma',
    zohoStatus: 'Pending',
    items: [
      { id: 'poi3', sku: 'SKU-10023', product: 'Cooking Oil 1L', orderedQty: 200, receivedQty: 0, pendingQty: 200, unitPrice: 145, total: 29000, status: 'Pending' },
      { id: 'poi4', sku: 'SKU-10022', product: 'Basmati Rice 5kg', orderedQty: 24, receivedQty: 0, pendingQty: 24, unitPrice: 520, total: 12480, status: 'Pending' },
    ],
  },
  {
    id: 'po3', poNumber: 'PO-10228', vendorId: 'v2', vendor: 'FreshMart Supply', warehouseId: 'w1', warehouse: 'Mumbai Central',
    expectedDelivery: '2026-09-08', status: 'Receiving', amount: 62800, itemCount: 14, createdAt: '2026-08-28', createdBy: 'Rohit Pawar',
    zohoStatus: 'Synced',
    items: [
      { id: 'poi5', sku: 'SKU-10028', product: 'Cold Brew Coffee 250ml', orderedQty: 200, receivedQty: 120, pendingQty: 80, unitPrice: 175, total: 35000, status: 'Partial' },
      { id: 'poi6', sku: 'SKU-10025', product: 'Fresh Produce Mix', orderedQty: 180, receivedQty: 180, pendingQty: 0, unitPrice: 95, total: 17100, status: 'Received' },
    ],
  },
  {
    id: 'po4', poNumber: 'PO-10220', vendorId: 'v5', vendor: 'Green Valley Farms', warehouseId: 'w3', warehouse: 'Nashik Warehouse',
    expectedDelivery: '2026-08-30', status: 'Closed', amount: 28500, itemCount: 6, createdAt: '2026-08-20', createdBy: 'Deepa Iyer',
    zohoStatus: 'Synced',
    items: [
      { id: 'poi7', sku: 'SKU-10025', product: 'Fresh Produce Mix', orderedQty: 300, receivedQty: 300, pendingQty: 0, unitPrice: 95, total: 28500, status: 'Received' },
    ],
  },
  {
    id: 'po5', poNumber: 'PO-10235', vendorId: 'v4', vendor: 'Metro Wholesale', warehouseId: 'w2', warehouse: 'Pune Distribution Center',
    expectedDelivery: '2026-09-20', status: 'Draft', amount: 19000, itemCount: 5, createdAt: '2026-09-07', createdBy: 'Neha Kulkarni',
    zohoStatus: 'Not Linked',
    items: [
      { id: 'poi8', sku: 'SKU-10024', product: 'Packaged Snacks Assorted', orderedQty: 50, receivedQty: 0, pendingQty: 50, unitPrice: 380, total: 19000, status: 'Pending' },
    ],
  },
]

export const receiving: ReceivingRecord[] = [
  { id: 'r1', grnNumber: 'GRN-8041', poNumber: 'PO-10228', vendor: 'FreshMart Supply', warehouse: 'Mumbai Central', expectedQty: 380, receivedQty: 300, acceptedQty: 285, rejectedQty: 15, status: 'In Progress', receivedAt: '2026-09-07T09:20:00', receivedBy: 'Suresh Yadav' },
  { id: 'r2', grnNumber: 'GRN-8038', poNumber: 'PO-10220', vendor: 'Green Valley Farms', warehouse: 'Nashik Warehouse', expectedQty: 300, receivedQty: 300, acceptedQty: 292, rejectedQty: 8, status: 'Completed', receivedAt: '2026-08-30T14:10:00', receivedBy: 'Pooja More' },
  { id: 'r3', grnNumber: 'GRN-8044', poNumber: 'PO-10231', vendor: 'ABC Foods', warehouse: 'Mumbai Central', expectedQty: 700, receivedQty: 0, acceptedQty: 0, rejectedQty: 0, status: 'Pending', receivedAt: '2026-09-09T08:00:00', receivedBy: '—' },
]

export const qcInspections: QcInspection[] = [
  { id: 'qc1', reference: 'QC-5521', product: 'Fresh Produce Mix', sku: 'SKU-10025', batch: 'B505', receivedQty: 180, acceptedQty: 0, rejectedQty: 0, reason: '', status: 'Pending', warehouse: 'Nashik Warehouse', inspector: '—', inspectedAt: '' },
  { id: 'qc2', reference: 'QC-5518', product: 'Cold Brew Coffee 250ml', sku: 'SKU-10028', batch: 'B720', receivedQty: 120, acceptedQty: 100, rejectedQty: 20, reason: 'Damaged packaging', status: 'Failed', warehouse: 'Mumbai Central', inspector: 'Vikram Singh', inspectedAt: '2026-09-07T11:30:00' },
  { id: 'qc3', reference: 'QC-5512', product: 'Organic Milk 1L', sku: 'SKU-10021', batch: 'B102', receivedQty: 200, acceptedQty: 198, rejectedQty: 2, reason: 'Minor seal defect', status: 'Passed', warehouse: 'Mumbai Central', inspector: 'Vikram Singh', inspectedAt: '2026-09-05T16:00:00' },
  { id: 'qc4', reference: 'QC-5510', product: 'Packaged Snacks Assorted', sku: 'SKU-10024', batch: 'B441', receivedQty: 40, acceptedQty: 0, rejectedQty: 40, reason: 'Moisture damage', status: 'RTV', warehouse: 'Pune Distribution Center', inspector: 'Anita Rao', inspectedAt: '2026-09-04T10:15:00' },
]

export const putAwayTasks: PutAwayTask[] = [
  { id: 'pa1', product: 'Organic Milk 1L', sku: 'SKU-10021', batch: 'B102', quantity: 198, currentLocation: 'Receiving Dock', suggestedLocation: 'A-R12-S3-B04', destinationBin: '', warehouse: 'Mumbai Central', status: 'Queued', assignedTo: 'Suresh Yadav' },
  { id: 'pa2', product: 'Fresh Produce Mix', sku: 'SKU-10025', batch: 'B505', quantity: 150, currentLocation: 'QC Hold', suggestedLocation: 'E-R01-S1-B03', destinationBin: 'E-R01-S1-B03', warehouse: 'Nashik Warehouse', status: 'In Progress', assignedTo: 'Pooja More' },
  { id: 'pa3', product: 'Cooking Oil 1L', sku: 'SKU-10023', batch: 'B318', quantity: 100, currentLocation: 'Receiving Dock', suggestedLocation: 'C-R08-S2-B07', destinationBin: 'C-R08-S2-B07', warehouse: 'Pune Distribution Center', status: 'Completed', assignedTo: 'Ravi Kumar' },
]

export const customers: Customer[] = [
  { id: 'c1', name: 'City Mart Retail', code: 'CUS-101', contact: 'Arjun Kapoor', email: 'ops@citymart.in', phone: '+91 98123 45678', city: 'Mumbai', type: 'Retail', status: 'Active', creditLimit: 500000 },
  { id: 'c2', name: 'Daily Needs Supermarket', code: 'CUS-102', contact: 'Sunita Reddy', email: 'purchase@dailyneeds.co', phone: '+91 98700 22113', city: 'Pune', type: 'Retail', status: 'Active', creditLimit: 350000 },
  { id: 'c3', name: 'Western Distributors', code: 'CUS-103', contact: 'Imran Khan', email: 'orders@westerndist.in', phone: '+91 97654 11220', city: 'Nashik', type: 'Distributor', status: 'Active', creditLimit: 1200000 },
  { id: 'c4', name: 'Horizon Hotels Group', code: 'CUS-104', contact: 'Lata Menon', email: 'procurement@horizonhotels.com', phone: '+91 99011 33440', city: 'Mumbai', type: 'Wholesale', status: 'Active', creditLimit: 800000 },
  { id: 'c5', name: 'QuickBite Cafe Chain', code: 'CUS-105', contact: 'Dev Patel', email: 'supply@quickbite.in', phone: '+91 98234 77880', city: 'Thane', type: 'Wholesale', status: 'Inactive', creditLimit: 200000 },
]

export const salesOrders: SalesOrder[] = [
  {
    id: 'so1', soNumber: 'SO-20482', customerId: 'c1', customer: 'City Mart Retail', warehouseId: 'w1', warehouse: 'Mumbai Central',
    status: 'Picking', amount: 48600, itemCount: 8, orderDate: '2026-09-06', deliveryDate: '2026-09-10', createdBy: 'Neha Kulkarni',
    items: [
      { id: 'soi1', sku: 'SKU-10021', product: 'Organic Milk 1L', orderedQty: 120, reservedQty: 120, pickedQty: 80, dispatchedQty: 0, unitPrice: 72, total: 8640, batch: 'B102', status: 'Picked' },
      { id: 'soi2', sku: 'SKU-10022', product: 'Basmati Rice 5kg', orderedQty: 40, reservedQty: 40, pickedQty: 40, dispatchedQty: 0, unitPrice: 540, total: 21600, batch: 'B210', status: 'Picked' },
    ],
  },
  {
    id: 'so2', soNumber: 'SO-20485', customerId: 'c3', customer: 'Western Distributors', warehouseId: 'w2', warehouse: 'Pune Distribution Center',
    status: 'Reserved', amount: 72400, itemCount: 12, orderDate: '2026-09-07', deliveryDate: '2026-09-12', createdBy: 'Ankit Verma',
    items: [
      { id: 'soi3', sku: 'SKU-10023', product: 'Cooking Oil 1L', orderedQty: 200, reservedQty: 200, pickedQty: 0, dispatchedQty: 0, unitPrice: 152, total: 30400, status: 'Reserved' },
      { id: 'soi4', sku: 'SKU-10024', product: 'Packaged Snacks Assorted', orderedQty: 80, reservedQty: 80, pickedQty: 0, dispatchedQty: 0, unitPrice: 395, total: 31600, status: 'Reserved' },
    ],
  },
  {
    id: 'so3', soNumber: 'SO-20470', customerId: 'c4', customer: 'Horizon Hotels Group', warehouseId: 'w1', warehouse: 'Mumbai Central',
    status: 'Dispatched', amount: 31200, itemCount: 5, orderDate: '2026-09-02', deliveryDate: '2026-09-05', createdBy: 'Rohit Pawar',
    items: [
      { id: 'soi5', sku: 'SKU-10026', product: 'Greek Yogurt 400g', orderedQty: 100, reservedQty: 100, pickedQty: 100, dispatchedQty: 100, unitPrice: 90, total: 9000, batch: 'B103', status: 'Dispatched' },
      { id: 'soi6', sku: 'SKU-10028', product: 'Cold Brew Coffee 250ml', orderedQty: 80, reservedQty: 80, pickedQty: 80, dispatchedQty: 80, unitPrice: 185, total: 14800, batch: 'B720', status: 'Dispatched' },
    ],
  },
  {
    id: 'so4', soNumber: 'SO-20490', customerId: 'c2', customer: 'Daily Needs Supermarket', warehouseId: 'w3', warehouse: 'Nashik Warehouse',
    status: 'Confirmed', amount: 22800, itemCount: 4, orderDate: '2026-09-08', deliveryDate: '2026-09-14', createdBy: 'Deepa Iyer',
    items: [
      { id: 'soi7', sku: 'SKU-10027', product: 'Wheat Flour 10kg', orderedQty: 30, reservedQty: 0, pickedQty: 0, dispatchedQty: 0, unitPrice: 440, total: 13200, status: 'Pending' },
      { id: 'soi8', sku: 'SKU-10025', product: 'Fresh Produce Mix', orderedQty: 100, reservedQty: 0, pickedQty: 0, dispatchedQty: 0, unitPrice: 96, total: 9600, status: 'Pending' },
    ],
  },
]

export const picklists: Picklist[] = [
  { id: 'pl1', picklistNo: 'PL-10231', soNumber: 'SO-20482', warehouse: 'Mumbai Central', items: 8, picked: 5, status: 'In Progress', assignedTo: 'Suresh Yadav', priority: 'High', createdAt: '2026-09-08T07:30:00' },
  { id: 'pl2', picklistNo: 'PL-10234', soNumber: 'SO-20485', warehouse: 'Pune Distribution Center', items: 12, picked: 0, status: 'Open', assignedTo: 'Ravi Kumar', priority: 'Medium', createdAt: '2026-09-08T10:00:00' },
  { id: 'pl3', picklistNo: 'PL-10220', soNumber: 'SO-20470', warehouse: 'Mumbai Central', items: 5, picked: 5, status: 'Completed', assignedTo: 'Suresh Yadav', priority: 'Medium', createdAt: '2026-09-04T08:15:00' },
]

export const dispatches: DispatchRecord[] = [
  { id: 'd1', dispatchNo: 'DSP-9012', soNumber: 'SO-20470', customer: 'Horizon Hotels Group', warehouse: 'Mumbai Central', items: 5, status: 'Handed Over', vehicle: 'MH-02-AB-4412', driver: 'Ramesh More', dispatchedAt: '2026-09-05T15:40:00' },
  { id: 'd2', dispatchNo: 'DSP-9018', soNumber: 'SO-20482', customer: 'City Mart Retail', warehouse: 'Mumbai Central', items: 8, status: 'Verifying', vehicle: 'MH-02-CD-2291', driver: 'Ganesh Patil', dispatchedAt: '' },
  { id: 'd3', dispatchNo: 'DSP-9020', soNumber: 'SO-20485', customer: 'Western Distributors', warehouse: 'Pune Distribution Center', items: 12, status: 'Queued', vehicle: '—', driver: '—', dispatchedAt: '' },
]

export const returns: ReturnRecord[] = [
  { id: 'rt1', returnNo: 'RTN-301', soNumber: 'SO-20470', customer: 'Horizon Hotels Group', sku: 'SKU-10028', product: 'Cold Brew Coffee 250ml', batch: 'B720', returnedQty: 12, reusableQty: 8, damagedQty: 3, wastageQty: 1, qcResult: 'Partial', status: 'Decision Pending', reason: 'Near expiry preference', createdAt: '2026-09-07' },
  { id: 'rt2', returnNo: 'RTN-298', soNumber: 'SO-20455', customer: 'City Mart Retail', sku: 'SKU-10021', product: 'Organic Milk 1L', batch: 'B101', returnedQty: 24, reusableQty: 0, damagedQty: 20, wastageQty: 4, qcResult: 'Failed', status: 'Closed', reason: 'Temperature abuse', createdAt: '2026-09-01' },
  { id: 'rt3', returnNo: 'RTN-305', soNumber: 'SO-20482', customer: 'City Mart Retail', sku: 'SKU-10022', product: 'Basmati Rice 5kg', batch: 'B210', returnedQty: 2, reusableQty: 0, damagedQty: 0, wastageQty: 0, qcResult: 'Pending', status: 'Open', reason: 'Wrong SKU delivered', createdAt: '2026-09-08' },
]

export const tasks: Task[] = [
  { id: 't1', title: 'Complete put-away for B102 milk', type: 'Put-Away', warehouse: 'Mumbai Central', location: 'Receiving Dock', priority: 'High', status: 'Open', due: '2026-09-09', assignedTo: 'Suresh Yadav', createdBy: 'Ankit Verma', createdAt: '2026-09-08', description: 'Move accepted milk cartons to cold zone A.' },
  { id: 't2', title: 'QC inspection for produce B505', type: 'QC', warehouse: 'Nashik Warehouse', location: 'QC Bay', priority: 'Urgent', status: 'In Progress', due: '2026-09-09', assignedTo: 'Vikram Singh', createdBy: 'Rohit Pawar', createdAt: '2026-09-08', description: 'Inspect Fresh Produce Mix batch for quality defects.' },
  { id: 't3', title: 'Picklist PL-10231 for City Mart', type: 'Picking', warehouse: 'Mumbai Central', location: 'Zone A-B', priority: 'High', status: 'In Progress', due: '2026-09-09', assignedTo: 'Suresh Yadav', createdBy: 'Neha Kulkarni', createdAt: '2026-09-08', description: 'Complete remaining picks for SO-20482.' },
  { id: 't4', title: 'Cycle count Zone C oil racks', type: 'Audit', warehouse: 'Pune Distribution Center', location: 'C-R08', priority: 'Medium', status: 'Open', due: '2026-09-11', assignedTo: 'Anita Rao', createdBy: 'Neha Kulkarni', createdAt: '2026-09-07', description: 'Weekly cycle count for cooking oil locations.' },
  { id: 't5', title: 'Dispatch verification DSP-9018', type: 'Dispatch', warehouse: 'Mumbai Central', location: 'Dispatch Bay 2', priority: 'High', status: 'Blocked', due: '2026-09-09', assignedTo: 'Ganesh Patil', createdBy: 'Ankit Verma', createdAt: '2026-09-08', description: 'Barcode mismatch on 2 cartons — raise concern.' },
  { id: 't6', title: 'Receive GRN-8044 from ABC Foods', type: 'Receiving', warehouse: 'Mumbai Central', location: 'Dock 1', priority: 'Medium', status: 'Open', due: '2026-09-12', assignedTo: 'Suresh Yadav', createdBy: 'Neha Kulkarni', createdAt: '2026-09-08', description: 'Scheduled inbound for PO-10231.' },
  { id: 't7', title: 'Clear expired produce B506', type: 'General', warehouse: 'Mumbai Central', location: 'E-R05', priority: 'Urgent', status: 'Open', due: '2026-09-08', assignedTo: 'Pooja More', createdBy: 'Ankit Verma', createdAt: '2026-09-07', description: 'Move expired stock to wastage and update inventory.' },
]

export const users: AppUser[] = [
  { id: 'u1', name: 'Ankit Verma', email: 'ankit.verma@quickart.in', role: 'Warehouse Manager', warehouse: 'Mumbai Central', status: 'Active', lastActive: '2026-09-09T08:40:00' },
  { id: 'u2', name: 'Neha Kulkarni', email: 'neha.kulkarni@quickart.in', role: 'Procurement Lead', warehouse: 'Pune Distribution Center', status: 'Active', lastActive: '2026-09-09T09:05:00' },
  { id: 'u3', name: 'Suresh Yadav', email: 'suresh.yadav@quickart.in', role: 'Warehouse Operator', warehouse: 'Mumbai Central', status: 'Active', lastActive: '2026-09-09T08:55:00' },
  { id: 'u4', name: 'Vikram Singh', email: 'vikram.singh@quickart.in', role: 'QC Inspector', warehouse: 'Mumbai Central', status: 'Active', lastActive: '2026-09-08T17:20:00' },
  { id: 'u5', name: 'Deepa Iyer', email: 'deepa.iyer@quickart.in', role: 'Warehouse Manager', warehouse: 'Thane Cold Storage', status: 'Active', lastActive: '2026-09-08T16:10:00' },
  { id: 'u6', name: 'Anita Rao', email: 'anita.rao@quickart.in', role: 'Auditor', warehouse: 'Pune Distribution Center', status: 'Invited', lastActive: '' },
]

export const roles: Role[] = [
  { id: 'role1', name: 'Admin', description: 'Full system access', users: 2, permissions: ['all'] },
  { id: 'role2', name: 'Warehouse Manager', description: 'Manage warehouse operations and approvals', users: 3, permissions: ['inventory', 'receiving', 'qc', 'putaway', 'picking', 'dispatch', 'tasks', 'reports'] },
  { id: 'role3', name: 'Procurement Lead', description: 'Manage vendors and purchase orders', users: 2, permissions: ['vendors', 'purchase_orders', 'reports'] },
  { id: 'role4', name: 'Warehouse Operator', description: 'Execute receiving, put-away, and picking', users: 8, permissions: ['receiving', 'putaway', 'picking', 'tasks'] },
  { id: 'role5', name: 'QC Inspector', description: 'Perform quality inspections and RTV', users: 3, permissions: ['qc', 'returns', 'tasks'] },
  { id: 'role6', name: 'Auditor', description: 'Run inventory audits and view reports', users: 2, permissions: ['audits', 'reports', 'inventory'] },
]

export const notifications: NotificationItem[] = [
  { id: 'n1', title: 'Near-expiry alert', message: '12 batches expire within 14 days across Mumbai and Nashik.', type: 'warning', read: false, createdAt: '2026-09-09T07:15:00' },
  { id: 'n2', title: 'Delayed task', message: 'Task “Clear expired produce B506” is past SLA.', type: 'danger', read: false, createdAt: '2026-09-09T06:50:00' },
  { id: 'n3', title: 'PO approved', message: 'PO-10231 for ABC Foods is published and ready for receiving.', type: 'success', read: true, createdAt: '2026-09-08T18:20:00' },
  { id: 'n4', title: 'Low stock', message: 'SKU-10028 Cold Brew Coffee is below safety threshold at Thane.', type: 'warning', read: false, createdAt: '2026-09-08T14:05:00' },
  { id: 'n5', title: 'QC exception', message: 'QC-5518 requires RTV decision for damaged packaging.', type: 'info', read: true, createdAt: '2026-09-07T12:00:00' },
]

export const movements: StockMovement[] = [
  { id: 'm1', sku: 'SKU-10021', product: 'Organic Milk 1L', batch: 'B102', type: 'Inbound', qty: 200, fromLocation: 'Vendor Dock', toLocation: 'A-R12-S3-B04', reference: 'GRN-8035', performedBy: 'Suresh Yadav', performedAt: '2026-09-05T10:20:00' },
  { id: 'm2', sku: 'SKU-10022', product: 'Basmati Rice 5kg', batch: 'B210', type: 'Outbound', qty: 40, fromLocation: 'B-R04-S1-B12', toLocation: 'Dispatch Bay', reference: 'SO-20482', performedBy: 'Suresh Yadav', performedAt: '2026-09-08T09:10:00' },
  { id: 'm3', sku: 'SKU-10025', product: 'Fresh Produce Mix', batch: 'B505', type: 'Transfer', qty: 50, fromLocation: 'Receiving', toLocation: 'QC Hold', reference: 'QC-5521', performedBy: 'Pooja More', performedAt: '2026-09-08T11:00:00' },
  { id: 'm4', sku: 'SKU-10028', product: 'Cold Brew Coffee 250ml', batch: 'B720', type: 'Adjustment', qty: -4, fromLocation: 'F-R03-S1-B02', toLocation: 'Wastage', reference: 'ADJ-441', performedBy: 'Deepa Iyer', performedAt: '2026-09-06T16:45:00' },
  { id: 'm5', sku: 'SKU-10028', product: 'Cold Brew Coffee 250ml', batch: 'B720', type: 'Return', qty: 12, fromLocation: 'Customer', toLocation: 'Returns Bay', reference: 'RTN-301', performedBy: 'Vikram Singh', performedAt: '2026-09-07T13:30:00' },
]

export const audits: AuditRecord[] = [
  { id: 'a1', auditNo: 'AUD-441', warehouse: 'Pune Distribution Center', zone: 'C', status: 'Scheduled', varianceCount: 0, scheduledAt: '2026-09-11', auditor: 'Anita Rao' },
  { id: 'a2', auditNo: 'AUD-438', warehouse: 'Mumbai Central', zone: 'A', status: 'Completed', varianceCount: 2, scheduledAt: '2026-09-04', completedAt: '2026-09-04', auditor: 'Anita Rao' },
  { id: 'a3', auditNo: 'AUD-435', warehouse: 'Nashik Warehouse', zone: 'E', status: 'Variance', varianceCount: 5, scheduledAt: '2026-09-01', completedAt: '2026-09-02', auditor: 'Rohit Pawar' },
]

export const wastage: WastageRecord[] = [
  { id: 'wst1', sku: 'SKU-10025', product: 'Fresh Produce Mix', batch: 'B506', qty: 28, reason: 'Expired', warehouse: 'Mumbai Central', recordedBy: 'Pooja More', recordedAt: '2026-09-08', value: 2660 },
  { id: 'wst2', sku: 'SKU-10028', product: 'Cold Brew Coffee 250ml', batch: 'B720', qty: 4, reason: 'Damaged during handling', warehouse: 'Thane Cold Storage', recordedBy: 'Deepa Iyer', recordedAt: '2026-09-06', value: 700 },
  { id: 'wst3', sku: 'SKU-10021', product: 'Organic Milk 1L', batch: 'B101', qty: 24, reason: 'Temperature abuse return', warehouse: 'Mumbai Central', recordedBy: 'Vikram Singh', recordedAt: '2026-09-01', value: 1632 },
]

export const permissionMatrix = [
  { module: 'Dashboard', admin: true, manager: true, procurement: true, operator: true, qc: true, auditor: true },
  { module: 'Inventory', admin: true, manager: true, procurement: true, operator: true, qc: true, auditor: true },
  { module: 'Purchase Orders', admin: true, manager: true, procurement: true, operator: false, qc: false, auditor: false },
  { module: 'Receiving', admin: true, manager: true, procurement: false, operator: true, qc: false, auditor: false },
  { module: 'QC', admin: true, manager: true, procurement: false, operator: false, qc: true, auditor: false },
  { module: 'Picking', admin: true, manager: true, procurement: false, operator: true, qc: false, auditor: false },
  { module: 'Dispatch', admin: true, manager: true, procurement: false, operator: true, qc: false, auditor: false },
  { module: 'Reports', admin: true, manager: true, procurement: true, operator: false, qc: true, auditor: true },
  { module: 'Users & Roles', admin: true, manager: false, procurement: false, operator: false, qc: false, auditor: false },
  { module: 'Settings', admin: true, manager: true, procurement: false, operator: false, qc: false, auditor: false },
]

export const approvalHistory: ApprovalHistoryItem[] = [
  { id: 'ah1', poNumber: 'PO-10231', poId: 'po1', vendor: 'ABC Foods', amount: 84200, action: 'Approved', actedBy: 'Ankit Verma', actedAt: '2026-09-01T16:20:00', notes: 'Within budget · dairy replenishment' },
  { id: 'ah2', poNumber: 'PO-10228', poId: 'po3', vendor: 'FreshMart Supply', amount: 62800, action: 'Approved', actedBy: 'Neha Kulkarni', actedAt: '2026-08-28T11:05:00', notes: 'Urgent cold-brew restock' },
  { id: 'ah3', poNumber: 'PO-10220', poId: 'po4', vendor: 'Green Valley Farms', amount: 28500, action: 'Approved', actedBy: 'Rohit Pawar', actedAt: '2026-08-20T09:40:00', notes: 'Produce weekly cycle' },
  { id: 'ah4', poNumber: 'PO-10215', poId: 'po4', vendor: 'Metro Wholesale', amount: 54000, action: 'Rejected', actedBy: 'Ankit Verma', actedAt: '2026-08-18T14:10:00', notes: 'Vendor on hold · pricing mismatch' },
  { id: 'ah5', poNumber: 'PO-10232', poId: 'po2', vendor: 'Prime Distributors', amount: 41600, action: 'Submitted', actedBy: 'Ankit Verma', actedAt: '2026-09-03T10:15:00', notes: 'Awaiting manager approval' },
]

export const zohoSyncHistory: ZohoSyncRecord[] = [
  { id: 'zs1', poNumber: 'PO-10231', direction: 'Push', status: 'Synced', message: 'PO published to Zoho Books', syncedAt: '2026-09-01T16:25:00', attempts: 1 },
  { id: 'zs2', poNumber: 'PO-10228', direction: 'Push', status: 'Synced', message: 'Line items and tax mapped', syncedAt: '2026-08-28T11:12:00', attempts: 1 },
  { id: 'zs3', poNumber: 'PO-10232', direction: 'Push', status: 'Pending', message: 'Waiting for approval before sync', syncedAt: '2026-09-03T10:16:00', attempts: 0 },
  { id: 'zs4', poNumber: 'PO-10220', direction: 'Pull', status: 'Synced', message: 'Vendor bill status refreshed', syncedAt: '2026-08-30T18:00:00', attempts: 1 },
  { id: 'zs5', poNumber: 'PO-10210', direction: 'Push', status: 'Failed', message: 'Zoho API timeout · retry scheduled', syncedAt: '2026-08-12T09:22:00', attempts: 3 },
  { id: 'zs6', poNumber: 'PO-10235', direction: 'Push', status: 'Pending', message: 'Draft not linked to Zoho', syncedAt: '2026-09-07T08:00:00', attempts: 0 },
]
