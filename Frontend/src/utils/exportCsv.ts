import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Order, User } from '../types';

export const generateCsvString = (orders: Order[], users: User[]): string => {
  // Define columns
  const headers = [
    'Order ID',
    'Date',
    'Customer ID',
    'Customer Name',
    'Customer Phone',
    'Status',
    'Total Amount',
    'Items Summary'
  ];

  const rows = orders.map(order => {
    const itemsSummary = (order.items || [])
      .map(i => `${i.name} (x${i.quantity})`)
      .join('; ');

    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
    
    const customer = users.find(u => u._id === order.customerId);
    const customerName = customer?.name || order.customerName || 'Unknown';
    const customerPhone = customer?.phone || order.customerPhone || 'N/A';

    return [
      order._id || 'N/A',
      dateStr,
      order.customerId || 'N/A',
      `"${customerName.replace(/"/g, '""')}"`,
      `"${customerPhone.replace(/"/g, '""')}"`,
      order.status || 'N/A',
      (order.totalAmount || 0).toString(),
      `"${itemsSummary.replace(/"/g, '""')}"` // Escape quotes for CSV
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const downloadOrdersCsv = async (orders: Order[], monthYear: string, users: User[]) => {
  try {
    const csvString = generateCsvString(orders, users);
    const fileName = `Orders_${monthYear.replace(/\s+/g, '_')}.csv`;

    if (Platform.OS === 'web') {
      // Standard web browser download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Mobile app save and share
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csvString, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Export ${monthYear} Orders`,
          UTI: 'public.comma-separated-values-text' // iOS
        });
      } else {
        alert('File sharing is not supported on this device.');
      }
    }
  } catch (error) {
    console.error('Error generating CSV:', error);
    alert('Failed to generate CSV export.');
  }
};
