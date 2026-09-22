/**
 * Shared Type Definitions for Baitna Al-Shami Restaurant Order Management System
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'WAITER' | 'KITCHEN' | 'CASHIER';

export interface User {
  id: string;
  username: string;
  name: string;
  pin: string; // 4-digit fast login PIN
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export type TableStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'ORDERING'
  | 'PREPARING'
  | 'READY'
  | 'BILL_REQUESTED'
  | 'PAID';

export interface RestaurantTable {
  id: string;
  number: number;
  nameAr: string;
  nameEn: string;
  seats: number;
  zone: string; // e.g. 'أرض الديار (Damascus Courtyard)', 'الصالة الرئيسية', 'التراس (Terrace)', 'صالة العائلات'
  status: TableStatus;
  currentOrderId?: string;
  currentOrderNumber?: number;
  assignedWaiterId?: string;
  assignedWaiterName?: string;
  orderAmount: number;
  openedAt?: string;
  updatedAt: string;
}

export interface KitchenStation {
  id: string;
  code: string; // 'GRILL' | 'HOT_FOOD' | 'APPETIZERS' | 'DRINKS' | 'DESSERTS'
  nameAr: string;
  nameEn: string;
  icon?: string;
  sortOrder: number;
}

export interface ModifierOption {
  id: string;
  nameAr: string;
  nameEn: string;
  priceDelta: number; // in SYP
}

export interface ProductModifier {
  id: string;
  nameAr: string;
  nameEn: string;
  required: boolean;
  multiSelect: boolean;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number; // in SYP
  categoryId: string;
  stationId: string; // Maps to KitchenStation
  prepTimeMinutes: number;
  isAvailable: boolean;
  image?: string;
  sku: string;
  modifiers: ProductModifier[];
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  sortOrder: number;
  stationId?: string;
}

export interface SelectedItemModifier {
  modifierId: string;
  modifierNameAr: string;
  modifierNameEn: string;
  optionId: string;
  optionNameAr: string;
  optionNameEn: string;
  priceDelta: number;
}

export type ItemPrepStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';

export interface OrderItem {
  id: string;
  productId: string;
  productNameAr: string;
  productNameEn: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  stationId: string;
  selectedModifiers: SelectedItemModifier[];
  notes?: string;
  status: ItemPrepStatus;
  roundNumber: number;
  isModification?: boolean;
  image?: string;
}

export type OrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'PAID'
  | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: number; // e.g. 1048
  tableId: string;
  tableNumber: number;
  tableName: string;
  waiterId: string;
  waiterName: string;
  guestCount: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  customerNotes?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  roundsCount: number;
  printedStations: string[];
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  servedAt?: string;
  paidAt?: string;
}

export type OrderEventType =
  | 'CREATED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'PAID'
  | 'CANCELLED'
  | 'MODIFIED'
  | 'PRINTED'
  | 'TRANSFERRED'
  | 'MERGED';

export interface OrderEvent {
  id: string;
  orderId: string;
  orderNumber: number;
  eventType: OrderEventType;
  descriptionAr: string;
  descriptionEn: string;
  userName: string;
  userId?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface Printer {
  id: string;
  name: string;
  ip: string;
  port: number; // default 9100
  type: 'NETWORK' | 'BROWSER';
  paperWidth: '58mm' | '80mm';
  stationId: string; // 'ALL' or station code like 'GRILL', 'DRINKS'
  isActive: boolean;
  lastStatus?: 'ONLINE' | 'OFFLINE' | 'PRINTING' | 'ERROR';
  lastError?: string;
  lastPrintedAt?: string;
}

export interface RestaurantSettings {
  restaurantNameAr: string;
  restaurantNameEn: string;
  logoUrl?: string;
  phone: string;
  addressAr: string;
  addressEn: string;
  currency: string;
  currencySymbol: string;
  taxPercentage: number;
  enableKitchenSound: boolean;
  autoPrintOnSubmit: boolean;
  serverLocalIp: string;
  serverPort: number;
  primaryLanguage: 'ar' | 'en';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  detailsAr: string;
  detailsEn: string;
  timestamp: string;
}

export interface RestaurantDatabase {
  users: User[];
  tables: RestaurantTable[];
  categories: Category[];
  products: Product[];
  kitchenStations: KitchenStation[];
  orders: Order[];
  orderEvents: OrderEvent[];
  printers: Printer[];
  settings: RestaurantSettings;
  auditLogs: AuditLog[];
  nextOrderNumber: number;
}
