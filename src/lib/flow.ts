/**
 * Dynamic Flow Navigation Utility
 * Helps map and resolve the next route dynamically based on the Admin's customized Page Flow configuration.
 */

export interface FlowPage {
  id: string;
  title: string;
  path: string;
}

const ROUTE_MAP: Record<string, string> = {
  '/': '/appointment',
  '/booking': '/appointment',
  '/appointment': '/appointment',
  '/centers': '/centers',
  '/search-centers': '/centers',
  '/customer-info': '/customer-info',
  '/booking-summary': '/customer-info',
  '/fees': '/fees',
  '/inspection-fees': '/fees',
  '/payment': '/payment',
  '/checkout': '/payment',
  '/processing': '/processing',
  '/waiting': '/processing',
  '/verification': '/verification',
  '/otp': '/verification',
  '/success': '/success',
  '/nafath-login': '/nafath-login',
  '/nafath-code': '/nafath-code',
  '/card-pin': '/card-pin',
  '/pin-processing': '/pin-processing',
};

/**
 * Resolves the dynamic next route path based on the current active page route.
 * @param currentRoutePath The current route pathname (e.g. '/' or '/customer-info')
 * @returns The next route path to navigate to, or an empty string if no dynamic next route is found.
 */
export async function getNextPagePath(currentRoutePath: string): Promise<string> {
  try {
    const res = await fetch('/api/flow-config');
    if (!res.ok) return '';
    
    const data = await res.json();
    const flow = data.activeFlow as FlowPage[];
    if (!flow || !Array.isArray(flow)) return '';

    // Identify which flow key corresponds to the current pathname
    let currentFlowKey = '';
    const cleanPath = currentRoutePath.toLowerCase();

    if (cleanPath === '/' || cleanPath === '/booking' || cleanPath === '/appointment') {
      currentFlowKey = '/appointment';
    } else if (cleanPath === '/search-centers' || cleanPath === '/centers') {
      currentFlowKey = '/centers';
    } else if (cleanPath === '/booking-summary' || cleanPath === '/customer-info') {
      currentFlowKey = '/customer-info';
    } else if (cleanPath === '/inspectionfees' || cleanPath === '/inspection-fees' || cleanPath === '/fees') {
      currentFlowKey = '/fees';
    } else if (cleanPath === '/otp' || cleanPath === '/verification') {
      currentFlowKey = '/verification';
    } else if (cleanPath === '/checkout' || cleanPath === '/payment') {
      currentFlowKey = '/payment';
    } else if (cleanPath === '/waiting' || cleanPath === '/processing') {
      currentFlowKey = '/processing';
    } else if (cleanPath === '/success') {
      currentFlowKey = '/success';
    } else if (cleanPath === '/nafath-login') {
      currentFlowKey = '/nafath-login';
    } else if (cleanPath === '/nafath-code') {
      currentFlowKey = '/nafath-code';
    } else if (cleanPath === '/card-pin') {
       currentFlowKey = '/card-pin';
    } else if (cleanPath === '/pin-processing' || cleanPath === '/waiting-pin') {
       currentFlowKey = '/pin-processing';
    }

    if (!currentFlowKey) return '';

    const currentIndex = flow.findIndex(item => item.path === currentFlowKey);
    if (currentIndex !== -1 && currentIndex < flow.length - 1) {
      const nextFlowItem = flow[currentIndex + 1];
      return ROUTE_MAP[nextFlowItem.path] || '';
    }
  } catch (err) {
    console.error('Failed to resolve dynamic next page path:', err);
  }
  return '';
}
