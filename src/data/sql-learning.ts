export interface SqlCustomer {
  customer_id: number;
  customer_name: string;
  email: string;
  phone: string;
  segment: "Retail" | "Wholesale" | "Enterprise";
}

export interface SqlOrder {
  order_id: number;
  customer_id: number;
  order_date: string;
  order_value: number;
}

export interface SqlProduct {
  product_id: number;
  product_name: string;
  category: string;
}

export interface SqlOrderItem {
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface SqlCustomerProfile {
  customer_id: number;
  timezone: string;
  preferred_channel: string;
}

export const sqlCustomers: SqlCustomer[] = [
  {
    customer_id: 1001,
    customer_name: "North Retail",
    email: "north@example.com",
    phone: "021-440-810",
    segment: "Retail",
  },
  {
    customer_id: 1002,
    customer_name: "Coast Foods",
    email: "coast@example.com",
    phone: "021-440-811",
    segment: "Wholesale",
  },
  {
    customer_id: 1003,
    customer_name: "Alpine Labs",
    email: "alpine@example.com",
    phone: "021-440-812",
    segment: "Enterprise",
  },
];

export const sqlOrders: SqlOrder[] = [
  { order_id: 50001, customer_id: 1001, order_date: "2026-07-03", order_value: 420 },
  { order_id: 50002, customer_id: 1001, order_date: "2026-07-05", order_value: 185 },
  { order_id: 50003, customer_id: 1002, order_date: "2026-07-06", order_value: 760 },
  { order_id: 50004, customer_id: 1003, order_date: "2026-07-09", order_value: 510 },
];

export const sqlProducts: SqlProduct[] = [
  { product_id: 301, product_name: "Forecast Kit", category: "Planning" },
  { product_id: 305, product_name: "Sensor Pack", category: "Operations" },
];

export const sqlOrderItems: SqlOrderItem[] = [
  { order_id: 50001, product_id: 301, quantity: 2, unit_price: 150 },
  { order_id: 50001, product_id: 305, quantity: 1, unit_price: 120 },
  { order_id: 50002, product_id: 305, quantity: 1, unit_price: 185 },
  { order_id: 50003, product_id: 301, quantity: 4, unit_price: 190 },
  { order_id: 50004, product_id: 305, quantity: 3, unit_price: 170 },
];

export const sqlCustomerProfiles: SqlCustomerProfile[] = [
  { customer_id: 1001, timezone: "Pacific/Auckland", preferred_channel: "Email" },
  { customer_id: 1002, timezone: "Pacific/Auckland", preferred_channel: "Portal" },
  { customer_id: 1003, timezone: "Pacific/Auckland", preferred_channel: "Email" },
];

export const sqlDatasetCounts = {
  customers: sqlCustomers.length,
  orders: sqlOrders.length,
  products: sqlProducts.length,
  orderItems: sqlOrderItems.length,
  customerProfiles: sqlCustomerProfiles.length,
};

export const sqlOrderTotal = sqlOrders.reduce(
  (sum, order) => sum + order.order_value,
  0,
);

export const sqlLearningSeedSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  segment TEXT NOT NULL
);

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  order_date TEXT NOT NULL,
  order_value NUMERIC NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
);

CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE order_items (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders (order_id),
  FOREIGN KEY (product_id) REFERENCES products (product_id)
);

CREATE TABLE customer_profiles (
  customer_id INTEGER PRIMARY KEY,
  timezone TEXT NOT NULL,
  preferred_channel TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
);

INSERT INTO customers VALUES
  (1001, 'North Retail', 'north@example.com', '021-440-810', 'Retail'),
  (1002, 'Coast Foods', 'coast@example.com', '021-440-811', 'Wholesale'),
  (1003, 'Alpine Labs', 'alpine@example.com', '021-440-812', 'Enterprise');

INSERT INTO orders VALUES
  (50001, 1001, '2026-07-03', 420.00),
  (50002, 1001, '2026-07-05', 185.00),
  (50003, 1002, '2026-07-06', 760.00),
  (50004, 1003, '2026-07-09', 510.00);

INSERT INTO products VALUES
  (301, 'Forecast Kit', 'Planning'),
  (305, 'Sensor Pack', 'Operations');

INSERT INTO order_items VALUES
  (50001, 301, 2, 150.00),
  (50001, 305, 1, 120.00),
  (50002, 305, 1, 185.00),
  (50003, 301, 4, 190.00),
  (50004, 305, 3, 170.00);

INSERT INTO customer_profiles VALUES
  (1001, 'Pacific/Auckland', 'Email'),
  (1002, 'Pacific/Auckland', 'Portal'),
  (1003, 'Pacific/Auckland', 'Email');
`;
