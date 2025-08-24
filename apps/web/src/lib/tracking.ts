export function trackingUrl(carrier: string, code: string) {
  if (carrier === 'DHL') {
    return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(code)}`;
  }
  if (carrier === 'SAMEDAY') {
    return `https://www.sameday.ro/awb-tracking?code=${encodeURIComponent(code)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier} tracking ${code}`)}`;
}

export function getCarrierDisplayName(carrier: string): string {
  switch (carrier) {
    case 'DHL':
      return 'DHL International';
    case 'SAMEDAY':
      return 'Sameday';
    default:
      return carrier;
  }
}

export function getStatusDisplayName(status: string): string {
  switch (status) {
    case 'READY_TO_SHIP':
      return 'Ready to Ship';
    case 'LABEL_PURCHASED':
      return 'Label Purchased';
    case 'IN_TRANSIT':
      return 'In Transit';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}
