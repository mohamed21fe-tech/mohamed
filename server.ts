import express, { Request, Response } from 'express';
import http from 'node:http';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/database';
import { eventBus } from './server/eventBus';
import { formatKitchenTicket, sendToNetworkPrinter } from './server/printerService';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);

  app.use(express.json({ limit: '10mb' }));

  // Request logger for local restaurant auditability
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') && !req.path.includes('/kitchen/events')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // --- 1. AUTHENTICATION ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم أو رمز PIN' });
    }

    const user = db.findUserByPinOrUsername(identifier);
    if (!user) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة أو الحساب غير نشط' });
    }

    db.logAudit(
      user.id,
      user.name,
      user.role,
      'LOGIN',
      `تسجيل دخول ناجح للمستخدم [${user.name}]`,
      `User [${user.name}] logged in successfully`
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  });

  app.get('/api/auth/users', (_req: Request, res: Response) => {
    const users = db.getUsers().map(({ pin, ...safeUser }) => safeUser);
    res.json(users);
  });

  app.post('/api/auth/users', (req: Request, res: Response) => {
    const { id, username, name, pin, role, active } = req.body;
    if (!username || !name || !pin || !role) {
      return res.status(400).json({ error: 'البيانات غير مكتملة' });
    }
    const newUser = db.saveUser({
      id: id || `usr-${Date.now()}`,
      username,
      name,
      pin,
      role,
      active: active !== false,
      createdAt: new Date().toISOString(),
    });
    res.json(newUser);
  });

  // --- 2. REAL-TIME SERVER-SENT EVENTS (SSE) ---
  app.get('/api/kitchen/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = `sse-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const role = (req.query.role as string) || 'WAITER';

    eventBus.addClient(clientId, res, role);
  });

  // --- 3. TABLES ---
  app.get('/api/tables', (_req: Request, res: Response) => {
    res.json(db.getTables());
  });

  app.post('/api/tables', (req: Request, res: Response) => {
    const table = db.saveTable(req.body);
    eventBus.broadcast('TABLE_UPDATED', table);
    res.json(table);
  });

  app.put('/api/tables/:id', (req: Request, res: Response) => {
    const existing = db.getTableById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'الطاولة غير موجودة' });
    }
    const updated = db.saveTable({ ...existing, ...req.body });
    eventBus.broadcast('TABLE_UPDATED', updated);
    res.json(updated);
  });

  app.post('/api/tables/transfer', (req: Request, res: Response) => {
    const { sourceTableId, targetTableId, waiterName } = req.body;
    const result = db.transferTable(sourceTableId, targetTableId, waiterName || 'الويتر');
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    eventBus.broadcast('TABLES_REFRESH', { sourceTableId, targetTableId });
    res.json(result);
  });

  app.post('/api/tables/merge', (req: Request, res: Response) => {
    const { sourceTableId, targetTableId, waiterName } = req.body;
    const result = db.mergeTables(sourceTableId, targetTableId, waiterName || 'الويتر');
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    eventBus.broadcast('TABLES_REFRESH', { sourceTableId, targetTableId });
    eventBus.broadcast('ORDERS_REFRESH', {});
    res.json(result);
  });

  // --- 4. CATEGORIES & PRODUCTS ---
  app.get('/api/categories', (_req: Request, res: Response) => {
    res.json(db.getCategories());
  });

  app.post('/api/categories', (req: Request, res: Response) => {
    const cat = db.saveCategory(req.body);
    res.json(cat);
  });

  app.delete('/api/categories/:id', (req: Request, res: Response) => {
    const success = db.deleteCategory(req.params.id);
    res.json({ success });
  });

  app.get('/api/products', (_req: Request, res: Response) => {
    res.json(db.getProducts());
  });

  app.post('/api/products', (req: Request, res: Response) => {
    const prod = db.saveProduct(req.body);
    res.json(prod);
  });

  app.put('/api/products/:id/availability', (req: Request, res: Response) => {
    const products = db.getProducts();
    const prod = products.find((p) => p.id === req.params.id);
    if (!prod) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }
    prod.isAvailable = req.body.isAvailable;
    db.saveProduct(prod);
    res.json(prod);
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const success = db.deleteProduct(req.params.id);
    res.json({ success });
  });

  app.get('/api/stations', (_req: Request, res: Response) => {
    res.json(db.getStations());
  });

  // --- 5. ORDERS & KITCHEN ---
  app.get('/api/orders', (req: Request, res: Response) => {
    const filters = {
      status: req.query.status as string,
      tableId: req.query.tableId as string,
      waiterId: req.query.waiterId as string,
      date: req.query.date as string,
      search: req.query.search as string,
    };
    res.json(db.getOrders(filters));
  });

  app.get('/api/kitchen/orders', (_req: Request, res: Response) => {
    const active = db.getOrders().filter((o) => !['PAID', 'CANCELLED'].includes(o.status));
    res.json(active);
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }
    res.json(order);
  });

  app.get('/api/orders/:id/events', (req: Request, res: Response) => {
    res.json(db.getOrderEvents(req.params.id));
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const { tableId, waiterId, waiterName, guestCount, items, customerNotes, idempotencyKey } = req.body;

      if (!tableId || !waiterId || !items || !items.length) {
        return res.status(400).json({ error: 'بيانات الطلب غير مكتملة (الطاولة، الويتر، والأصناف مطلوبة)' });
      }

      const { order, isNew, isAppended } = db.createOrAppendOrder({
        tableId,
        waiterId,
        waiterName: waiterName || 'ويتر',
        guestCount,
        items,
        customerNotes,
        idempotencyKey,
      });

      // Broadcast real-time event to kitchen & waiter screens
      const eventType = isAppended ? 'ORDER_UPDATED' : 'ORDER_CREATED';
      eventBus.broadcast(eventType, {
        order,
        isAppended,
        messageAr: isAppended
          ? `تعديل/إضافة جولة على طلب طاولة ${order.tableNumber} (#${order.orderNumber})`
          : `طلب جديد لطاولة ${order.tableNumber} (#${order.orderNumber})`,
      });

      // Broadcast updated table state
      const table = db.getTableById(tableId);
      if (table) {
        eventBus.broadcast('TABLE_UPDATED', table);
      }

      // Check auto-print setting for thermal printers
      const settings = db.getSettings();
      if (settings.autoPrintOnSubmit) {
        const printers = db.getPrinters().filter((p) => p.isActive && p.type === 'NETWORK');
        for (const prn of printers) {
          const ticketText = formatKitchenTicket(order, {
            paperWidth: prn.paperWidth,
            stationId: prn.stationId,
            isUpdateOnly: isAppended,
          });
          if (ticketText) {
            sendToNetworkPrinter(prn, ticketText).catch((e) =>
              console.error(`[Printer auto-print error] ${prn.name}:`, e)
            );
          }
        }
      }

      res.status(isNew ? 201 : 200).json({
        success: true,
        order,
        isNew,
        isAppended,
      });
    } catch (err: any) {
      console.error('[Order Error]', err);
      res.status(500).json({ error: err.message || 'فشل في حفظ الطلب' });
    }
  });

  app.put('/api/orders/:id/status', (req: Request, res: Response) => {
    const { status, userName, userId } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'الحالة مطلوبة' });
    }

    const updated = db.updateOrderStatus(req.params.id, status, userName || 'المستخدم', userId);
    if (!updated) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    eventBus.broadcast('ORDER_STATUS_CHANGED', {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      tableId: updated.tableId,
      tableNumber: updated.tableNumber,
      tableName: updated.tableName,
    });

    const table = db.getTableById(updated.tableId);
    if (table) {
      eventBus.broadcast('TABLE_UPDATED', table);
    }

    res.json(updated);
  });

  app.put('/api/orders/:id/item-status', (req: Request, res: Response) => {
    const { itemId, status } = req.body;
    if (!itemId || !status) {
      return res.status(400).json({ error: 'معرف الصنف والحالة مطلوبان' });
    }

    const updated = db.updateOrderItemStatus(req.params.id, itemId, status);
    if (!updated) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    eventBus.broadcast('ITEM_STATUS_CHANGED', {
      orderId: updated.id,
      itemId,
      status,
    });

    res.json(updated);
  });

  app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
    const { reason, userName, userRole } = req.body;
    const result = db.cancelOrder(req.params.id, reason, userName || 'المدير', userRole || 'MANAGER');
    if (!result.success) {
      return res.status(403).json({ error: result.message });
    }

    eventBus.broadcast('ORDER_CANCELLED', {
      orderId: req.params.id,
      reason,
      userName,
    });

    res.json(result);
  });

  // --- 6. THERMAL PRINTER MANAGEMENT & TICKETS ---
  app.get('/api/printers', (_req: Request, res: Response) => {
    res.json(db.getPrinters());
  });

  app.post('/api/printers', (req: Request, res: Response) => {
    const printer = db.savePrinter(req.body);
    res.json(printer);
  });

  app.delete('/api/printers/:id', (req: Request, res: Response) => {
    const success = db.deletePrinter(req.params.id);
    res.json({ success });
  });

  app.get('/api/printer/ticket/:orderId', (req: Request, res: Response) => {
    const order = db.getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    const paperWidth = (req.query.width as '58mm' | '80mm') || '80mm';
    const stationId = (req.query.station as string) || 'ALL';
    const isUpdateOnly = req.query.isUpdate === 'true';

    let stationName = '';
    if (stationId !== 'ALL') {
      const station = db.getStations().find((s) => s.id === stationId || s.code === stationId);
      stationName = station ? station.nameAr : stationId;
    }

    const ticketText = formatKitchenTicket(order, {
      paperWidth,
      stationId,
      stationName,
      isUpdateOnly,
    });

    res.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      stationId,
      paperWidth,
      ticketText,
    });
  });

  app.post('/api/printer/test-network', async (req: Request, res: Response) => {
    const { printerId } = req.body;
    const printer = db.getPrinters().find((p) => p.id === printerId);
    if (!printer) {
      return res.status(404).json({ error: 'طابعة غير معروفة' });
    }

    const testTicket = [
      '================================',
      '       مطعم بيتنا الشامي        ',
      '      اختبار الطابعة الحرارية    ',
      '================================',
      `الطابعة:    ${printer.name}`,
      `عنوان IP:   ${printer.ip}`,
      `المنفذ:     ${printer.port}`,
      `عرض الورق:  ${printer.paperWidth}`,
      `القسم:      ${printer.stationId}`,
      `الوقت:      ${new Date().toLocaleTimeString('ar-SY')}`,
      '--------------------------------',
      'حالة الاتصال: ناجحة 100%',
      'نظام بيتنا الشامي يعمل بكفاءة',
      '================================\n\n\n',
    ].join('\n');

    const result = await sendToNetworkPrinter(printer, testTicket);
    printer.lastStatus = result.success ? 'ONLINE' : 'ERROR';
    printer.lastError = result.success ? undefined : result.message;
    printer.lastPrintedAt = new Date().toISOString();
    db.savePrinter(printer);

    res.json(result);
  });

  app.post('/api/printer/print-order-network', async (req: Request, res: Response) => {
    const { orderId, printerId } = req.body;
    const order = db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    const printer = db.getPrinters().find((p) => p.id === printerId);
    if (!printer) {
      return res.status(404).json({ error: 'الطابعة غير محددة' });
    }

    const ticketText = formatKitchenTicket(order, {
      paperWidth: printer.paperWidth,
      stationId: printer.stationId,
    });

    const result = await sendToNetworkPrinter(printer, ticketText);
    printer.lastStatus = result.success ? 'ONLINE' : 'ERROR';
    printer.lastError = result.success ? undefined : result.message;
    printer.lastPrintedAt = new Date().toISOString();
    db.savePrinter(printer);

    if (result.success) {
      db.addOrderEvent(
        order.id,
        order.orderNumber,
        'PRINTED',
        `تمت طباعة تذكرة المطبخ بنجاح على ${printer.name}`,
        `Kitchen ticket printed on ${printer.name}`,
        'النظام'
      );
    }

    res.json(result);
  });

  // --- 7. SETTINGS, REPORTS & BACKUP ---
  app.get('/api/settings', (_req: Request, res: Response) => {
    res.json(db.getSettings());
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  });

  app.get('/api/reports', (_req: Request, res: Response) => {
    res.json(db.getReportsSummary());
  });

  app.get('/api/reports/export-csv', (_req: Request, res: Response) => {
    const orders = db.getOrders();
    const headers = ['Order Number', 'Date', 'Table', 'Waiter', 'Status', 'Total (SYP)', 'Items Count'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('ar-SY'),
      `"${o.tableName}"`,
      `"${o.waiterName}"`,
      o.status,
      o.total,
      o.items.length,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="baitna-alshami-orders-${Date.now()}.csv"`);
    // Prepend UTF-8 BOM for Arabic support in Excel
    res.send('\uFEFF' + csvContent);
  });

  app.get('/api/backup/export', (_req: Request, res: Response) => {
    const snapshot = db.exportBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="baitna-alshami-backup-${Date.now()}.json"`);
    res.json(snapshot);
  });

  app.post('/api/backup/restore', (req: Request, res: Response) => {
    const success = db.importBackup(req.body);
    if (!success) {
      return res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح' });
    }
    eventBus.broadcast('SYSTEM_RESTORED', {});
    res.json({ success: true, message: 'تمت استعادة قاعدة البيانات بنجاح' });
  });

  app.get('/api/audit-logs', (_req: Request, res: Response) => {
    res.json(db.getAuditLogs());
  });

  // --- 8. VITE MIDDLEWARE & STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Baitna Al-Shami POS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
