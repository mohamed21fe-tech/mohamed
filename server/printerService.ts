import net from 'node:net';
import { Order, OrderItem, Printer } from '../src/types';

export interface TicketOptions {
  paperWidth?: '58mm' | '80mm';
  stationId?: string; // 'ALL' or specific stationId/code
  stationName?: string;
  isUpdateOnly?: boolean;
}

/**
 * Formats a clean, high-contrast, professional kitchen ticket in plain text
 * for thermal printers (58mm or 80mm) and for visual display.
 */
export function formatKitchenTicket(order: Order, options: TicketOptions = {}): string {
  const width = options.paperWidth === '58mm' ? 32 : 44;
  const line = '='.repeat(width);
  const subline = '-'.repeat(width);

  // Filter items by station if specified
  const itemsToPrint = options.stationId && options.stationId !== 'ALL'
    ? order.items.filter((it) => it.stationId === options.stationId)
    : order.items;

  if (itemsToPrint.length === 0) {
    return '';
  }

  const timeStr = new Date(order.createdAt).toLocaleTimeString('ar-SY', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const lines: string[] = [];

  lines.push(line);
  lines.push(centerText('مطعم بيتنا الشامي', width));
  lines.push(centerText('*** تذكرة المطبخ / KITCHEN TICKET ***', width));
  if (options.stationName) {
    lines.push(centerText(`[ ${options.stationName} ]`, width));
  }
  lines.push(line);

  lines.push(`الطلب رقم:   #${order.orderNumber}`);
  lines.push(`الطاولة:     ${order.tableNumber} - ${order.tableName}`);
  lines.push(`الويتر:      ${order.waiterName}`);
  lines.push(`الوقت:       ${timeStr}`);
  lines.push(`الجولة:      جولة ${order.roundsCount}`);

  if (options.isUpdateOnly) {
    lines.push(subline);
    lines.push(centerText('⚠️ تعديل طلب جديد / ORDER UPDATE ⚠️', width));
  }

  lines.push(subline);
  lines.push(padRow('الكمية والصنف', 'السعر', width));
  lines.push(subline);

  for (const item of itemsToPrint) {
    const qtyTitle = `${item.quantity} × ${item.productNameAr}`;
    lines.push(qtyTitle);
    if (item.productNameEn) {
      lines.push(`   (${item.productNameEn})`);
    }

    // Modifiers
    if (item.selectedModifiers && item.selectedModifiers.length > 0) {
      for (const mod of item.selectedModifiers) {
        lines.push(`   • ${mod.optionNameAr} ${mod.priceDelta > 0 ? `(+${mod.priceDelta.toLocaleString('ar-SY')} ل.س)` : ''}`);
      }
    }

    // Item note
    if (item.notes && item.notes.trim()) {
      lines.push(`   ملاحظة: "${item.notes.trim()}"`);
    }

    lines.push('');
  }

  if (order.customerNotes && order.customerNotes.trim()) {
    lines.push(subline);
    lines.push(`ملاحظات الزبون: ${order.customerNotes.trim()}`);
  }

  lines.push(line);
  lines.push(centerText(`إجمالي الأصناف في التذكرة: ${itemsToPrint.length}`, width));
  lines.push(centerText('نظام بيتنا الشامي المحلي للتشغيل', width));
  lines.push(line);
  lines.push('\n\n'); // Feed space

  return lines.join('\n');
}

function centerText(text: string, width: number): string {
  if (text.length >= width) return text;
  const leftPadding = Math.floor((width - text.length) / 2);
  return ' '.repeat(leftPadding) + text;
}

function padRow(left: string, right: string, width: number): string {
  const spaceCount = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(spaceCount) + right;
}

/**
 * Builds raw ESC/POS command buffers for standard thermal receipt printers.
 */
export function buildEscPosBuffer(ticketText: string): Buffer {
  const ESC = 0x1b;
  const GS = 0x1d;

  const chunks: Buffer[] = [];

  // Init printer
  chunks.push(Buffer.from([ESC, 0x40]));

  // UTF-8 code page support (EPSON code page or raw UTF-8 string)
  chunks.push(Buffer.from([ESC, 0x74, 0x00]));

  // Convert text to UTF-8
  const textBuffer = Buffer.from(ticketText, 'utf-8');
  chunks.push(textBuffer);

  // Feed 4 lines & cut paper
  chunks.push(Buffer.from([ESC, 0x64, 0x04])); // Feed 4 lines
  chunks.push(Buffer.from([GS, 0x56, 0x42, 0x00])); // Partial cut

  return Buffer.concat(chunks);
}

/**
 * Dispatches an ESC/POS print job directly to a network thermal printer
 * via TCP raw port 9100.
 */
export function sendToNetworkPrinter(
  printer: Printer,
  ticketText: string,
  timeoutMs = 4000
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    if (!printer.ip || !printer.port) {
      return resolve({ success: false, message: 'عنوان IP أو منفذ الطابعة غير محدد' });
    }

    const socket = new net.Socket();
    let isResolved = false;

    const finalize = (success: boolean, message: string) => {
      if (isResolved) return;
      isResolved = true;
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      resolve({ success, message });
    };

    socket.setTimeout(timeoutMs);

    socket.connect(printer.port, printer.ip, () => {
      try {
        const payload = buildEscPosBuffer(ticketText);
        socket.write(payload, () => {
          socket.end();
          finalize(true, `تم إرسال تذكرة الطباعة بنجاح إلى ${printer.name} (${printer.ip}:${printer.port})`);
        });
      } catch (err: any) {
        finalize(false, `خطأ أثناء كتابة البيانات إلى الطابعة: ${err.message}`);
      }
    });

    socket.on('timeout', () => {
      finalize(false, `انتهت مهلة الاتصال بالطابعة (${printer.ip}:${printer.port}). تأكد من تشغيلها وتوصيلها بالشبكة.`);
    });

    socket.on('error', (err: any) => {
      finalize(false, `فشل الاتصال بالطابعة (${printer.ip}:${printer.port}): ${err.message}`);
    });
  });
}
