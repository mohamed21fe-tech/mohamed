import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Category,
  KitchenStation,
  Order,
  OrderItem,
  Printer,
  Product,
  RestaurantSettings,
  RestaurantTable,
  SelectedItemModifier,
} from '../types';
import { api } from '../services/api';
import { playKitchenOrderChime, playSuccessDing } from '../lib/soundAlerts';
import { getProductImage } from '../lib/foodImages';
import { useAuth } from './AuthContext';

export interface CartItem extends OrderItem {}

interface RestaurantContextType {
  tables: RestaurantTable[];
  categories: Category[];
  products: Product[];
  stations: KitchenStation[];
  kitchenOrders: Order[];
  printers: Printer[];
  settings: RestaurantSettings | null;
  isLoading: boolean;
  selectedTable: RestaurantTable | null;
  activeTableOrder: Order | null;
  cart: CartItem[];
  customerNotes: string;
  isSubmittingOrder: boolean;
  lastCreatedOrder: Order | null;
  notificationMessage: { titleAr: string; titleEn: string; type?: 'info' | 'success' | 'alert' } | null;

  // Actions
  selectTable: (table: RestaurantTable | null) => void;
  setCustomerNotes: (notes: string) => void;
  addItemToCart: (product: Product, modifiers: SelectedItemModifier[], notes?: string, quantity?: number) => void;
  updateCartItemQty: (index: number, delta: number) => void;
  removeCartItem: (index: number) => void;
  clearCart: () => void;
  submitOrder: () => Promise<Order | null>;
  refreshAll: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: any) => Promise<void>;
  updateItemPrepStatus: (orderId: string, itemId: string, status: any) => Promise<void>;
  dismissNotification: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stations, setStations] = useState<KitchenStation[]>([]);
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active waiter order taking
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [activeTableOrder, setActiveTableOrder] = useState<Order | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<{
    titleAr: string;
    titleEn: string;
    type?: 'info' | 'success' | 'alert';
  } | null>(null);

  const refreshAll = async () => {
    try {
      const [tList, cList, pList, oList, prList, sData] = await Promise.all([
        api.getTables(),
        api.getCategories(),
        api.getProducts(),
        api.getKitchenOrders(),
        api.getPrinters(),
        api.getSettings(),
      ]);
      setTables(tList);
      setCategories(cList);
      setProducts(pList);
      setKitchenOrders(oList);
      setPrinters(prList);
      setSettings(sData);
    } catch (err) {
      console.error('[Context] Initial load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Sync active order when selectedTable changes
  useEffect(() => {
    if (selectedTable?.currentOrderId) {
      const existing = kitchenOrders.find((o) => o.id === selectedTable.currentOrderId);
      setActiveTableOrder(existing || null);
    } else {
      setActiveTableOrder(null);
    }
  }, [selectedTable, kitchenOrders]);

  // Real-time SSE Connection
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource(`/api/kitchen/events?role=${user?.role || 'WAITER'}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ORDER_CREATED') {
            const { order } = data.payload;
            setKitchenOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
            playKitchenOrderChime();
            setNotificationMessage({
              titleAr: `طلب جديد رقم #${order.orderNumber} لطاولة ${order.tableNumber}`,
              titleEn: `New order #${order.orderNumber} for Table ${order.tableNumber}`,
              type: 'alert',
            });
            api.getTables().then(setTables);
          } else if (data.type === 'ORDER_UPDATED') {
            const { order } = data.payload;
            setKitchenOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
            playKitchenOrderChime();
            setNotificationMessage({
              titleAr: `تعديل على الطلب #${order.orderNumber} (طاولة ${order.tableNumber})`,
              titleEn: `Update on Order #${order.orderNumber} (Table ${order.tableNumber})`,
              type: 'info',
            });
            api.getTables().then(setTables);
          } else if (data.type === 'ORDER_STATUS_CHANGED') {
            const { orderId, status, orderNumber, tableNumber } = data.payload;
            setKitchenOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, status } : o))
            );

            if (status === 'READY') {
              playSuccessDing();
              setNotificationMessage({
                titleAr: `الطلب #${orderNumber} (طاولة ${tableNumber}) جاهز للتقديم!`,
                titleEn: `Order #${orderNumber} (Table ${tableNumber}) is READY to serve!`,
                type: 'success',
              });
            }
            api.getTables().then(setTables);
          } else if (data.type === 'TABLE_UPDATED') {
            const table = data.payload;
            setTables((prev) => prev.map((t) => (t.id === table.id ? table : t)));
          } else if (data.type === 'TABLES_REFRESH' || data.type === 'ORDERS_REFRESH') {
            refreshAll();
          }
        } catch (err) {
          console.error('[SSE Parse Error]', err);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        // Reconnect after 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, [user?.role]);

  const selectTable = (table: RestaurantTable | null) => {
    setSelectedTable(table);
    if (!table) {
      setCart([]);
      setCustomerNotes('');
      setActiveTableOrder(null);
    }
  };

  const addItemToCart = (
    product: Product,
    selectedModifiers: SelectedItemModifier[],
    notes?: string,
    quantity = 1
  ) => {
    const modifiersDelta = selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
    const unitPrice = product.price + modifiersDelta;
    const totalPrice = unitPrice * quantity;

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId: product.id,
      productNameAr: product.nameAr,
      productNameEn: product.nameEn,
      quantity,
      unitPrice,
      totalPrice,
      stationId: product.stationId,
      selectedModifiers,
      notes,
      status: 'PENDING',
      roundNumber: (activeTableOrder?.roundsCount || 0) + 1,
      image: getProductImage(product.id, product.categoryId, product.image),
    };

    setCart((prev) => {
      const updated = [...prev, newItem];
      api.saveLocalPendingCart({ tableId: selectedTable?.id, items: updated });
      return updated;
    });
    playSuccessDing();
  };

  const updateCartItemQty = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const target = copy[index];
      if (!target) return prev;

      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        copy.splice(index, 1);
      } else {
        target.quantity = newQty;
        target.totalPrice = target.unitPrice * newQty;
      }
      api.saveLocalPendingCart({ tableId: selectedTable?.id, items: copy });
      return copy;
    });
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      api.saveLocalPendingCart({ tableId: selectedTable?.id, items: copy });
      return copy;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCustomerNotes('');
    api.clearLocalPendingCart();
  };

  const submitOrder = async (): Promise<Order | null> => {
    if (!selectedTable || cart.length === 0) return null;
    setIsSubmittingOrder(true);

    try {
      const idempotencyKey = `idem-${selectedTable.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const res = await api.submitOrder({
        tableId: selectedTable.id,
        waiterId: user?.id || 'usr-w1',
        waiterName: user?.name || 'أحمد الشامي',
        guestCount: selectedTable.seats,
        items: cart,
        customerNotes,
        idempotencyKey,
      });

      if (res.success && res.order) {
        setLastCreatedOrder(res.order);
        setCart([]);
        setCustomerNotes('');
        api.clearLocalPendingCart();
        playKitchenOrderChime();

        // Refresh tables & orders
        await refreshAll();
        return res.order;
      }
      return null;
    } catch (err: any) {
      alert(err.message || 'فشل إرسال الطلب');
      return null;
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: any) => {
    try {
      await api.updateOrderStatus(orderId, status, user?.name || 'المستخدم');
      setKitchenOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      const updatedTables = await api.getTables();
      setTables(updatedTables);
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const updateItemPrepStatus = async (orderId: string, itemId: string, status: any) => {
    try {
      await api.updateItemStatus(orderId, itemId, status);
      setKitchenOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            items: o.items.map((it) => (it.id === itemId ? { ...it, status } : it)),
          };
        })
      );
    } catch (err) {
      console.error('Update item status error:', err);
    }
  };

  const dismissNotification = () => setNotificationMessage(null);

  return (
    <RestaurantContext.Provider
      value={{
        tables,
        categories,
        products,
        stations,
        kitchenOrders,
        printers,
        settings,
        isLoading,
        selectedTable,
        activeTableOrder,
        cart,
        customerNotes,
        isSubmittingOrder,
        lastCreatedOrder,
        notificationMessage,
        selectTable,
        setCustomerNotes,
        addItemToCart,
        updateCartItemQty,
        removeCartItem,
        clearCart,
        submitOrder,
        refreshAll,
        updateOrderStatus,
        updateItemPrepStatus,
        dismissNotification,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
