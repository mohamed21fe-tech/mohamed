import {
  Category,
  Order,
  OrderItem,
  OrderStatus,
  Printer,
  Product,
  RestaurantDatabase,
  RestaurantSettings,
  RestaurantTable,
  User,
} from '../types';

const STORAGE_KEY_PRODUCTS = 'alshami_cached_products';
const STORAGE_KEY_CATEGORIES = 'alshami_cached_categories';
const STORAGE_KEY_TABLES = 'alshami_cached_tables';
const STORAGE_KEY_PENDING_ORDER = 'alshami_pending_cart';

export const api = {
  // --- Auth ---
  async login(identifier: string): Promise<{ success: boolean; user: User; error?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'فشل تسجيل الدخول');
    }
    return data;
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/auth/users');
    return res.json();
  },

  async saveUser(user: Partial<User>): Promise<User> {
    const res = await fetch('/api/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return res.json();
  },

  // --- Tables ---
  async getTables(): Promise<RestaurantTable[]> {
    try {
      const res = await fetch('/api/tables');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEY_TABLES, JSON.stringify(data));
        return data;
      }
    } catch {
      // Offline fallback
      const cached = localStorage.getItem(STORAGE_KEY_TABLES);
      if (cached) return JSON.parse(cached);
    }
    return [];
  },

  async saveTable(table: Partial<RestaurantTable>): Promise<RestaurantTable> {
    const res = await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(table),
    });
    return res.json();
  },

  async transferTable(sourceTableId: string, targetTableId: string, waiterName: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/tables/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceTableId, targetTableId, waiterName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل نقل الطاولة');
    return data;
  },

  async mergeTables(sourceTableId: string, targetTableId: string, waiterName: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/tables/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceTableId, targetTableId, waiterName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل دمج الطاولات');
    return data;
  },

  // --- Categories & Products ---
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(data));
        return data;
      }
    } catch {
      const cached = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (cached) return JSON.parse(cached);
    }
    return [];
  },

  async saveCategory(category: Partial<Category>): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return res.json();
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(data));
        return data;
      }
    } catch {
      const cached = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (cached) return JSON.parse(cached);
    }
    return [];
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return res.json();
  },

  async toggleProductAvailability(id: string, isAvailable: boolean): Promise<Product> {
    const res = await fetch(`/api/products/${id}/availability`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable }),
    });
    return res.json();
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // --- Orders ---
  async getOrders(params: { status?: string; tableId?: string; search?: string } = {}): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.tableId) query.set('tableId', params.tableId);
    if (params.search) query.set('search', params.search);

    const res = await fetch(`/api/orders?${query.toString()}`);
    return res.json();
  },

  async getKitchenOrders(): Promise<Order[]> {
    const res = await fetch('/api/kitchen/orders');
    return res.json();
  },

  async getOrderEvents(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/events`);
    return res.json();
  },

  async submitOrder(payload: {
    tableId: string;
    waiterId: string;
    waiterName: string;
    guestCount?: number;
    items: OrderItem[];
    customerNotes?: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; order: Order; isNew: boolean; isAppended: boolean }> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'فشل إرسال الطلب للمطبخ');
    }
    // Clear local pending cart on success
    localStorage.removeItem(STORAGE_KEY_PENDING_ORDER);
    return data;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, userName: string): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, userName }),
    });
    return res.json();
  },

  async updateItemStatus(orderId: string, itemId: string, status: string): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/item-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, status }),
    });
    return res.json();
  },

  async cancelOrder(orderId: string, reason: string, userName: string, userRole: string) {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, userName, userRole }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل إلغاء الطلب');
    return data;
  },

  // --- Printers ---
  async getPrinters(): Promise<Printer[]> {
    const res = await fetch('/api/printers');
    return res.json();
  },

  async savePrinter(printer: Partial<Printer>): Promise<Printer> {
    const res = await fetch('/api/printers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(printer),
    });
    return res.json();
  },

  async deletePrinter(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/printers/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async testNetworkPrinter(printerId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/printer/test-network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printerId }),
    });
    return res.json();
  },

  async printOrderNetwork(orderId: string, printerId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/printer/print-order-network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, printerId }),
    });
    return res.json();
  },

  async getTicketPreview(orderId: string, width: '58mm' | '80mm' = '80mm', station = 'ALL', isUpdate = false) {
    const res = await fetch(`/api/printer/ticket/${orderId}?width=${width}&station=${station}&isUpdate=${isUpdate}`);
    return res.json();
  },

  // --- Settings & Reports ---
  async getSettings(): Promise<RestaurantSettings> {
    const res = await fetch('/api/settings');
    return res.json();
  },

  async updateSettings(settings: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async getReports() {
    const res = await fetch('/api/reports');
    return res.json();
  },

  async getAuditLogs() {
    const res = await fetch('/api/audit-logs');
    return res.json();
  },

  async exportBackup(): Promise<RestaurantDatabase> {
    const res = await fetch('/api/backup/export');
    return res.json();
  },

  async restoreBackup(data: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // --- Local Cart Cache Helpers ---
  saveLocalPendingCart(cart: any) {
    try {
      localStorage.setItem(STORAGE_KEY_PENDING_ORDER, JSON.stringify(cart));
    } catch {
      // ignore
    }
  },

  getLocalPendingCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PENDING_ORDER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearLocalPendingCart() {
    try {
      localStorage.removeItem(STORAGE_KEY_PENDING_ORDER);
    } catch {
      // ignore
    }
  },
};
