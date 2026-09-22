import fs from 'node:fs';
import path from 'node:path';
import {
  AuditLog,
  Category,
  KitchenStation,
  Order,
  OrderEvent,
  OrderItem,
  OrderStatus,
  Printer,
  Product,
  RestaurantDatabase,
  RestaurantSettings,
  RestaurantTable,
  User,
} from '../src/types';
import { initialDatabase } from './seedData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'restaurant-db.json');
const TMP_FILE = path.join(DATA_DIR, 'restaurant-db.tmp.json');

export const PRODUCT_PHOTOS: Record<string, string> = {
  'prd-shish-tawook': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
  'prd-kebab-halabi': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  'prd-mixed-grill': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80',
  'prd-hummus': 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=600&q=80',
  'prd-mutabbal': 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=600&q=80',
  'prd-fattoush': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  'prd-tabbouleh': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
  'prd-yabraq': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
  'prd-kibbeh-fried': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  'prd-fatteh-hummus': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
  'prd-fatteh-makdous': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
  'prd-shawarma-chicken': 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80',
  'prd-lemon-mint': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  'prd-cola': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
  'prd-arabic-coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  'prd-baklava': 'https://images.unsplash.com/photo-1597528662465-55ece5734101?auto=format&fit=crop&w=600&q=80',
};

const CATEGORY_FALLBACK_PHOTOS: Record<string, string> = {
  'cat-grills': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
  'cat-fatteh': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
  'cat-shawarma': 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80',
  'cat-mezze-cold': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  'cat-mezze-hot': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  'cat-salads': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  'cat-sweets': 'https://images.unsplash.com/photo-1597528662465-55ece5734101?auto=format&fit=crop&w=600&q=80',
  'cat-cold-drinks': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  'cat-hot-drinks': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
};

function enrichWithPhotos(dbState: RestaurantDatabase) {
  for (const prod of dbState.products) {
    if (!prod.image) {
      prod.image = PRODUCT_PHOTOS[prod.id] || CATEGORY_FALLBACK_PHOTOS[prod.categoryId] || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80';
    }
  }
  for (const ord of dbState.orders) {
    for (const item of ord.items) {
      if (!item.image) {
        const p = dbState.products.find((x) => x.id === item.productId);
        item.image = p?.image || PRODUCT_PHOTOS[item.productId] || CATEGORY_FALLBACK_PHOTOS[p?.categoryId || ''] || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80';
      }
    }
  }
}

class DatabaseEngine {
  private data: RestaurantDatabase;
  private isSaving = false;
  private savePending = false;

  constructor() {
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): RestaurantDatabase {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as RestaurantDatabase;
        if (parsed && Array.isArray(parsed.orders) && Array.isArray(parsed.products)) {
          enrichWithPhotos(parsed);
          return parsed;
        }
      }
    } catch (err) {
      console.error('[DB] Error reading existing DB file, falling back to seed data:', err);
    }

    // Default to seed data
    const seedCopy: RestaurantDatabase = JSON.parse(JSON.stringify(initialDatabase));
    enrichWithPhotos(seedCopy);
    this.persistSync(seedCopy);
    return seedCopy;
  }

  private persistSync(dbState: RestaurantDatabase) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(TMP_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
      fs.renameSync(TMP_FILE, DB_FILE);
    } catch (err) {
      console.error('[DB] Failed to persist data to disk:', err);
    }
  }

  public async save(): Promise<void> {
    if (this.isSaving) {
      this.savePending = true;
      return;
    }

    this.isSaving = true;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const serialized = JSON.stringify(this.data, null, 2);
      await fs.promises.writeFile(TMP_FILE, serialized, 'utf-8');
      await fs.promises.rename(TMP_FILE, DB_FILE);
    } catch (err) {
      console.error('[DB] Error during async save:', err);
    } finally {
      this.isSaving = false;
      if (this.savePending) {
        this.savePending = false;
        await this.save();
      }
    }
  }

  public getRawDatabase(): RestaurantDatabase {
    return this.data;
  }

  // --- Auth & Users ---
  public findUserByPinOrUsername(identifier: string): User | undefined {
    const trimmed = identifier.trim();
    return this.data.users.find(
      (u) => u.active && (u.pin === trimmed || u.username.toLowerCase() === trimmed.toLowerCase())
    );
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public saveUser(user: User): User {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.save();
    return user;
  }

  // --- Tables ---
  public getTables(): RestaurantTable[] {
    return this.data.tables;
  }

  public getTableById(id: string): RestaurantTable | undefined {
    return this.data.tables.find((t) => t.id === id);
  }

  public saveTable(table: RestaurantTable): RestaurantTable {
    const idx = this.data.tables.findIndex((t) => t.id === table.id);
    table.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.data.tables[idx] = table;
    } else {
      this.data.tables.push(table);
    }
    this.save();
    return table;
  }

  public transferTable(sourceId: string, targetId: string, waiterName: string): { success: boolean; message: string } {
    const source = this.data.tables.find((t) => t.id === sourceId);
    const target = this.data.tables.find((t) => t.id === targetId);

    if (!source || !target) {
      return { success: false, message: 'إحدى الطاولات غير موجودة' };
    }

    if (!source.currentOrderId) {
      return { success: false, message: 'الطاولة المصدر ليس لديها طلب نشط لنقله' };
    }

    if (target.status !== 'AVAILABLE' && target.currentOrderId) {
      return { success: false, message: 'الطاولة الهدف مشغولة بطلب آخر. يرجى استخدام دمج الطاولات بدلاً من النقل.' };
    }

    const order = this.data.orders.find((o) => o.id === source.currentOrderId);
    if (order) {
      order.tableId = target.id;
      order.tableNumber = target.number;
      order.tableName = target.nameAr;
      order.updatedAt = new Date().toISOString();

      this.addOrderEvent(
        order.id,
        order.orderNumber,
        'TRANSFERRED',
        `تم نقل الطلب من طاولة ${source.number} إلى طاولة ${target.number}`,
        `Transferred order from Table ${source.number} to Table ${target.number}`,
        waiterName
      );
    }

    // Update target
    target.status = source.status;
    target.currentOrderId = source.currentOrderId;
    target.currentOrderNumber = source.currentOrderNumber;
    target.assignedWaiterId = source.assignedWaiterId;
    target.assignedWaiterName = source.assignedWaiterName;
    target.orderAmount = source.orderAmount;
    target.openedAt = source.openedAt;
    target.updatedAt = new Date().toISOString();

    // Reset source
    source.status = 'AVAILABLE';
    source.currentOrderId = undefined;
    source.currentOrderNumber = undefined;
    source.assignedWaiterId = undefined;
    source.assignedWaiterName = undefined;
    source.orderAmount = 0;
    source.openedAt = undefined;
    source.updatedAt = new Date().toISOString();

    this.save();
    return { success: true, message: `تم نقل طاولة ${source.number} بنجاح إلى طاولة ${target.number}` };
  }

  public mergeTables(sourceId: string, targetId: string, waiterName: string): { success: boolean; message: string } {
    const source = this.data.tables.find((t) => t.id === sourceId);
    const target = this.data.tables.find((t) => t.id === targetId);

    if (!source || !target) {
      return { success: false, message: 'الطاولة غير موجودة' };
    }

    const sourceOrder = this.data.orders.find((o) => o.id === source.currentOrderId);
    const targetOrder = this.data.orders.find((o) => o.id === target.currentOrderId);

    if (!sourceOrder || !targetOrder) {
      return { success: false, message: 'كلا الطاولتين يجب أن تحتوي على طلب نشط للدمج' };
    }

    // Append source items into target order
    const nextRound = targetOrder.roundsCount + 1;
    for (const item of sourceOrder.items) {
      targetOrder.items.push({
        ...item,
        roundNumber: nextRound,
        isModification: true,
      });
    }

    targetOrder.roundsCount = nextRound;
    targetOrder.subtotal += sourceOrder.subtotal;
    targetOrder.total += sourceOrder.total;
    targetOrder.updatedAt = new Date().toISOString();

    // Mark source order as merged/cancelled
    sourceOrder.status = 'CANCELLED';
    sourceOrder.cancellationReason = `تم دمج هذا الطلب مع الطلب #${targetOrder.orderNumber} على طاولة ${target.number}`;
    sourceOrder.updatedAt = new Date().toISOString();

    this.addOrderEvent(
      targetOrder.id,
      targetOrder.orderNumber,
      'MERGED',
      `تم دمج طلب طاولة ${source.number} (#${sourceOrder.orderNumber}) في هذا الطلب`,
      `Merged order #${sourceOrder.orderNumber} from Table ${source.number}`,
      waiterName
    );

    // Free source table
    source.status = 'AVAILABLE';
    source.currentOrderId = undefined;
    source.currentOrderNumber = undefined;
    source.orderAmount = 0;
    source.openedAt = undefined;

    // Update target table amount
    target.orderAmount = targetOrder.total;

    this.save();
    return { success: true, message: `تم دمج طاولة ${source.number} مع طاولة ${target.number} بنجاح` };
  }

  // --- Categories & Products ---
  public getCategories(): Category[] {
    return this.data.categories.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public saveCategory(category: Category): Category {
    const idx = this.data.categories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      this.data.categories[idx] = category;
    } else {
      this.data.categories.push(category);
    }
    this.save();
    return category;
  }

  public deleteCategory(id: string): boolean {
    const before = this.data.categories.length;
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    if (this.data.categories.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  public getProducts(): Product[] {
    return this.data.products;
  }

  public saveProduct(product: Product): Product {
    const idx = this.data.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.data.products[idx] = product;
    } else {
      this.data.products.push(product);
    }
    this.save();
    return product;
  }

  public deleteProduct(id: string): boolean {
    const before = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  public getStations(): KitchenStation[] {
    return this.data.kitchenStations.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // --- Orders ---
  public getOrders(filters: {
    status?: string;
    tableId?: string;
    waiterId?: string;
    date?: string;
    search?: string;
  } = {}): Order[] {
    let list = this.data.orders;

    if (filters.status) {
      list = list.filter((o) => o.status === filters.status);
    }
    if (filters.tableId) {
      list = list.filter((o) => o.tableId === filters.tableId);
    }
    if (filters.waiterId) {
      list = list.filter((o) => o.waiterId === filters.waiterId);
    }
    if (filters.date) {
      list = list.filter((o) => o.createdAt.startsWith(filters.date!));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toString().includes(q) ||
          o.tableName.toLowerCase().includes(q) ||
          o.waiterName.toLowerCase().includes(q) ||
          o.items.some((it) => it.productNameAr.includes(q) || it.productNameEn.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  public getOrderByNumber(orderNumber: number): Order | undefined {
    return this.data.orders.find((o) => o.orderNumber === orderNumber);
  }

  /**
   * Creates a new order or updates existing table order round.
   * Guarantees idempotency via idempotencyKey.
   */
  public createOrAppendOrder(payload: {
    tableId: string;
    waiterId: string;
    waiterName: string;
    guestCount?: number;
    items: OrderItem[];
    customerNotes?: string;
    idempotencyKey?: string;
  }): { order: Order; isNew: boolean; isAppended: boolean } {
    const table = this.data.tables.find((t) => t.id === payload.tableId);
    if (!table) {
      throw new Error('الطاولة المحددة غير موجودة');
    }

    // 1. Check idempotency
    if (payload.idempotencyKey) {
      const existing = this.data.orders.find((o) => o.idempotencyKey === payload.idempotencyKey);
      if (existing) {
        return { order: existing, isNew: false, isAppended: false };
      }
    }

    // 2. Check if table already has an active order to append a round to
    if (table.currentOrderId) {
      const existingOrder = this.data.orders.find(
        (o) => o.id === table.currentOrderId && !['PAID', 'CANCELLED'].includes(o.status)
      );

      if (existingOrder) {
        const nextRound = existingOrder.roundsCount + 1;
        const newItemsToAdd = payload.items.map((it) => {
          const prod = this.data.products.find((p) => p.id === it.productId);
          return {
            ...it,
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            roundNumber: nextRound,
            status: 'PENDING' as const,
            isModification: true,
            image: it.image || prod?.image || PRODUCT_PHOTOS[it.productId] || CATEGORY_FALLBACK_PHOTOS[prod?.categoryId || ''],
          };
        });

        existingOrder.items.push(...newItemsToAdd);
        existingOrder.roundsCount = nextRound;

        // Recalculate totals
        const newSubtotal = existingOrder.items.reduce((sum, it) => sum + it.totalPrice, 0);
        existingOrder.subtotal = newSubtotal;
        existingOrder.total = newSubtotal + existingOrder.tax - existingOrder.discount;
        existingOrder.status = 'PREPARING';
        existingOrder.updatedAt = new Date().toISOString();
        if (payload.customerNotes) {
          existingOrder.customerNotes = payload.customerNotes;
        }

        // Table updates
        table.status = 'PREPARING';
        table.orderAmount = existingOrder.total;
        table.updatedAt = new Date().toISOString();

        this.addOrderEvent(
          existingOrder.id,
          existingOrder.orderNumber,
          'MODIFIED',
          `تمت إضافة جولة جديدة (${newItemsToAdd.length} أصناف) بواسطة ${payload.waiterName}`,
          `Added new order round (${newItemsToAdd.length} items) by ${payload.waiterName}`,
          payload.waiterName,
          payload.waiterId
        );

        this.save();
        return { order: existingOrder, isNew: false, isAppended: true };
      }
    }

    // 3. New order creation
    const orderNumber = this.data.nextOrderNumber++;
    const now = new Date().toISOString();

    const subtotal = payload.items.reduce((sum, it) => sum + it.totalPrice, 0);
    const tax = Math.round((subtotal * this.data.settings.taxPercentage) / 100);
    const total = subtotal + tax;

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      orderNumber,
      tableId: table.id,
      tableNumber: table.number,
      tableName: table.nameAr,
      waiterId: payload.waiterId,
      waiterName: payload.waiterName,
      guestCount: payload.guestCount || table.seats,
      status: 'NEW',
      items: payload.items.map((it) => {
        const prod = this.data.products.find((p) => p.id === it.productId);
        return {
          ...it,
          id: it.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          roundNumber: 1,
          status: 'PENDING' as const,
          image: it.image || prod?.image || PRODUCT_PHOTOS[it.productId] || CATEGORY_FALLBACK_PHOTOS[prod?.categoryId || ''],
        };
      }),
      subtotal,
      tax,
      discount: 0,
      total,
      customerNotes: payload.customerNotes || '',
      roundsCount: 1,
      printedStations: [],
      idempotencyKey: payload.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };

    this.data.orders.push(newOrder);

    // Bind table
    table.status = 'PREPARING';
    table.currentOrderId = newOrder.id;
    table.currentOrderNumber = newOrder.orderNumber;
    table.assignedWaiterId = payload.waiterId;
    table.assignedWaiterName = payload.waiterName;
    table.orderAmount = newOrder.total;
    table.openedAt = now;
    table.updatedAt = now;

    this.addOrderEvent(
      newOrder.id,
      newOrder.orderNumber,
      'CREATED',
      `تم إنشاء الطلب #${newOrder.orderNumber} لطاولة ${table.number} بواسطة ${payload.waiterName}`,
      `Created order #${newOrder.orderNumber} for Table ${table.number} by ${payload.waiterName}`,
      payload.waiterName,
      payload.waiterId
    );

    this.save();
    return { order: newOrder, isNew: true, isAppended: false };
  }

  public updateOrderStatus(orderId: string, status: OrderStatus, userName: string, userId?: string): Order | undefined {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return undefined;

    const prevStatus = order.status;
    order.status = status;
    const now = new Date().toISOString();
    order.updatedAt = now;

    if (status === 'ACCEPTED' && !order.acceptedAt) order.acceptedAt = now;
    if (status === 'PREPARING' && !order.preparingAt) order.preparingAt = now;
    if (status === 'READY') {
      if (!order.readyAt) order.readyAt = now;
      // Also mark all items as ready
      order.items.forEach((it) => (it.status = 'READY'));
    }
    if (status === 'SERVED') {
      if (!order.servedAt) order.servedAt = now;
      order.items.forEach((it) => (it.status = 'SERVED'));
    }
    if (status === 'PAID') {
      if (!order.paidAt) order.paidAt = now;
    }

    // Update table status
    const table = this.data.tables.find((t) => t.id === order.tableId);
    if (table) {
      if (status === 'ACCEPTED' || status === 'PREPARING') table.status = 'PREPARING';
      if (status === 'READY') table.status = 'READY';
      if (status === 'SERVED') table.status = 'OCCUPIED';
      if (status === 'PAID') {
        table.status = 'AVAILABLE';
        table.currentOrderId = undefined;
        table.currentOrderNumber = undefined;
        table.assignedWaiterId = undefined;
        table.assignedWaiterName = undefined;
        table.orderAmount = 0;
        table.openedAt = undefined;
      }
      table.updatedAt = now;
    }

    this.addOrderEvent(
      order.id,
      order.orderNumber,
      status as any,
      `تم تغيير حالة الطلب من [${prevStatus}] إلى [${status}] بواسطة ${userName}`,
      `Order status updated from [${prevStatus}] to [${status}] by ${userName}`,
      userName,
      userId
    );

    this.save();
    return order;
  }

  public updateOrderItemStatus(orderId: string, itemId: string, itemStatus: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED'): Order | undefined {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return undefined;

    const item = order.items.find((it) => it.id === itemId);
    if (item) {
      item.status = itemStatus;
      order.updatedAt = new Date().toISOString();

      // If all items are ready, set order status to READY
      if (order.items.every((it) => it.status === 'READY' || it.status === 'SERVED')) {
        order.status = 'READY';
        const table = this.data.tables.find((t) => t.id === order.tableId);
        if (table) table.status = 'READY';
      }

      this.save();
    }
    return order;
  }

  public cancelOrder(orderId: string, reason: string, userName: string, userRole: string): { success: boolean; message: string; order?: Order } {
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return { success: false, message: 'صلاحية إلغاء الطلب محصورة بمدير الصالة أو المدير العام فقط' };
    }

    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, message: 'الطلب غير موجود' };
    }

    if (order.status === 'PAID') {
      return { success: false, message: 'لا يمكن إلغاء طلب مدفوع ومغلق' };
    }

    order.status = 'CANCELLED';
    order.cancellationReason = reason || 'تم الإلغاء بواسطة المدير';
    order.cancelledBy = userName;
    order.updatedAt = new Date().toISOString();

    const table = this.data.tables.find((t) => t.id === order.tableId);
    if (table && table.currentOrderId === order.id) {
      table.status = 'AVAILABLE';
      table.currentOrderId = undefined;
      table.currentOrderNumber = undefined;
      table.assignedWaiterId = undefined;
      table.assignedWaiterName = undefined;
      table.orderAmount = 0;
      table.openedAt = undefined;
      table.updatedAt = new Date().toISOString();
    }

    this.addOrderEvent(
      order.id,
      order.orderNumber,
      'CANCELLED',
      `تم إلغاء الطلب بواسطة ${userName}. السبب: ${reason}`,
      `Order cancelled by ${userName}. Reason: ${reason}`,
      userName
    );

    this.save();
    return { success: true, message: `تم إلغاء الطلب #${order.orderNumber} بنجاح`, order };
  }

  // --- Order Events ---
  public addOrderEvent(
    orderId: string,
    orderNumber: number,
    eventType: any,
    descriptionAr: string,
    descriptionEn: string,
    userName: string,
    userId?: string,
    meta?: Record<string, unknown>
  ): OrderEvent {
    const event: OrderEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      orderId,
      orderNumber,
      eventType,
      descriptionAr,
      descriptionEn,
      userName,
      userId,
      timestamp: new Date().toISOString(),
      meta,
    };
    this.data.orderEvents.push(event);
    return event;
  }

  public getOrderEvents(orderId: string): OrderEvent[] {
    return this.data.orderEvents
      .filter((e) => e.orderId === orderId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // --- Printers ---
  public getPrinters(): Printer[] {
    return this.data.printers;
  }

  public savePrinter(printer: Printer): Printer {
    const idx = this.data.printers.findIndex((p) => p.id === printer.id);
    if (idx >= 0) {
      this.data.printers[idx] = printer;
    } else {
      this.data.printers.push(printer);
    }
    this.save();
    return printer;
  }

  public deletePrinter(id: string): boolean {
    const before = this.data.printers.length;
    this.data.printers = this.data.printers.filter((p) => p.id !== id);
    if (this.data.printers.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Settings ---
  public getSettings(): RestaurantSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<RestaurantSettings>): RestaurantSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  // --- Audit Logs ---
  public logAudit(userId: string, userName: string, userRole: string, action: string, detailsAr: string, detailsEn: string) {
    this.data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId,
      userName,
      userRole,
      action,
      detailsAr,
      detailsEn,
      timestamp: new Date().toISOString(),
    });
    // Keep max 500 logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- Reports ---
  public getReportsSummary() {
    const orders = this.data.orders;
    const paidOrders = orders.filter((o) => o.status === 'PAID');
    const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const activeOrders = orders.filter((o) => !['PAID', 'CANCELLED'].includes(o.status));
    const openTables = this.data.tables.filter((t) => t.status !== 'AVAILABLE');

    // Popular items
    const itemMap: Record<string, { nameAr: string; nameEn: string; qty: number; revenue: number }> = {};
    for (const ord of paidOrders) {
      for (const it of ord.items) {
        if (!itemMap[it.productId]) {
          itemMap[it.productId] = {
            nameAr: it.productNameAr,
            nameEn: it.productNameEn,
            qty: 0,
            revenue: 0,
          };
        }
        itemMap[it.productId].qty += it.quantity;
        itemMap[it.productId].revenue += it.totalPrice;
      }
    }

    const popularProducts = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 8);

    // Sales by waiter
    const waiterMap: Record<string, { name: string; count: number; total: number }> = {};
    for (const ord of paidOrders) {
      if (!waiterMap[ord.waiterName]) {
        waiterMap[ord.waiterName] = { name: ord.waiterName, count: 0, total: 0 };
      }
      waiterMap[ord.waiterName].count += 1;
      waiterMap[ord.waiterName].total += ord.total;
    }

    return {
      totalSales,
      ordersCount: orders.length,
      paidOrdersCount: paidOrders.length,
      activeOrdersCount: activeOrders.length,
      openTablesCount: openTables.length,
      totalTablesCount: this.data.tables.length,
      avgOrderValue: paidOrders.length > 0 ? Math.round(totalSales / paidOrders.length) : 0,
      popularProducts,
      salesByWaiter: Object.values(waiterMap),
    };
  }

  // --- Backup & Restore ---
  public exportBackup(): RestaurantDatabase {
    return JSON.parse(JSON.stringify(this.data));
  }

  public importBackup(incoming: Partial<RestaurantDatabase>): boolean {
    if (!incoming || !Array.isArray(incoming.users) || !Array.isArray(incoming.products)) {
      return false;
    }
    this.data = incoming as RestaurantDatabase;
    this.persistSync(this.data);
    return true;
  }
}

export const db = new DatabaseEngine();
