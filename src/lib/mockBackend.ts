import type { AxiosRequestConfig, AxiosResponse } from "axios";

type Role = "admin" | "customer";

interface PermissionRecord {
  id: number;
  name: string;
  description: string;
  codename: string;
}

interface UserRecord {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  password: string;
  is_active: boolean;
  date_joined: string;
  custom_permission_ids: number[];
  admin: number | null;
}

interface LocationRecord {
  id: number;
  name: string;
}

interface ShippingOrderItemRecord {
  id: number;
  invoice_number: string;
  product_name: string;
  quantity: number;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  unit: string;
}

interface ShippingOrderImageRecord {
  id: number;
  image: string;
  uploaded_at: string;
}

interface ShippingOrderRecord {
  id: number;
  shipping_code: string;
  shipping_date: string;
  sender_phone: string;
  receiver_phone: string;
  shipping_cost: number;
  shipping_fee: number;
  calculation_type: string;
  total_value: number;
  total_weight_kg: number | null;
  total_weight_ton: number | null;
  total_cbm: number | null;
  delivery_address: string;
  delivery_address_id: number;
  shipping_location_id: number;
  ordered_by_id: number;
  ordered_to_id: number;
  status: string;
  note: string;
  created_at: string;
  items: ShippingOrderItemRecord[];
  images: ShippingOrderImageRecord[];
}

interface InvoiceRecord {
  id: number;
  invoice_number: string;
  shipping_order_id: number;
  billed_to_id: number;
  billed_from_id: number;
  issue_date: string;
  due_date: string;
  payment_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  payment_method?: string;
  notes?: string;
  terms_and_conditions?: string;
}

interface PaymentRecord {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_reference: string;
  created_at: string;
  updated_at: string;
}

interface QrOrderRecord {
  id: number;
  invoice_number: string;
  status: string;
  note: string;
  created_at: string;
  updated_at: string;
  image_urls: string[];
}

interface QrOrderSearchRecord {
  id: number;
  invoice_number: string;
  status: "confirmed" | "no_confirm";
  note: string;
  searched_at: string;
  searched_by: number | null;
}

interface NotificationRecord {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NextIds {
  user: number;
  shippingOrder: number;
  shippingOrderItem: number;
  shippingOrderImage: number;
  invoice: number;
  payment: number;
  qrOrder: number;
  qrOrderSearch: number;
  notification: number;
}

interface MockDatabase {
  permissions: PermissionRecord[];
  users: UserRecord[];
  locations: LocationRecord[];
  shippingOrders: ShippingOrderRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  qrOrders: QrOrderRecord[];
  qrOrderSearches: QrOrderSearchRecord[];
  notifications: NotificationRecord[];
  uploadedImages: Record<string, string>;
  nextIds: NextIds;
}

const STORAGE_KEY = "logitrack.mockdb.v1";
const DEMO_PASSWORD = "demo123";

const nowIso = () => new Date().toISOString();
const todayIso = () => new Date().toISOString().split("T")[0];
const plusDaysIso = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const permissionSeed: PermissionRecord[] = [
  { id: 1, name: "Hide Navbar", description: "Hide navigation", codename: "hide_navbar" },
  { id: 2, name: "Hide Dashboard", description: "Hide dashboard page", codename: "hide_dashboard" },
  { id: 3, name: "Hide Orders", description: "Hide orders page", codename: "hide_orders" },
  { id: 4, name: "Hide Payments", description: "Hide payments page", codename: "hide_payments" },
  { id: 5, name: "Hide Reports", description: "Hide reports page", codename: "hide_reports" },
  { id: 6, name: "Hide Reports Total Orders", description: "Hide total orders metric", codename: "hide_reports_total_orders" },
  { id: 7, name: "Hide Reports Revenue", description: "Hide revenue metric", codename: "hide_reports_revenue" },
  { id: 8, name: "Hide Reports Delivered", description: "Hide delivered metric", codename: "hide_reports_delivered" },
  { id: 9, name: "Hide Reports In Progress", description: "Hide in-progress metric", codename: "hide_reports_in_progress" },
  { id: 10, name: "Hide Payments Total Revenue", description: "Hide total revenue metric", codename: "hide_payments_total_revenue" },
  { id: 11, name: "Hide Payments Pending Revenue", description: "Hide pending revenue metric", codename: "hide_payments_pending_revenue" },
  { id: 12, name: "Hide Payments Success Rate", description: "Hide success rate metric", codename: "hide_payments_success_rate" },
  { id: 13, name: "Hide Payments Amount Method", description: "Hide payment method metric", codename: "hide_payments_amount_method" },
];

const locationSeed: LocationRecord[] = [
  { id: 1, name: "Bangkok Hub" },
  { id: 2, name: "Phnom Penh Warehouse" },
  { id: 3, name: "Siem Reap Distribution Center" },
  { id: 4, name: "Ho Chi Minh Pickup Point" },
];

const createSeedDatabase = (): MockDatabase => {
  const users: UserRecord[] = [
    {
      id: 1,
      full_name: "Admin Demo",
      email: "admin@logitrack.test",
      role: "admin",
      password: DEMO_PASSWORD,
      is_active: true,
      date_joined: "2026-01-05T08:00:00.000Z",
      custom_permission_ids: [],
      admin: null,
    },
    {
      id: 2,
      full_name: "Customer Demo",
      email: "customer@logitrack.test",
      role: "customer",
      password: DEMO_PASSWORD,
      is_active: true,
      date_joined: "2026-02-10T10:30:00.000Z",
      custom_permission_ids: [],
      admin: 1,
    },
    {
      id: 3,
      full_name: "Customer Limited",
      email: "limited@logitrack.test",
      role: "customer",
      password: DEMO_PASSWORD,
      is_active: true,
      date_joined: "2026-03-14T12:00:00.000Z",
      custom_permission_ids: [5, 10, 11, 12, 13],
      admin: 1,
    },
  ];

  const shippingOrders: ShippingOrderRecord[] = [
    {
      id: 1,
      shipping_code: "SO-1001",
      shipping_date: "2026-04-20",
      sender_phone: "555-0101",
      receiver_phone: "555-0151",
      shipping_cost: 80,
      shipping_fee: 12,
      calculation_type: "kg",
      total_value: 42,
      total_weight_kg: 42,
      total_weight_ton: 0.042,
      total_cbm: 0.25,
      delivery_address: "Bangkok Hub",
      delivery_address_id: 1,
      shipping_location_id: 2,
      ordered_by_id: 2,
      ordered_to_id: 2,
      status: "in_transit",
      note: "Handle with care",
      created_at: "2026-04-18T09:30:00.000Z",
      items: [
        {
          id: 1,
          invoice_number: "INV-CAM-1001",
          product_name: "Fashion Cartons",
          quantity: 2,
          weight_kg: 21,
          length_cm: null,
          width_cm: null,
          height_cm: null,
          unit: "kg",
        },
      ],
      images: [],
    },
    {
      id: 2,
      shipping_code: "SO-1002",
      shipping_date: "2026-04-16",
      sender_phone: "555-0102",
      receiver_phone: "555-0152",
      shipping_cost: 120,
      shipping_fee: 18,
      calculation_type: "cbm",
      total_value: 0.64,
      total_weight_kg: null,
      total_weight_ton: null,
      total_cbm: 0.64,
      delivery_address: "Phnom Penh Warehouse",
      delivery_address_id: 2,
      shipping_location_id: 1,
      ordered_by_id: 3,
      ordered_to_id: 3,
      status: "delivered",
      note: "Delivered at customs",
      created_at: "2026-04-10T15:00:00.000Z",
      items: [
        {
          id: 2,
          invoice_number: "INV-CAM-1002",
          product_name: "Electronics Pallet",
          quantity: 1,
          weight_kg: null,
          length_cm: 80,
          width_cm: 100,
          height_cm: 80,
          unit: "cbm",
        },
      ],
      images: [],
    },
    {
      id: 3,
      shipping_code: "SO-1003",
      shipping_date: "2026-04-27",
      sender_phone: "555-0103",
      receiver_phone: "555-0153",
      shipping_cost: 60,
      shipping_fee: 10,
      calculation_type: "kg",
      total_value: 15,
      total_weight_kg: 15,
      total_weight_ton: 0.015,
      total_cbm: 0.09,
      delivery_address: "Siem Reap Distribution Center",
      delivery_address_id: 3,
      shipping_location_id: 4,
      ordered_by_id: 2,
      ordered_to_id: 2,
      status: "pending",
      note: "",
      created_at: "2026-04-26T11:00:00.000Z",
      items: [
        {
          id: 3,
          invoice_number: "INV-CAM-1003",
          product_name: "Kitchen Supplies",
          quantity: 3,
          weight_kg: 5,
          length_cm: null,
          width_cm: null,
          height_cm: null,
          unit: "kg",
        },
      ],
      images: [],
    },
  ];

  const invoices: InvoiceRecord[] = [
    {
      id: 1,
      invoice_number: "BILL-1001",
      shipping_order_id: 1,
      billed_to_id: 2,
      billed_from_id: 1,
      issue_date: "2026-04-19",
      due_date: "2026-04-30",
      subtotal: 92,
      tax_amount: 0,
      total_amount: 92,
      status: "sent",
      payment_method: "bank_transfer",
      notes: "Please pay before arrival.",
      terms_and_conditions: "Demo invoice for UI testing.",
    },
    {
      id: 2,
      invoice_number: "BILL-1002",
      shipping_order_id: 2,
      billed_to_id: 3,
      billed_from_id: 1,
      issue_date: "2026-04-11",
      due_date: "2026-04-20",
      payment_date: "2026-04-18",
      subtotal: 138,
      tax_amount: 0,
      total_amount: 138,
      status: "paid",
      payment_method: "qr_payment",
      notes: "Paid on receipt.",
      terms_and_conditions: "Demo invoice for UI testing.",
    },
    {
      id: 3,
      invoice_number: "BILL-1003",
      shipping_order_id: 3,
      billed_to_id: 2,
      billed_from_id: 1,
      issue_date: "2026-04-27",
      due_date: "2026-05-05",
      subtotal: 70,
      tax_amount: 0,
      total_amount: 70,
      status: "draft",
      notes: "Auto-generated draft invoice.",
      terms_and_conditions: "Demo invoice for UI testing.",
    },
  ];

  const payments: PaymentRecord[] = [
    {
      id: 1,
      invoice_id: 2,
      amount: 138,
      payment_date: "2026-04-18",
      payment_method: "qr_payment",
      transaction_reference: "TXN-PAID-1002",
      created_at: "2026-04-18T08:00:00.000Z",
      updated_at: "2026-04-18T08:00:00.000Z",
    },
  ];

  const qrOrders: QrOrderRecord[] = [
    {
      id: 1,
      invoice_number: "INV-CAM-1001",
      status: "in_transit",
      note: "Cross-border shipment recorded",
      created_at: "2026-04-18T09:00:00.000Z",
      updated_at: "2026-04-22T14:00:00.000Z",
      image_urls: [],
    },
    {
      id: 2,
      invoice_number: "INV-CAM-1002",
      status: "delivered",
      note: "Shipment confirmed at destination",
      created_at: "2026-04-10T08:45:00.000Z",
      updated_at: "2026-04-18T10:00:00.000Z",
      image_urls: [],
    },
    {
      id: 3,
      invoice_number: "INV-CAM-4040",
      status: "in_transit",
      note: "QR order only, not yet matched to final order",
      created_at: "2026-04-28T16:30:00.000Z",
      updated_at: "2026-04-28T16:30:00.000Z",
      image_urls: [],
    },
  ];

  const qrOrderSearches: QrOrderSearchRecord[] = [
    {
      id: 1,
      invoice_number: "INV-CAM-1002",
      status: "confirmed",
      note: "Confirmed order found in system",
      searched_at: "2026-04-18T10:15:00.000Z",
      searched_by: 1,
    },
    {
      id: 2,
      invoice_number: "INV-CAM-4040",
      status: "no_confirm",
      note: "Order not found in system",
      searched_at: "2026-04-28T17:00:00.000Z",
      searched_by: 2,
    },
  ];

  const notifications: NotificationRecord[] = [
    {
      id: 1,
      user_id: 1,
      title: "New customer registered",
      message: "Customer Demo created a new account.",
      is_read: false,
      created_at: "2026-04-28T10:00:00.000Z",
    },
    {
      id: 2,
      user_id: 1,
      title: "Invoice paid",
      message: "Invoice BILL-1002 has been paid.",
      is_read: false,
      created_at: "2026-04-18T08:05:00.000Z",
    },
    {
      id: 3,
      user_id: 2,
      title: "Shipment in transit",
      message: "Order SO-1001 is on the way to Cambodia.",
      is_read: false,
      created_at: "2026-04-22T14:00:00.000Z",
    },
    {
      id: 4,
      user_id: 3,
      title: "Order delivered",
      message: "Order SO-1002 has been delivered successfully.",
      is_read: true,
      created_at: "2026-04-18T10:00:00.000Z",
    },
  ];

  return {
    permissions: permissionSeed,
    users,
    locations: locationSeed,
    shippingOrders,
    invoices,
    payments,
    qrOrders,
    qrOrderSearches,
    notifications,
    uploadedImages: {},
    nextIds: {
      user: 4,
      shippingOrder: 4,
      shippingOrderItem: 4,
      shippingOrderImage: 1,
      invoice: 4,
      payment: 2,
      qrOrder: 4,
      qrOrderSearch: 3,
      notification: 5,
    },
  };
};

let db: MockDatabase | null = null;

const canUseBrowserStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

const cloneDatabase = (value: MockDatabase): MockDatabase =>
  JSON.parse(JSON.stringify(value)) as MockDatabase;

const getDb = (): MockDatabase => {
  if (db) return db;

  if (!canUseBrowserStorage()) {
    db = createSeedDatabase();
    return db;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    db = createSeedDatabase();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return db;
  }

  try {
    db = JSON.parse(stored) as MockDatabase;
  } catch {
    db = createSeedDatabase();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  return db;
};

const saveDb = () => {
  if (!canUseBrowserStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getDb()));
};

const getPermissionById = (id: number) => getDb().permissions.find((permission) => permission.id === id);
const getUserById = (id: number) => getDb().users.find((user) => user.id === id);
const getLocationById = (id: number) => getDb().locations.find((location) => location.id === id);

const toPublicUser = (user: UserRecord) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
  is_active: user.is_active,
  date_joined: user.date_joined,
  custom_permissions: user.custom_permission_ids
    .map((permissionId) => getPermissionById(permissionId))
    .filter(Boolean),
  admin: user.admin,
});

const toUserSummary = (userId: number) => {
  const user = getUserById(userId);
  if (!user) {
    return { id: 0, full_name: "Unknown User", email: "" };
  }

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
  };
};

const toShippingOrderResponse = (order: ShippingOrderRecord) => ({
  id: order.id,
  shipping_code: order.shipping_code,
  shipping_date: order.shipping_date,
  sender_phone: order.sender_phone,
  receiver_phone: order.receiver_phone,
  shipping_cost: order.shipping_cost,
  shipping_fee: order.shipping_fee,
  calculation_type: order.calculation_type,
  total_value: order.total_value,
  total_weight_kg: order.total_weight_kg,
  total_weight_ton: order.total_weight_ton,
  total_cbm: order.total_cbm,
  delivery_address: order.delivery_address,
  ordered_by: toUserSummary(order.ordered_by_id),
  ordered_to: toUserSummary(order.ordered_to_id),
  shipping_location: getLocationById(order.shipping_location_id),
  status: order.status,
  note: order.note,
  created_at: order.created_at,
  product_name: order.items[0]?.product_name ?? "Shipment",
  items: order.items,
  images: order.images.map((image) => ({
    id: image.id,
    image: image.image,
    image_url: image.image,
    uploaded_at: image.uploaded_at,
  })),
  image_urls: order.images.map((image) => image.image),
});

const getInvoiceTotalFromOrder = (order: ShippingOrderRecord) => Number(order.shipping_cost || 0) + Number(order.shipping_fee || 0);

const syncInvoiceForOrder = (orderId: number) => {
  const order = getDb().shippingOrders.find((item) => item.id === orderId);
  const invoice = getDb().invoices.find((item) => item.shipping_order_id === orderId);

  if (!order || !invoice) return;

  const total = getInvoiceTotalFromOrder(order);
  invoice.subtotal = total;
  invoice.total_amount = total;
};

const toInvoiceResponse = (invoice: InvoiceRecord) => {
  const order = getDb().shippingOrders.find((item) => item.id === invoice.shipping_order_id);
  if (!order) {
    throw new Error(`Missing shipping order ${invoice.shipping_order_id}`);
  }

  const shippingOrder = toShippingOrderResponse(order);

  return {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    shipping_order: shippingOrder,
    billed_to: toUserSummary(invoice.billed_to_id),
    billed_from: toUserSummary(invoice.billed_from_id),
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    payment_date: invoice.payment_date,
    subtotal: invoice.subtotal,
    tax_amount: invoice.tax_amount,
    total_amount: invoice.total_amount,
    status: invoice.status,
    payment_method: invoice.payment_method,
    notes: invoice.notes,
    terms_and_conditions: invoice.terms_and_conditions,
    items: [
      {
        id: invoice.id,
        description: "Shipping Services",
        quantity: 1,
        unit_price: invoice.total_amount,
        line_total: invoice.total_amount,
      },
    ],
  };
};

const toPaymentResponse = (payment: PaymentRecord) => {
  const invoice = getDb().invoices.find((item) => item.id === payment.invoice_id);
  if (!invoice) {
    throw new Error(`Missing invoice ${payment.invoice_id}`);
  }

  return {
    id: payment.id,
    invoice: toInvoiceResponse(invoice),
    amount: payment.amount,
    payment_date: payment.payment_date,
    payment_method: payment.payment_method,
    transaction_reference: payment.transaction_reference,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
  };
};

const toQrOrderResponse = (order: QrOrderRecord) => ({
  id: order.id,
  invoice_number: order.invoice_number,
  status: order.status,
  note: order.note,
  created_at: order.created_at,
  updated_at: order.updated_at,
  image_urls: order.image_urls,
  images: order.image_urls.map((image, index) => ({
    id: index + 1,
    image,
    image_url: image,
    uploaded_at: order.updated_at,
  })),
  qrorderimage_set: order.image_urls.map((image, index) => ({
    id: index + 1,
    image,
    image_url: image,
    uploaded_at: order.updated_at,
  })),
});

const toNotificationResponse = (notification: NotificationRecord) => ({
  id: notification.id,
  title: notification.title,
  message: notification.message,
  is_read: notification.is_read,
  created_at: notification.created_at,
  user: toUserSummary(notification.user_id),
});

const getCurrentSessionUser = (): UserRecord | null => {
  if (!canUseBrowserStorage()) return null;
  const storedUser = localStorage.getItem("user");

  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser) as { id?: number };
      if (parsed.id) {
        return getUserById(parsed.id) ?? null;
      }
    } catch {
      return null;
    }
  }

  return null;
};

const isAuthedRoute = (pathname: string) =>
  ![
    "/login/",
    "/register/",
    "/token/refresh/",
    "/public/invoice/search/",
  ].includes(pathname);

const filterOrdersForUser = (orders: ShippingOrderRecord[], user: UserRecord | null) => {
  if (!user || user.role === "admin") return orders;
  return orders.filter((order) => order.ordered_by_id === user.id || order.ordered_to_id === user.id);
};

const parseQueryFromConfig = (config: AxiosRequestConfig) => {
  const rawUrl = config.url ?? "/";
  const url = new URL(rawUrl, "http://mock.local");

  if (config.params && typeof config.params === "object") {
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return {
    url,
    pathname: url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`,
  };
};

const parseRequestBody = (data: unknown) => {
  if (!data) return null;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
};

const fileToDataUrl = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const createBlob = (content: string, type: string) => new Blob([content], { type });

const resolveResponse = <T>(config: AxiosRequestConfig, data: T, status = 200): AxiosResponse<T> => ({
  config,
  data,
  headers: {},
  status,
  statusText: "OK",
});

const rejectResponse = (config: AxiosRequestConfig, status: number, data: any) =>
  Promise.reject({
    config,
    response: {
      config,
      data,
      headers: {},
      status,
      statusText: "Error",
    },
    isAxiosError: true,
    message: typeof data === "string" ? data : data?.detail ?? `Request failed with status code ${status}`,
  });

const buildRecentOrders = (orders: ShippingOrderRecord[]) =>
  orders
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((order) => ({
      id: String(order.id),
      product_name: order.items[0]?.product_name ?? "Shipment",
      customer: toUserSummary(order.ordered_by_id).full_name,
      status: order.status,
      amount: getInvoiceTotalFromOrder(order),
      shipping_cost: order.shipping_cost,
      shipping_fee: order.shipping_fee,
      date: order.shipping_date,
    }));

const applyDateFilters = <T extends { created_at?: string; shipping_date?: string; issue_date?: string; searched_at?: string }>(
  items: T[],
  query: URLSearchParams,
) => {
  const dateFrom = query.get("date_from");
  const dateTo = query.get("date_to");

  if (!dateFrom && !dateTo) return items;

  return items.filter((item) => {
    const candidate = item.shipping_date ?? item.issue_date ?? item.searched_at ?? item.created_at;
    if (!candidate) return true;

    const value = candidate.slice(0, 10);
    if (dateFrom && value < dateFrom) return false;
    if (dateTo && value > dateTo) return false;
    return true;
  });
};

const createInvoiceForOrder = (order: ShippingOrderRecord) => {
  const invoiceId = getDb().nextIds.invoice++;
  const total = getInvoiceTotalFromOrder(order);
  getDb().invoices.push({
    id: invoiceId,
    invoice_number: `BILL-${1000 + invoiceId}`,
    shipping_order_id: order.id,
    billed_to_id: order.ordered_by_id,
    billed_from_id: 1,
    issue_date: todayIso(),
    due_date: plusDaysIso(7),
    subtotal: total,
    tax_amount: 0,
    total_amount: total,
    status: "draft",
    notes: "Generated by mock backend",
    terms_and_conditions: "Demo invoice for UI testing.",
  });
};

const updateSessionUserIfNeeded = (updatedUser: UserRecord) => {
  if (!canUseBrowserStorage()) return;
  const current = getCurrentSessionUser();
  if (current?.id !== updatedUser.id) return;

  localStorage.setItem("user", JSON.stringify(toPublicUser(updatedUser)));
  window.dispatchEvent(new CustomEvent("sessionUpdate"));
};

export const resetMockDatabase = () => {
  db = createSeedDatabase();
  saveDb();
};

export const getDemoCredentials = () => ({
  admin: { email: "admin@logitrack.test", password: DEMO_PASSWORD },
  customer: { email: "customer@logitrack.test", password: DEMO_PASSWORD },
  limited: { email: "limited@logitrack.test", password: DEMO_PASSWORD },
});

export const handleMockRequest = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  const { url, pathname } = parseQueryFromConfig(config);
  const method = (config.method ?? "get").toLowerCase();
  const body = parseRequestBody(config.data);
  const currentUser = getCurrentSessionUser();

  if (isAuthedRoute(pathname) && !currentUser) {
    return rejectResponse(config, 401, { detail: "Authentication credentials were not provided." });
  }

  if (pathname === "/login/" && method === "post") {
    const payload = body as { email?: string; password?: string } | null;
    const user = getDb().users.find(
      (item) =>
        item.email.toLowerCase() === String(payload?.email ?? "").toLowerCase() &&
        item.password === payload?.password &&
        item.is_active,
    );

    if (!user) {
      return rejectResponse(config, 400, { error: "Invalid email or password." });
    }

    return resolveResponse(config, {
      access: `mock-access-${user.id}`,
      refresh: `mock-refresh-${user.id}`,
      user: toPublicUser(user),
    });
  }

  if (pathname === "/register/" && method === "post") {
    const payload = body as { full_name?: string; email?: string; password?: string } | null;
    const email = String(payload?.email ?? "").trim().toLowerCase();

    if (getDb().users.some((user) => user.email.toLowerCase() === email)) {
      return rejectResponse(config, 400, { message: "Email already exists." });
    }

    const userId = getDb().nextIds.user++;
    const newUser: UserRecord = {
      id: userId,
      full_name: String(payload?.full_name ?? "New Customer"),
      email,
      role: "customer",
      password: String(payload?.password ?? DEMO_PASSWORD),
      is_active: true,
      date_joined: nowIso(),
      custom_permission_ids: [],
      admin: 1,
    };

    getDb().users.push(newUser);
    getDb().notifications.push({
      id: getDb().nextIds.notification++,
      user_id: 1,
      title: "New registration",
      message: `${newUser.full_name} joined the mock workspace.`,
      is_read: false,
      created_at: nowIso(),
    });
    saveDb();

    return resolveResponse(config, {
      token: `mock-access-${newUser.id}`,
      refresh: `mock-refresh-${newUser.id}`,
      user: toPublicUser(newUser),
    }, 201);
  }

  if (pathname === "/token/refresh/" && method === "post") {
    return resolveResponse(config, { access: `mock-access-refresh-${Date.now()}` });
  }

  if (pathname === "/users/" && method === "get") {
    const roleFilter = url.searchParams.get("role");
    const users = getDb().users
      .filter((user) => !roleFilter || user.role === roleFilter)
      .map(toPublicUser);
    return resolveResponse(config, users);
  }

  if (pathname === "/users/" && method === "post") {
    const payload = body as Partial<UserRecord> & { admin?: number };
    const newUser: UserRecord = {
      id: getDb().nextIds.user++,
      full_name: String(payload.full_name ?? "New User"),
      email: String(payload.email ?? `user${Date.now()}@logitrack.test`).toLowerCase(),
      role: payload.role === "admin" ? "admin" : "customer",
      password: String(payload.password ?? DEMO_PASSWORD),
      is_active: payload.is_active ?? true,
      date_joined: nowIso(),
      custom_permission_ids: [],
      admin: payload.role === "admin" ? null : Number(payload.admin ?? 1),
    };

    getDb().users.push(newUser);
    saveDb();
    return resolveResponse(config, toPublicUser(newUser), 201);
  }

  const userIdMatch = pathname.match(/^\/users\/(\d+)\/$/);
  if (userIdMatch && method === "patch") {
    const user = getUserById(Number(userIdMatch[1]));
    if (!user) return rejectResponse(config, 404, { detail: "User not found." });

    const payload = body as Partial<UserRecord> & { admin?: number | string };
    if (payload.full_name !== undefined) user.full_name = String(payload.full_name);
    if (payload.email !== undefined) user.email = String(payload.email).toLowerCase();
    if (payload.role !== undefined) user.role = payload.role === "admin" ? "admin" : "customer";
    if (payload.password) user.password = String(payload.password);
    if (payload.is_active !== undefined) user.is_active = Boolean(payload.is_active);
    if (payload.admin !== undefined) {
      user.admin = payload.admin === "" ? null : Number(payload.admin);
    }

    updateSessionUserIfNeeded(user);
    saveDb();
    return resolveResponse(config, toPublicUser(user));
  }

  if (userIdMatch && method === "delete") {
    const userId = Number(userIdMatch[1]);
    getDb().users = getDb().users.filter((user) => user.id !== userId);
    saveDb();
    return resolveResponse(config, null, 204);
  }

  const addPermissionMatch = pathname.match(/^\/users\/(\d+)\/add_permission\/$/);
  if (addPermissionMatch && method === "post") {
    const user = getUserById(Number(addPermissionMatch[1]));
    const payload = body as { permission_id?: number } | null;
    if (!user || !payload?.permission_id) return rejectResponse(config, 404, { detail: "User not found." });
    if (!user.custom_permission_ids.includes(payload.permission_id)) {
      user.custom_permission_ids.push(payload.permission_id);
    }
    updateSessionUserIfNeeded(user);
    saveDb();
    return resolveResponse(config, { success: true });
  }

  const removePermissionMatch = pathname.match(/^\/users\/(\d+)\/remove_permission\/$/);
  if (removePermissionMatch && method === "post") {
    const user = getUserById(Number(removePermissionMatch[1]));
    const payload = body as { permission_id?: number } | null;
    if (!user || !payload?.permission_id) return rejectResponse(config, 404, { detail: "User not found." });
    user.custom_permission_ids = user.custom_permission_ids.filter((id) => id !== payload.permission_id);
    updateSessionUserIfNeeded(user);
    saveDb();
    return resolveResponse(config, { success: true });
  }

  if (pathname === "/permissions/" && method === "get") {
    return resolveResponse(config, getDb().permissions);
  }

  if (pathname === "/locations/" && method === "get") {
    return resolveResponse(config, getDb().locations);
  }

  if (pathname === "/shipping-orders/" && method === "get") {
    const mine = url.searchParams.get("mine") === "true";
    const visibleOrders = mine ? filterOrdersForUser(getDb().shippingOrders, currentUser) : getDb().shippingOrders;
    return resolveResponse(config, visibleOrders.map(toShippingOrderResponse));
  }

  if (pathname === "/shipping-orders/" && method === "post") {
    const payload = body as {
      shipping_date: string;
      sender_phone: string;
      receiver_phone: string;
      shipping_cost: number | null;
      shipping_fee: number | null;
      calculation_type: string;
      total_value: number | null;
      delivery_address_id: number;
      shipping_location_id: number;
      ordered_to_id: number;
      items: Array<{ invoice_number: string }>;
    };

    const targetUser = getUserById(Number(payload.ordered_to_id)) ?? currentUser!;
    const ownerId = currentUser?.role === "admin" ? targetUser.id : currentUser?.id ?? targetUser.id;
    const deliveryLocation = getLocationById(Number(payload.delivery_address_id));
    const shippingLocation = getLocationById(Number(payload.shipping_location_id));
    const orderId = getDb().nextIds.shippingOrder++;

    const items = (payload.items ?? []).map((item) => ({
      id: getDb().nextIds.shippingOrderItem++,
      invoice_number: item.invoice_number,
      product_name: `Item ${item.invoice_number}`,
      quantity: 1,
      weight_kg: payload.calculation_type === "kg" ? Number(payload.total_value ?? 0) : null,
      length_cm: null,
      width_cm: null,
      height_cm: null,
      unit: payload.calculation_type ?? "kg",
    }));

    const order: ShippingOrderRecord = {
      id: orderId,
      shipping_code: `SO-${1000 + orderId}`,
      shipping_date: payload.shipping_date ?? todayIso(),
      sender_phone: payload.sender_phone ?? "",
      receiver_phone: payload.receiver_phone ?? "",
      shipping_cost: Number(payload.shipping_cost ?? 0),
      shipping_fee: Number(payload.shipping_fee ?? 0),
      calculation_type: payload.calculation_type ?? "kg",
      total_value: Number(payload.total_value ?? 0),
      total_weight_kg: payload.calculation_type === "kg" ? Number(payload.total_value ?? 0) : null,
      total_weight_ton: payload.calculation_type === "ton" ? Number(payload.total_value ?? 0) : null,
      total_cbm: payload.calculation_type === "cbm" ? Number(payload.total_value ?? 0) : null,
      delivery_address: deliveryLocation?.name ?? "Delivery Address",
      delivery_address_id: Number(payload.delivery_address_id),
      shipping_location_id: Number(shippingLocation?.id ?? payload.shipping_location_id),
      ordered_by_id: ownerId,
      ordered_to_id: targetUser.id,
      status: "pending",
      note: "",
      created_at: nowIso(),
      items,
      images: [],
    };

    getDb().shippingOrders.unshift(order);
    createInvoiceForOrder(order);
    getDb().notifications.push({
      id: getDb().nextIds.notification++,
      user_id: ownerId,
      title: "Order created",
      message: `Order ${order.shipping_code} has been created.`,
      is_read: false,
      created_at: nowIso(),
    });
    saveDb();

    return resolveResponse(config, toShippingOrderResponse(order), 201);
  }

  const shippingOrderMatch = pathname.match(/^\/shipping-orders\/(\d+)\/$/);
  if (shippingOrderMatch && method === "get") {
    const order = getDb().shippingOrders.find((item) => item.id === Number(shippingOrderMatch[1]));
    if (!order) return rejectResponse(config, 404, { detail: "Order not found." });
    return resolveResponse(config, toShippingOrderResponse(order));
  }

  if (shippingOrderMatch && method === "patch") {
    const order = getDb().shippingOrders.find((item) => item.id === Number(shippingOrderMatch[1]));
    if (!order) return rejectResponse(config, 404, { detail: "Order not found." });

    const payload = body as Partial<ShippingOrderRecord>;
    if (payload.delivery_address !== undefined) order.delivery_address = String(payload.delivery_address);
    if (payload.sender_phone !== undefined) order.sender_phone = String(payload.sender_phone);
    if (payload.receiver_phone !== undefined) order.receiver_phone = String(payload.receiver_phone);
    if (payload.note !== undefined) order.note = String(payload.note);
    if (payload.shipping_cost !== undefined) order.shipping_cost = Number(payload.shipping_cost ?? 0);
    if (payload.shipping_fee !== undefined) order.shipping_fee = Number(payload.shipping_fee ?? 0);
    if (payload.status !== undefined) order.status = String(payload.status);

    syncInvoiceForOrder(order.id);
    saveDb();
    return resolveResponse(config, toShippingOrderResponse(order));
  }

  if (shippingOrderMatch && method === "delete") {
    const orderId = Number(shippingOrderMatch[1]);
    const invoiceIds = getDb().invoices.filter((invoice) => invoice.shipping_order_id === orderId).map((invoice) => invoice.id);
    getDb().payments = getDb().payments.filter((payment) => !invoiceIds.includes(payment.invoice_id));
    getDb().invoices = getDb().invoices.filter((invoice) => invoice.shipping_order_id !== orderId);
    getDb().shippingOrders = getDb().shippingOrders.filter((order) => order.id !== orderId);
    saveDb();
    return resolveResponse(config, null, 204);
  }

  if (pathname === "/shipping-orders/update_status/" && method === "patch") {
    const payload = body as { id?: number; status?: string } | null;
    const order = getDb().shippingOrders.find((item) => item.id === Number(payload?.id));
    if (!order) return rejectResponse(config, 404, { detail: "Order not found." });
    order.status = String(payload?.status ?? order.status);
    saveDb();
    return resolveResponse(config, toShippingOrderResponse(order));
  }

  if (pathname === "/reports/dashboard_stats/" && method === "get") {
    const statusFilteredOrders = filterOrdersForUser(getDb().shippingOrders, currentUser);
    const orders = applyDateFilters(statusFilteredOrders, url.searchParams);
    const revenue = orders.reduce((sum, order) => sum + getInvoiceTotalFromOrder(order), 0);
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const pending = orders.filter((order) => order.status === "pending").length;
    const inTransit = orders.filter((order) => order.status === "in_transit").length;
    const period = url.searchParams.get("period") ?? "monthly";

    return resolveResponse(config, {
      period,
      total_orders: orders.length,
      delivered_orders: delivered,
      pending_orders: pending,
      in_transit_orders: inTransit,
      revenue,
      total_customers: getDb().users.filter((user) => user.role === "customer").length,
    });
  }

  if (pathname === "/reports/recent_orders/" && method === "get") {
    let orders = filterOrdersForUser(getDb().shippingOrders, currentUser);
    orders = applyDateFilters(orders, url.searchParams);

    const status = url.searchParams.get("status");
    if (status === "delivered") {
      orders = orders.filter((order) => order.status === "delivered");
    }
    if (status === "in_progress") {
      orders = orders.filter((order) => order.status === "pending" || order.status === "in_transit");
    }

    const limit = Number(url.searchParams.get("limit") ?? "5");
    return resolveResponse(config, buildRecentOrders(orders).slice(0, limit));
  }

  if (pathname === "/reports/export_data/" && method === "get") {
    const lines = [
      "Order ID,Product,Customer,Status,Shipping Cost,Shipping Fee,Date",
      ...buildRecentOrders(filterOrdersForUser(getDb().shippingOrders, currentUser)).map(
        (order) =>
          `${order.id},${order.product_name},${order.customer},${order.status},${order.shipping_cost ?? 0},${order.shipping_fee ?? 0},${order.date}`,
      ),
    ];

    const type = url.searchParams.get("type");
    if (type === "csv") {
      return resolveResponse(config, createBlob(lines.join("\n"), "text/csv"));
    }

    return resolveResponse(config, {
      generated_at: nowIso(),
      rows: lines.length - 1,
    });
  }

  if (pathname === "/invoices/" && method === "get") {
    const shippingOrderId = url.searchParams.get("shipping_order");
    const mine = url.searchParams.get("mine") === "true";

    let invoices = getDb().invoices;
    if (shippingOrderId) {
      invoices = invoices.filter((invoice) => invoice.shipping_order_id === Number(shippingOrderId));
    }
    if (mine && currentUser?.role !== "admin") {
      invoices = invoices.filter((invoice) => invoice.billed_to_id === currentUser?.id);
    }

    return resolveResponse(config, invoices.map(toInvoiceResponse));
  }

  const invoiceMatch = pathname.match(/^\/invoices\/(\d+)\/$/);
  if (invoiceMatch && method === "get") {
    const invoice = getDb().invoices.find((item) => item.id === Number(invoiceMatch[1]));
    if (!invoice) return rejectResponse(config, 404, { detail: "Invoice not found." });
    return resolveResponse(config, toInvoiceResponse(invoice));
  }

  const markPaidMatch = pathname.match(/^\/invoices\/(\d+)\/mark_as_paid\/$/);
  if (markPaidMatch && method === "post") {
    const invoice = getDb().invoices.find((item) => item.id === Number(markPaidMatch[1]));
    if (!invoice) return rejectResponse(config, 404, { detail: "Invoice not found." });
    invoice.status = "paid";
    invoice.payment_date = todayIso();
    invoice.payment_method = invoice.payment_method ?? "cash";

    const existingPayment = getDb().payments.find((payment) => payment.invoice_id === invoice.id);
    if (!existingPayment) {
      getDb().payments.push({
        id: getDb().nextIds.payment++,
        invoice_id: invoice.id,
        amount: invoice.total_amount,
        payment_date: invoice.payment_date,
        payment_method: invoice.payment_method,
        transaction_reference: `TXN-${invoice.id}-${Date.now()}`,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }

    saveDb();
    return resolveResponse(config, { success: true, invoice: toInvoiceResponse(invoice) });
  }

  const sendInvoiceMatch = pathname.match(/^\/invoices\/(\d+)\/send_invoice\/$/);
  if (sendInvoiceMatch && method === "post") {
    const invoice = getDb().invoices.find((item) => item.id === Number(sendInvoiceMatch[1]));
    if (!invoice) return rejectResponse(config, 404, { detail: "Invoice not found." });
    if (invoice.status !== "paid") {
      invoice.status = "sent";
    }
    saveDb();
    return resolveResponse(config, { success: true, invoice: toInvoiceResponse(invoice) });
  }

  if (pathname === "/payments/" && method === "get") {
    const mine = url.searchParams.get("mine") === "true";
    let payments = getDb().payments;
    if (mine && currentUser?.role !== "admin") {
      payments = payments.filter((payment) => {
        const invoice = getDb().invoices.find((item) => item.id === payment.invoice_id);
        return invoice?.billed_to_id === currentUser?.id;
      });
    }
    return resolveResponse(config, payments.map(toPaymentResponse));
  }

  if (pathname === "/payments/payment_stats/" && method === "get") {
    let invoices = getDb().invoices.slice();
    if (currentUser?.role !== "admin") {
      invoices = invoices.filter((invoice) => invoice.billed_to_id === currentUser?.id);
    }

    const paid = invoices.filter((invoice) => invoice.status === "paid");
    const unpaid = invoices.filter((invoice) => invoice.status !== "paid");
    const totalShippingFee = invoices.reduce((sum, invoice) => {
      const order = getDb().shippingOrders.find((item) => item.id === invoice.shipping_order_id);
      return sum + Number(order?.shipping_fee ?? 0);
    }, 0);

    return resolveResponse(config, {
      total_revenue: paid.reduce((sum, invoice) => sum + invoice.total_amount, 0),
      pending_revenue: unpaid.reduce((sum, invoice) => sum + invoice.total_amount, 0),
      paid_count: paid.length,
      total_count: invoices.length,
      success_rate: invoices.length ? (paid.length / invoices.length) * 100 : 0,
      payment_methods: paid.reduce<Record<string, number>>((acc, invoice) => {
        const method = invoice.payment_method ?? "unknown";
        acc[method] = (acc[method] ?? 0) + 1;
        return acc;
      }, {}),
      total_shipping_fee: totalShippingFee,
    });
  }

  if (pathname === "/notifications/" && method === "get") {
    const notifications = getDb().notifications
      .filter((notification) => notification.user_id === currentUser?.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(toNotificationResponse);
    return resolveResponse(config, notifications);
  }

  const notificationMatch = pathname.match(/^\/notifications\/(\d+)\/$/);
  if (notificationMatch && method === "patch") {
    const notification = getDb().notifications.find((item) => item.id === Number(notificationMatch[1]) && item.user_id === currentUser?.id);
    if (!notification) return rejectResponse(config, 404, { detail: "Notification not found." });
    notification.is_read = true;
    saveDb();
    return resolveResponse(config, toNotificationResponse(notification));
  }

  if (notificationMatch && method === "delete") {
    getDb().notifications = getDb().notifications.filter(
      (notification) => !(notification.id === Number(notificationMatch[1]) && notification.user_id === currentUser?.id),
    );
    saveDb();
    return resolveResponse(config, null, 204);
  }

  if (pathname === "/notifications/mark_all_read/" && method === "post") {
    let updated = 0;
    getDb().notifications.forEach((notification) => {
      if (notification.user_id === currentUser?.id && !notification.is_read) {
        notification.is_read = true;
        updated += 1;
      }
    });
    saveDb();
    return resolveResponse(config, { updated });
  }

  if (pathname === "/qr-orders/" && method === "get") {
    return resolveResponse(config, getDb().qrOrders.map(toQrOrderResponse));
  }

  if (pathname === "/qr-orders/check/" && method === "get") {
    const invoiceNumber = String(url.searchParams.get("invoice_number") ?? "").trim().toLowerCase();
    const exists = getDb().qrOrders.some((order) => order.invoice_number.toLowerCase() === invoiceNumber);
    return resolveResponse(config, { exists });
  }

  if (pathname === "/qr-orders/" && method === "post") {
    const payload = body as { invoice_number?: string; status?: string; note?: string; image_urls?: string[] } | null;
    const invoiceNumber = String(payload?.invoice_number ?? "").trim();

    if (!invoiceNumber) {
      return rejectResponse(config, 400, { invoice_number: ["This field is required."] });
    }

    if (getDb().qrOrders.some((order) => order.invoice_number.toLowerCase() === invoiceNumber.toLowerCase())) {
      return rejectResponse(config, 400, { invoice_number: ["Invoice number already exists."] });
    }

    const imageUrls = (payload?.image_urls ?? []).map((item) => getDb().uploadedImages[item] ?? item);
    const order: QrOrderRecord = {
      id: getDb().nextIds.qrOrder++,
      invoice_number: invoiceNumber,
      status: String(payload?.status ?? "in_transit"),
      note: String(payload?.note ?? ""),
      created_at: nowIso(),
      updated_at: nowIso(),
      image_urls: imageUrls,
    };

    getDb().qrOrders.unshift(order);
    getDb().notifications.push({
      id: getDb().nextIds.notification++,
      user_id: currentUser?.id ?? 1,
      title: "QR order created",
      message: `QR order ${invoiceNumber} created successfully.`,
      is_read: false,
      created_at: nowIso(),
    });
    saveDb();
    return resolveResponse(config, toQrOrderResponse(order), 201);
  }

  if (pathname === "/qr-orders/upload_image/" && method === "post") {
    const formData = config.data as FormData;
    const file = formData?.get("image");
    if (!(file instanceof File)) {
      return rejectResponse(config, 400, { error: "Image file is required." });
    }

    const dataUrl = await fileToDataUrl(file);
    const fileId = `mock-file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    getDb().uploadedImages[fileId] = dataUrl;
    saveDb();

    return resolveResponse(config, {
      telegram_file_id: fileId,
      image_url: dataUrl,
    }, 201);
  }

  const qrOrderMatch = pathname.match(/^\/qr-orders\/(\d+)\/$/);
  if (qrOrderMatch && method === "get") {
    const qrOrder = getDb().qrOrders.find((item) => item.id === Number(qrOrderMatch[1]));
    if (!qrOrder) return rejectResponse(config, 404, { detail: "QR order not found." });
    return resolveResponse(config, toQrOrderResponse(qrOrder));
  }

  if (qrOrderMatch && method === "delete") {
    getDb().qrOrders = getDb().qrOrders.filter((item) => item.id !== Number(qrOrderMatch[1]));
    saveDb();
    return resolveResponse(config, null, 204);
  }

  const qrOrderStatusMatch = pathname.match(/^\/qr-orders\/(\d+)\/update_status\/$/);
  if (qrOrderStatusMatch && method === "patch") {
    const qrOrder = getDb().qrOrders.find((item) => item.id === Number(qrOrderStatusMatch[1]));
    if (!qrOrder) return rejectResponse(config, 404, { detail: "QR order not found." });

    const payload = body as { status?: string; note?: string } | null;
    if (payload?.status) qrOrder.status = payload.status;
    if (payload?.note !== undefined) qrOrder.note = payload.note;
    qrOrder.updated_at = nowIso();
    saveDb();
    return resolveResponse(config, toQrOrderResponse(qrOrder));
  }

  const qrOrderAddImageMatch = pathname.match(/^\/qr-orders\/(\d+)\/add_image\/$/);
  if (qrOrderAddImageMatch && method === "post") {
    const qrOrder = getDb().qrOrders.find((item) => item.id === Number(qrOrderAddImageMatch[1]));
    const formData = config.data as FormData;
    const file = formData?.get("image");
    if (!qrOrder || !(file instanceof File)) {
      return rejectResponse(config, 400, { error: "Valid order and image are required." });
    }

    const dataUrl = await fileToDataUrl(file);
    qrOrder.image_urls.push(dataUrl);
    qrOrder.updated_at = nowIso();
    saveDb();
    return resolveResponse(config, toQrOrderResponse(qrOrder), 201);
  }

  if (pathname === "/qr-orders/export/csv/" && method === "get") {
    const csv = [
      "ID,Invoice Number,Status,Note,Created At",
      ...getDb().qrOrders.map((order) => `${order.id},${order.invoice_number},${order.status},${order.note},${order.created_at}`),
    ].join("\n");
    return resolveResponse(config, createBlob(csv, "text/csv"));
  }

  if (pathname === "/qr-orders/export/pdf/" && method === "get") {
    return resolveResponse(config, createBlob("Mock QR orders PDF export", "application/pdf"));
  }

  if (pathname === "/qr-order-searches/" && method === "get") {
    return resolveResponse(
      config,
      getDb().qrOrderSearches
        .slice()
        .sort((a, b) => new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime()),
    );
  }

  if (pathname === "/qr-order-searches/" && method === "post") {
    const payload = body as { invoice_number?: string; status?: "confirmed" | "no_confirm"; note?: string } | null;
    const record: QrOrderSearchRecord = {
      id: getDb().nextIds.qrOrderSearch++,
      invoice_number: String(payload?.invoice_number ?? ""),
      status: payload?.status === "confirmed" ? "confirmed" : "no_confirm",
      note: String(payload?.note ?? ""),
      searched_at: nowIso(),
      searched_by: currentUser?.id ?? null,
    };
    getDb().qrOrderSearches.unshift(record);
    saveDb();
    return resolveResponse(config, record, 201);
  }

  if (pathname === "/public/invoice/search/" && method === "get") {
    const invoiceNumber = String(url.searchParams.get("invoice_number") ?? "").trim().toLowerCase();
    const qrOrder = getDb().qrOrders.find((order) => order.invoice_number.toLowerCase() === invoiceNumber);
    const shippingOrder = getDb().shippingOrders.find((order) =>
      order.items.some((item) => item.invoice_number.toLowerCase() === invoiceNumber),
    );

    if (!qrOrder && !shippingOrder) {
      return rejectResponse(config, 404, { found: false, detail: "Order not found." });
    }

    if (shippingOrder) {
      const merged = {
        ...toShippingOrderResponse(shippingOrder),
        invoice_number: qrOrder?.invoice_number ?? shippingOrder.items[0]?.invoice_number,
        note: qrOrder?.note ?? shippingOrder.note,
        created_at: qrOrder?.created_at ?? shippingOrder.created_at,
        updated_at: qrOrder?.updated_at ?? shippingOrder.created_at,
        image_urls: qrOrder?.image_urls ?? shippingOrder.images.map((image) => image.image),
        message: "The shipment has arrived in Cambodia.",
      };

      return resolveResponse(config, { found: true, data: merged });
    }

    return resolveResponse(config, {
      found: true,
      data: {
        ...toQrOrderResponse(qrOrder!),
        message: "The shipment has not yet arrived in Cambodia.",
      },
    });
  }

  const orderDetailNewMatch = pathname.match(/^\/order-detail-new\/(\d+)\/$/);
  if (orderDetailNewMatch && method === "get") {
    const order = getDb().shippingOrders.find((item) => item.id === Number(orderDetailNewMatch[1]));
    if (!order) return rejectResponse(config, 404, { error: "Order not found." });
    return resolveResponse(config, toShippingOrderResponse(order));
  }

  const orderDetailNewStatusMatch = pathname.match(/^\/order-detail-new\/(\d+)\/update-status\/$/);
  if (orderDetailNewStatusMatch && method === "post") {
    const order = getDb().shippingOrders.find((item) => item.id === Number(orderDetailNewStatusMatch[1]));
    if (!order) return rejectResponse(config, 404, { error: "Order not found." });
    const payload = body as { status?: string } | null;
    if (payload?.status) {
      order.status = payload.status;
    }
    saveDb();
    return resolveResponse(config, { status: order.status });
  }

  const orderDetailNewUploadMatch = pathname.match(/^\/order-detail-new\/(\d+)\/upload-image\/$/);
  if (orderDetailNewUploadMatch && method === "post") {
    const order = getDb().shippingOrders.find((item) => item.id === Number(orderDetailNewUploadMatch[1]));
    const formData = config.data as FormData;
    const file = formData?.get("image");
    if (!order || !(file instanceof File)) {
      return rejectResponse(config, 400, { error: "Valid order and image are required." });
    }

    const dataUrl = await fileToDataUrl(file);
    order.images.push({
      id: getDb().nextIds.shippingOrderImage++,
      image: dataUrl,
      uploaded_at: nowIso(),
    });
    saveDb();
    return resolveResponse(config, { success: true }, 201);
  }

  return rejectResponse(config, 404, { detail: `Mock endpoint not implemented: ${method.toUpperCase()} ${pathname}` });
};
