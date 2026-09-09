require("dotenv").config();

const express = require("express");
const initSqlJs = require("sql.js");
const fs = require("fs");

const app = express();
const PORT = 3000;
const DB_FILE = "ms-restaurant-manager.db";
const managerSessions = new Map();
const ownerSessions = new Map();

app.use(express.json({ limit: "3mb" }));
app.use(express.static(__dirname));

async function startServer() {
  const SQL = await initSqlJs();

  const db = fs.existsSync(DB_FILE)
    ? new SQL.Database(fs.readFileSync(DB_FILE))
    : new SQL.Database();

  const saveDatabase = () => {
    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
  };

  try {
    db.run("ALTER TABLE staff ADD COLUMN staff_username TEXT");
  } catch (e) {}

  try {
    db.run("ALTER TABLE staff ADD COLUMN staff_password TEXT");
  } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      attendance_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PRESENT',
      check_in TEXT,
      check_out TEXT,
      time_in TEXT,
      time_out TEXT,
      time_in_photo TEXT,
      late_minutes INTEGER NOT NULL DEFAULT 0,
      worked_minutes INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(staff_id, attendance_date)
    );
  `);

  try {
    db.run("ALTER TABLE staff ADD COLUMN duty_start_time TEXT DEFAULT '09:00'");
  } catch (e) {}

  try {
    db.run("ALTER TABLE staff ADD COLUMN late_deduction_per_minute REAL DEFAULT 0");
  } catch (e) {}

  try {
    db.run("ALTER TABLE staff_salary ADD COLUMN late_deduction REAL DEFAULT 0");
  } catch (e) {}

  try {
    db.run("ALTER TABLE staff_salary ADD COLUMN fine_deduction REAL DEFAULT 0");
  } catch (e) {}




  try {
    db.run("ALTER TABLE staff ADD COLUMN duty_end_time TEXT DEFAULT '18:00'");
  } catch (e) {}

  try {
    db.run("ALTER TABLE staff ADD COLUMN duty_hours REAL DEFAULT 9");
  } catch (e) {}

  try {
    db.run("ALTER TABLE staff ADD COLUMN duty_days_per_month INTEGER DEFAULT 26");
  } catch (e) {}


  try {
    db.run("ALTER TABLE staff_attendance ADD COLUMN time_in TEXT");
  } catch (e) {}

  try {
    db.run("ALTER TABLE staff_attendance ADD COLUMN time_out TEXT");
  } catch (e) {}

  try {
    db.run("ALTER TABLE staff_attendance ADD COLUMN time_in_photo TEXT");
  } catch (e) {}

  try {
    db.run("ALTER TABLE staff_attendance ADD COLUMN late_minutes INTEGER DEFAULT 0");
  } catch (e) {}

  try {
    db.run("ALTER TABLE staff_attendance ADD COLUMN worked_minutes INTEGER DEFAULT 0");
  } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      UNIQUE(restaurant_id, name)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      price REAL NOT NULL DEFAULT 0,
      stock REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT,
      payment_reference TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );    CREATE TABLE IF NOT EXISTS running_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      invoice_no TEXT NOT NULL UNIQUE,
      order_no TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      order_type TEXT,
      table_no TEXT,
      order_taker_name TEXT,
      order_taker_phone TEXT,
      rider_name TEXT,
      rider_phone TEXT,
      delivery_address TEXT,
      notes TEXT,
      items TEXT NOT NULL,
      total REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cashier_tills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      till_name TEXT NOT NULL,
      lock_code TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      order_counter INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS business_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      business_date TEXT NOT NULL,
      opening_cash REAL NOT NULL DEFAULT 0,
      opened_at TEXT DEFAULT CURRENT_TIMESTAMP,
      closing_cash REAL,
      closed_at TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN'
    );

    CREATE TABLE IF NOT EXISTS order_takers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(restaurant_id, name)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'Staff',
      employee_code TEXT,
      joining_date TEXT,
      monthly_salary REAL NOT NULL DEFAULT 0,
      duty_hours REAL NOT NULL DEFAULT 9,
      duty_days_per_month INTEGER NOT NULL DEFAULT 26,
      duty_start_time TEXT DEFAULT '09:00',
      duty_end_time TEXT DEFAULT '18:00',
      late_deduction_per_minute REAL DEFAULT 0,
      staff_username TEXT,
      staff_password TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(restaurant_id, employee_code)
    );

    CREATE TABLE IF NOT EXISTS staff_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      attendance_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PRESENT',
      check_in TEXT,
      check_out TEXT,
      time_in TEXT,
      time_out TEXT,
      time_in_photo TEXT,
      late_minutes INTEGER NOT NULL DEFAULT 0,
      worked_minutes INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(staff_id, attendance_date)
    );

    CREATE TABLE IF NOT EXISTS staff_salary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      salary_month TEXT NOT NULL,
      basic_salary REAL NOT NULL DEFAULT 0,
      bonus REAL NOT NULL DEFAULT 0,
      deduction REAL NOT NULL DEFAULT 0,
      advance REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      payment_date TEXT,
      status TEXT NOT NULL DEFAULT 'UNPAID',
      notes TEXT,
      late_deduction REAL NOT NULL DEFAULT 0,
      fine_deduction REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(staff_id, salary_month)
    );

    CREATE TABLE IF NOT EXISTS staff_fines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  fine_date TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_account_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      transaction_date TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff_guidelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff_work_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      staff_id INTEGER NOT NULL,
      work_date TEXT NOT NULL,
      work_type TEXT NOT NULL DEFAULT 'GENERAL',
      order_count INTEGER NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

  `);


  // =========================
  // CASHIER TILL DATA MIGRATION
  // =========================

  const tableInfo = (table) => {
    const result = db.exec(`PRAGMA table_info(${table})`);
    return result.length
      ? result[0].values.map(row => row[1])
      : [];
  };

  if (!tableInfo("sales").includes("till_id")) {
    db.run("ALTER TABLE sales ADD COLUMN till_id INTEGER");
  }

  if (!tableInfo("sales").includes("business_day_id")) {
    db.run("ALTER TABLE sales ADD COLUMN business_day_id INTEGER");
  }

  if (!tableInfo("running_orders").includes("till_id")) {
    db.run("ALTER TABLE running_orders ADD COLUMN till_id INTEGER");
  }

  if (!tableInfo("running_orders").includes("business_day_id")) {
    db.run("ALTER TABLE running_orders ADD COLUMN business_day_id INTEGER");
  }

  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));



  // =========================
  // SALES PAYMENT REFERENCE MIGRATION
  // =========================

  const salesColumns = db.exec("PRAGMA table_info(sales)");

  const hasPaymentReference =
    salesColumns.length &&
    salesColumns[0].values.some(row => row[1] === "payment_reference");

  if (!hasPaymentReference) {
    db.run("ALTER TABLE sales ADD COLUMN payment_reference TEXT");
  }

  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));


  // =========================
  // ORDER TAKER / TRACKER API
  // =========================

  app.get("/api/order-takers", (req, res) => {
    const restaurantId = Number(req.query.restaurant_id || 1);

    try {
      const rows = db.exec(
        `SELECT id, name, phone, created_at
         FROM order_takers
         WHERE restaurant_id = ?
         ORDER BY name COLLATE NOCASE ASC`,
        [restaurantId]
      );

      const result = rows.length
        ? rows[0].values.map(row => ({
            id: row[0],
            name: row[1],
            phone: row[2] || "",
            created_at: row[3]
          }))
        : [];

      res.json(result);
    } catch (e) {
      console.error("Order Taker GET error:", e);
      res.status(500).json({error:e.message});
    }
  });

  app.post("/api/order-takers", (req, res) => {
    const restaurantId = Number(req.body.restaurant_id || 1);
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (!name) {
      return res.status(400).json({error:"Order Taker name required"});
    }

    try {
      const checkRows = db.exec(`
        SELECT id, name
        FROM order_takers
        WHERE restaurant_id = ${restaurantId}
        AND LOWER(name) = LOWER('${name.replace(/'/g, "''")}')
        LIMIT 1
      `);

      if (checkRows.length && checkRows[0].values.length) {
        return res.status(409).json({
          error:"Order Taker with this name already exists."
        });
      }

      db.run(`
        INSERT INTO order_takers (restaurant_id, name, phone)
        VALUES (?, ?, ?)
      `, [restaurantId, name, phone]);

      fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

      const rows = db.exec(`
        SELECT id, name, phone, created_at
        FROM order_takers
        WHERE restaurant_id = ${restaurantId}
        AND name = '${name.replace(/'/g, "''")}'
        ORDER BY id DESC
        LIMIT 1
      `);

      const row = rows.length ? rows[0].values[0] : null;

      res.json(row ? {
        id: row[0],
        name: row[1],
        phone: row[2] || "",
        created_at: row[3]
      } : {success:true});
    } catch (e) {
      res.status(400).json({error:e.message});
    }
  });

  app.delete("/api/order-takers/:id", (req, res) => {
    const id = Number(req.params.id);

    try {
      db.run(`DELETE FROM order_takers WHERE id = ?`, [id]);

      fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

      res.json({success:true});
    } catch (e) {
      res.status(500).json({error:e.message});
    }
  });

  // =========================
  // STATUS
  // =========================

  app.get("/api/status", (req, res) => {
    res.json({
      success: true,
      app: "MS Restaurant Manager",
      status: "Server Running"
    });
  });

  // =========================
  // RESTAURANTS
  // =========================

  app.post("/api/restaurants", requireOwnerAuth, (req, res) => {
    const { name, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Restaurant name required"
      });
    }

    db.run(
      `INSERT INTO restaurants (name, phone, address)
       VALUES (?, ?, ?)`,
      [name.trim(), phone || "", address || ""]
    );

    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

    res.json({
      success: true,
      message: "Restaurant added successfully"
    });
  });

  app.get("/api/restaurants", requireOwnerAuth, (req, res) => {
    const result = db.exec(`
      SELECT id, name, phone, address, created_at
      FROM restaurants
      ORDER BY id DESC
    `);

    if (!result.length) {
      return res.json([]);
    }

    const columns = result[0].columns;

    const restaurants = result[0].values.map(row =>
      Object.fromEntries(
        columns.map((column, i) => [column, row[i]])
      )
    );

    res.json(restaurants);
  });  // =========================
  // MANAGERS
  // =========================

  app.post("/api/managers", requireOwnerAuth, (req, res) => {
    const { restaurant_id, username, password } = req.body;

    if (!restaurant_id || !username || !password) {
      return res.status(400).json({
        success: false,
        error: "Restaurant, username and password required"
      });
    }

    try {
      db.run(
        `INSERT INTO users
         (restaurant_id, username, password, role)
         VALUES (?, ?, ?, ?)`,
        [restaurant_id, username.trim(), password, "manager"]
      );

      fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

      res.json({
        success: true,
        message: "Manager created successfully"
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "Username already exists"
      });
    }
  });

  app.get("/api/managers", requireOwnerAuth, (req, res) => {
    const result = db.exec(`
      SELECT
        users.id,
        users.username,
        users.restaurant_id,
        restaurants.name AS restaurant_name
      FROM users
      LEFT JOIN restaurants
        ON users.restaurant_id = restaurants.id
      WHERE users.role = 'manager'
      ORDER BY users.id DESC
    `);

    if (!result.length) {
      return res.json([]);
    }

    const columns = result[0].columns;

    const managers = result[0].values.map(row =>
      Object.fromEntries(
        columns.map((column, i) => [column, row[i]])
      )
    );

    res.json(managers);
  });

  // =========================
  // =========================
  // =========================
  // CASHIER TILL LOGIN + DAY LOCK
  // =========================

  app.post("/api/cashier-till-login", (req, res) => {

    const { till_id, lock_code } = req.body;

    if (!till_id || !lock_code) {
      return res.status(400).json({
        success: false,
        error: "Till ID and Lock Code required"
      });
    }

    const dayRows = db.exec(`
      SELECT id, business_date, status
      FROM business_days
      WHERE restaurant_id = 1
      ORDER BY id DESC
      LIMIT 1
    `);

    if (
      !dayRows.length ||
      !dayRows[0].values.length ||
      dayRows[0].values[0][2] !== "OPEN"
    ) {
      return res.status(403).json({
        success: false,
        error: "Day is not open. Manager must start the business day first."
      });
    }

    const safeCode = String(lock_code).replace(/'/g, "''");

    const result = db.exec(`
      SELECT
        id,
        restaurant_id,
        till_name,
        active,
        order_counter
      FROM cashier_tills
      WHERE id = ${Number(till_id)}
        AND restaurant_id = 1
        AND lock_code = '${safeCode}'
      LIMIT 1
    `);

    if (!result.length || !result[0].values.length) {
      return res.status(401).json({
        success: false,
        error: "Invalid Lock Code / PIN"
      });
    }

    const columns = result[0].columns;

    const till = Object.fromEntries(
      columns.map((column, i) => [column, result[0].values[0][i]])
    );

    if (Number(till.active) !== 1) {
      return res.status(403).json({
        success: false,
        error: "This Cashier Till is disabled."
      });
    }

    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");

    if (typeof global.cashierSessions === "undefined") {
      global.cashierSessions = new Map();
    }

    global.cashierSessions.set(token, {
      till_id: Number(till.id),
      restaurant_id: Number(till.restaurant_id),
      created_at: Date.now()
    });

    res.json({
      success: true,
      message: "Cashier Till login successful",
      token,
      till,
      business_date: dayRows[0].values[0][1],
      business_day_id: dayRows[0].values[0][0]
    });
  });

  // MANAGER LOGIN
  // =========================

  app.post("/api/manager-login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password required"
      });
    }

    const result = db.exec(`
      SELECT
        users.id,
        users.username,
        users.restaurant_id,
        restaurants.name AS restaurant_name
      FROM users
      LEFT JOIN restaurants
        ON users.restaurant_id = restaurants.id
      WHERE users.username = '${username.replace(/'/g, "''")}'
        AND users.password = '${password.replace(/'/g, "''")}'
        AND users.role = 'manager'
      LIMIT 1
    `);

    if (!result.length || !result[0].values.length) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password"
      });
    }

    const columns = result[0].columns;

    const manager = Object.fromEntries(
      columns.map((column, i) => [column, result[0].values[0][i]])
    );

    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");

    managerSessions.set(token, {
      manager_id: Number(manager.id),
      restaurant_id: Number(manager.restaurant_id),
      role: manager.role || "manager",
      created_at: Date.now()
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      manager
    });
  });

  // =========================
  // MANAGER AUTH MIDDLEWARE
  // =========================

  function requireManagerAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Manager authentication required"
      });
    }

    const token = authHeader.slice(7).trim();
    const session = managerSessions.get(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired manager session"
      });
    }

    req.manager = session;
    next();
  }

  // =========================
  // OWNER LOGIN
  // =========================

  app.post("/api/owner-login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password required"
      });
    }

    const result = db.exec(`
      SELECT
        id,
        username,
        password,
        role
      FROM users
      WHERE username = '${username.replace(/'/g, "''")}'
        AND role = 'owner'
      LIMIT 1
    `);

    if (!result.length || !result[0].values.length) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password"
      });
    }

    const owner = Object.fromEntries(
      result[0].columns.map((column, i) => [
        column,
        result[0].values[0][i]
      ])
    );

    const crypto = require("crypto");

    let validPassword = false;

    if (owner.password && owner.password.startsWith("sha256$")) {
      const storedHash = owner.password.slice(7);
      const inputHash = crypto
        .createHash("sha256")
        .update(password, "utf8")
        .digest("hex");

      validPassword = storedHash === inputHash;
    }

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password"
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    ownerSessions.set(token, {
      owner_id: Number(owner.id),
      role: "owner",
      created_at: Date.now()
    });

    res.json({
      success: true,
      message: "Owner login successful",
      token,
      owner: {
        id: Number(owner.id),
        username: owner.username,
        role: "owner"
      }
    });
  });

  // =========================
  // OWNER AUTH MIDDLEWARE
  // =========================

  function requireOwnerAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Owner authentication required"
      });
    }

    const token = authHeader.slice(7).trim();
    const session = ownerSessions.get(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired owner session"
      });
    }

    req.owner = session;
    next();
  }

  // =========================
  // OWNER CURRENT SESSION
  // =========================

  app.get("/api/owner/me", requireOwnerAuth, (req, res) => {
    res.json({
      success: true,
      owner: req.owner
    });
  });

  // =========================
  // MANAGER AUTH TEST
  // =========================

  app.get("/api/manager-auth-test", requireManagerAuth, (req, res) => {
    res.json({
      success: true,
      message: "Manager authentication verified",
      manager: req.manager
    });
  });

  // =========================
  // MANAGER CURRENT SESSION
  // =========================

  app.get("/api/manager/me", requireManagerAuth, (req, res) => {
    res.json({
      success: true,
      manager: req.manager
    });
  });

  // =========================
  // CASHIER / TILL MANAGEMENT
  // =========================

  app.get("/api/cashier-tills", (req, res) => {
    const restaurantId = Number(req.query.restaurant_id || 1);

    try {
      const rows = db.exec(`
        SELECT id, restaurant_id, till_name, lock_code, active, order_counter, created_at
        FROM cashier_tills
        WHERE restaurant_id = ?
        ORDER BY id ASC
      `, [restaurantId]);

      const tills = rows.length ? rows[0].values.map(row => ({
        id: row[0],
        restaurant_id: row[1],
        till_name: row[2],
        lock_code: row[3],
        active: Number(row[4]) === 1,
        order_counter: Number(row[5] || 0),
        created_at: row[6]
      })) : [];

      res.json(tills);

    } catch (e) {
      console.error("CASHIER TILLS GET ERROR:", e);
      res.status(500).json({error:e.message});
    }
  });

  app.post("/api/cashier-tills", (req, res) => {
    const restaurantId = Number(req.body.restaurant_id || 1);
    const tillName = String(req.body.till_name || "").trim();
    const lockCode = String(req.body.lock_code || "").trim();

    if (!tillName || !lockCode) {
      return res.status(400).json({
        success:false,
        error:"Till name and lock code required"
      });
    }

    try {
      const duplicate = db.exec(`
        SELECT id
        FROM cashier_tills
        WHERE restaurant_id = ?
        AND LOWER(till_name) = LOWER(?)
        LIMIT 1
      `, [restaurantId, tillName]);

      if (duplicate.length && duplicate[0].values.length) {
        return res.status(409).json({
          success:false,
          error:"This Till name already exists."
        });
      }

      db.run(`
        INSERT INTO cashier_tills
        (restaurant_id, till_name, lock_code, active, order_counter)
        VALUES (?, ?, ?, 1, 0)
      `, [restaurantId, tillName, lockCode]);

      fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

      res.json({
        success:true,
        message:"Cashier Till added successfully"
      });

    } catch (e) {
      console.error("CASHIER TILL ADD ERROR:", e);
      res.status(500).json({
        success:false,
        error:e.message
      });
    }
  });

  app.put("/api/cashier-tills/:id", (req, res) => {
    const id = Number(req.params.id);
    const tillName = String(req.body.till_name || "").trim();
    const lockCode = String(req.body.lock_code || "").trim();
    const active = req.body.active === undefined
      ? 1
      : (req.body.active ? 1 : 0);

    if (!id || !tillName || !lockCode) {
      return res.status(400).json({
        success:false,
        error:"Till name and lock code required"
      });
    }

    try {
      const duplicate = db.exec(`
        SELECT id
        FROM cashier_tills
        WHERE restaurant_id = 1
        AND LOWER(till_name) = LOWER(?)
        AND id != ?
        LIMIT 1
      `, [tillName, id]);

      if (duplicate.length && duplicate[0].values.length) {
        return res.status(409).json({
          success:false,
          error:"This Till name already exists."
        });
      }

      db.run(`
        UPDATE cashier_tills
        SET till_name = ?, lock_code = ?, active = ?
        WHERE id = ? AND restaurant_id = 1
      `, [tillName, lockCode, active, id]);

      fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

      res.json({
        success:true,
        message:"Cashier Till updated successfully"
      });

    } catch (e) {
      console.error("CASHIER TILL UPDATE ERROR:", e);
      res.status(500).json({
        success:false,
        error:e.message
      });
    }
  });

  app.delete("/api/cashier-tills/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success:false,
        error:"Invalid Till ID"
      });
    }

    try {
      db.run(`
        DELETE FROM cashier_tills
        WHERE id = ? AND restaurant_id = 1
      `, [id]);

      fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

      res.json({
        success:true,
        message:"Cashier Till deleted successfully"
      });

    } catch (e) {
      console.error("CASHIER TILL DELETE ERROR:", e);
      res.status(500).json({
        success:false,
        error:e.message
      });
    }
  });

  // =========================
  // CATEGORIES
  // =========================

  app.post("/api/categories", (req, res) => {
    try {
      const { restaurant_id, name } = req.body;
      const categoryName = String(name || "").trim();

      if (!restaurant_id || !categoryName) {
        return res.status(400).json({
          success: false,
          error: "Restaurant ID aur category name required hai"
        });
      }

      db.run(
        "INSERT INTO categories (restaurant_id, name) VALUES (?, ?)",
        [Number(restaurant_id), categoryName]
      );

      fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

      res.json({
        success: true,
        message: "Category added",
        category: {
          name: categoryName
        }
      });

    } catch (e) {
      if (String(e.message).includes("UNIQUE")) {
        return res.status(400).json({
          success: false,
          error: "Ye category pehle se mojood hai"
        });
      }

      res.status(500).json({
        success: false,
        error: e.message
      });
    }
  });

  app.delete("/api/categories/:id", (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Category ID required"
        });
      }

      const result = db.exec(
        "SELECT restaurant_id, name FROM categories WHERE id = ?",
        [id]
      );

      if (!result.length || !result[0].values.length) {
        return res.status(404).json({
          success: false,
          error: "Category nahi mili"
        });
      }

      const restaurantId = result[0].values[0][0];
      const name = result[0].values[0][1];

      const products = db.exec(
        "SELECT COUNT(*) FROM products WHERE restaurant_id = ? AND TRIM(category) = ?",
        [restaurantId, name]
      );

      const productCount = products[0].values[0][0];

      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          error: "Is category mein "+productCount+" product hain. Pehle products ko doosri category mein move karo."
        });
      }

      db.run(
        "DELETE FROM categories WHERE id = ?",
        [id]
      );

      fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

      res.json({
        success: true,
        message: "Category deleted"
      });

    } catch (e) {
      res.status(500).json({
        success: false,
        error: e.message
      });
    }
  });

  app.get("/api/categories", (req, res) => {
    try {
      const restaurantId = Number(req.query.restaurant_id);

      const result = db.exec(
        "SELECT id, restaurant_id, name FROM categories WHERE restaurant_id = ? ORDER BY name",
        [restaurantId]
      );

      if (!result.length) return res.json([]);

      res.json(result[0].values.map(row => ({
        id: row[0],
        restaurant_id: row[1],
        name: row[2]
      })));

    } catch (e) {
      res.status(500).json({
        success: false,
        error: e.message
      });
    }
  });

  // =========================
  // PRODUCTS
  // =========================

  app.post("/api/products", (req, res) => {
    const { restaurant_id, name, category, price, stock } = req.body;

    if (!restaurant_id || !name) {
      return res.status(400).json({
        success: false,
        error: "Restaurant and product name required"
      });
    }

    db.run(
      `INSERT INTO products
       (restaurant_id, name, category, price, stock)
       VALUES (?, ?, ?, ?, ?)`,
      [
        restaurant_id,
        name.trim(),
        category || "",
        Number(price) || 0,
        Number(stock) || 0
      ]
    );

    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

    res.json({
      success: true,
      message: "Product added successfully"
    });
  });

  app.get("/api/products", (req, res) => {
    const restaurant_id = Number(req.query.restaurant_id);

    if (!restaurant_id) {
      return res.status(400).json({
        success: false,
        error: "restaurant_id required"
      });
    }

    const result = db.exec(`
      SELECT id, restaurant_id, name, category, price, stock
      FROM products
      WHERE restaurant_id = ${restaurant_id}
      ORDER BY id DESC
    `);

    if (!result.length) {
      return res.json([]);
    }

    const columns = result[0].columns;

    const products = result[0].values.map(row =>
      Object.fromEntries(
        columns.map((column, i) => [column, row[i]])
      )
    );

    res.json(products);
  });


  // =========================
  // CREATE SALE
  // =========================

  app.post("/api/sales", (req, res) => {

    const {
      restaurant_id,
      items,
      total,
      payment_method,
      payment_reference
    } = req.body;

    if (!restaurant_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Sale items required"
      });
    }

    try {

      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ")
        ? auth.slice(7).trim()
        : "";

      const sessions =
        typeof global.cashierSessions !== "undefined"
          ? global.cashierSessions
          : null;

      const session = sessions ? sessions.get(token) : null;

      if (!session) {
        return res.status(401).json({
          success: false,
          error: "Cashier session required"
        });
      }

      const dayRows = db.exec(
        `SELECT id, status
         FROM business_days
         WHERE restaurant_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [Number(restaurant_id)]
      );

      const currentDay =
        dayRows.length && dayRows[0].values.length
          ? dayRows[0].values[0]
          : null;

      if (!currentDay || currentDay[1] !== "OPEN") {
        return res.status(409).json({
          success: false,
          error: "Day is not open. Please start the business day first."
        });
      }

      const businessDayId = Number(currentDay[0]);
      const tillId = Number(session.till_id);

      if (Number(session.restaurant_id) !== Number(restaurant_id)) {
        return res.status(403).json({
          success: false,
          error: "Cashier restaurant access denied."
        });
      }

      const tillRows = db.exec(
        `SELECT id, active
         FROM cashier_tills
         WHERE id = ? AND restaurant_id = ?
         LIMIT 1`,
        [tillId, Number(restaurant_id)]
      );

      if (!tillRows.length || !tillRows[0].values.length) {
        return res.status(403).json({
          success: false,
          error: "Cashier Till not found."
        });
      }

      if (Number(tillRows[0].values[0][1]) !== 1) {
        return res.status(403).json({
          success: false,
          error: "This Cashier Till is disabled."
        });
      }

      db.run("BEGIN TRANSACTION");

      for (const item of items) {

        const result = db.exec(
          `SELECT stock FROM products
           WHERE id = ? AND restaurant_id = ?`,
          [Number(item.product_id), Number(restaurant_id)]
        );

        if (!result.length || !result[0].values.length) {
          throw new Error("Product not found");
        }

        const stock = Number(result[0].values[0][0]);
        const qty = Number(item.qty);

        if (!Number.isInteger(qty) || qty < 1) {
          throw new Error("Invalid quantity");
        }

        if (stock < qty) {
          throw new Error(
            "Not enough stock for product ID " + item.product_id
          );
        }

        db.run(
          `UPDATE products
           SET stock = stock - ?
           WHERE id = ? AND restaurant_id = ?`,
          [qty, Number(item.product_id), Number(restaurant_id)]
        );
      }

      db.run(
        `INSERT INTO sales
         (
           restaurant_id,
           total,
           payment_method,
           payment_reference,
           till_id,
           business_day_id
         )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          Number(restaurant_id),
          Number(total) || 0,
          payment_method || "Cash",
          payment_reference || "",
          tillId,
          businessDayId
        ]
      );

      db.run("COMMIT");

      fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

      res.json({
        success: true,
        message: "Sale created successfully",
        till_id: tillId,
        business_day_id: businessDayId
      });

    } catch (error) {

      try {
        db.run("ROLLBACK");
      } catch {}

      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // =========================
  // RUNNING ORDERS
  // =========================

  app.post("/api/running-orders", (req, res) => {

    const {
      restaurant_id,
      customer_name,
      customer_phone,
      order_type,
      table_no,
      order_taker_name,
      order_taker_phone,
      rider_name,
      rider_phone,
      delivery_address,
      notes,
      items,
      total
    } = req.body;

    if (
      !restaurant_id ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Order details and items required"
      });
    }

    try {

      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ")
        ? auth.slice(7).trim()
        : "";

      const sessions =
        typeof global.cashierSessions !== "undefined"
          ? global.cashierSessions
          : null;

      const session = sessions ? sessions.get(token) : null;

      if (!session) {
        return res.status(401).json({
          success: false,
          error: "Cashier session required"
        });
      }

      if (Number(session.restaurant_id) !== Number(restaurant_id)) {
        return res.status(403).json({
          success: false,
          error: "Cashier restaurant access denied."
        });
      }

      const dayRows = db.exec(
        `SELECT id, status
         FROM business_days
         WHERE restaurant_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [Number(restaurant_id)]
      );

      if (
        !dayRows.length ||
        !dayRows[0].values.length ||
        dayRows[0].values[0][1] !== "OPEN"
      ) {
        return res.status(409).json({
          success: false,
          error: "Day is not open. Please start the business day first."
        });
      }

      const businessDayId = Number(dayRows[0].values[0][0]);
      const tillId = Number(session.till_id);

      const tillRows = db.exec(
        `SELECT id, till_name, active, order_counter
         FROM cashier_tills
         WHERE id = ? AND restaurant_id = ?
         LIMIT 1`,
        [tillId, Number(restaurant_id)]
      );

      if (!tillRows.length || !tillRows[0].values.length) {
        return res.status(403).json({
          success: false,
          error: "Cashier Till not found."
        });
      }

      const till = tillRows[0].values[0];

      if (Number(till[2]) !== 1) {
        return res.status(403).json({
          success: false,
          error: "This Cashier Till is disabled."
        });
      }

      const nextOrderNumber = Number(till[3] || 0) + 1;

      const orderNo = "ORD-" + nextOrderNumber;

      const invoiceNo =
        "INV-" + businessDayId + "-" + tillId + "-" + nextOrderNumber;

      db.run("BEGIN TRANSACTION");

      db.run(
        `UPDATE cashier_tills
         SET order_counter = ?
         WHERE id = ? AND restaurant_id = ?`,
        [
          nextOrderNumber,
          tillId,
          Number(restaurant_id)
        ]
      );

      db.run(
        `INSERT INTO running_orders
        (
          restaurant_id,
          invoice_no,
          order_no,
          customer_name,
          customer_phone,
          order_type,
          table_no,
          order_taker_name,
          order_taker_phone,
          rider_name,
          rider_phone,
          delivery_address,
          notes,
          items,
          total,
          till_id,
          business_day_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(restaurant_id),
          invoiceNo,
          orderNo,
          customer_name || "",
          customer_phone || "",
          order_type || "",
          table_no || "",
          order_taker_name || "",
          order_taker_phone || "",
          rider_name || "",
          rider_phone || "",
          delivery_address || "",
          notes || "",
          JSON.stringify(items),
          Number(total) || 0,
          tillId,
          businessDayId
        ]
      );

      const orderId = db.exec(
        `SELECT last_insert_rowid()`
      )[0].values[0][0];

      db.run("COMMIT");

      fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

      res.json({
        success: true,
        message: "Running order saved successfully",
        order_id: Number(orderId),
        order_no: orderNo,
        invoice_no: invoiceNo,
        till_id: tillId,
        business_day_id: businessDayId
      });

    } catch (error) {

      try {
        db.run("ROLLBACK");
      } catch {}

      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get("/api/running-orders", (req, res) => {

    const { restaurant_id } = req.query;

    if (!restaurant_id) {
      return res.status(400).json({
        success: false,
        error: "Restaurant ID required"
      });
    }

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ")
      ? auth.slice(7).trim()
      : "";

    const sessions =
      typeof global.cashierSessions !== "undefined"
        ? global.cashierSessions
        : null;

    const session = sessions ? sessions.get(token) : null;

    let result;

    if (session) {

      if (Number(session.restaurant_id) !== Number(restaurant_id)) {
        return res.status(403).json({
          success: false,
          error: "Cashier restaurant access denied."
        });
      }

      const dayRows = db.exec(
        `SELECT id, status
         FROM business_days
         WHERE restaurant_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [Number(restaurant_id)]
      );

      if (
        !dayRows.length ||
        !dayRows[0].values.length ||
        dayRows[0].values[0][1] !== "OPEN"
      ) {
        return res.status(409).json({
          success: false,
          error: "Day is not open."
        });
      }

      const businessDayId = Number(dayRows[0].values[0][0]);
      const tillId = Number(session.till_id);

      result = db.exec(
        `SELECT *
         FROM running_orders
         WHERE restaurant_id = ?
           AND till_id = ?
           AND business_day_id = ?
         ORDER BY id DESC`,
        [Number(restaurant_id), tillId, businessDayId]
      );

    } else {

      result = db.exec(
        `SELECT *
         FROM running_orders
         WHERE restaurant_id = ?
         ORDER BY id DESC`,
        [Number(restaurant_id)]
      );
    }

    if (!result.length) {
      return res.json([]);
    }

    const columns = result[0].columns;

    const orders = result[0].values.map(row => {

      const order = Object.fromEntries(
        columns.map((column, i) => [column, row[i]])
      );

      try {
        order.items = JSON.parse(order.items || "[]");
      } catch {
        order.items = [];
      }

      return order;
    });

    res.json(orders);
  });

  app.delete("/api/running-orders/:id", (req, res) => {

    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Order ID required"
      });
    }

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ")
      ? auth.slice(7).trim()
      : "";

    const sessions =
      typeof global.cashierSessions !== "undefined"
        ? global.cashierSessions
        : null;

    const session = sessions ? sessions.get(token) : null;

    try {

      if (session) {

        const dayRows = db.exec(
          `SELECT id, status
           FROM business_days
           WHERE restaurant_id = ?
           ORDER BY id DESC
           LIMIT 1`,
          [Number(session.restaurant_id)]
        );

        if (
          !dayRows.length ||
          !dayRows[0].values.length ||
          dayRows[0].values[0][1] !== "OPEN"
        ) {
          return res.status(409).json({
            success: false,
            error: "Day is not open."
          });
        }

        const businessDayId = Number(dayRows[0].values[0][0]);
        const tillId = Number(session.till_id);

        const orderRows = db.exec(
          `SELECT id
           FROM running_orders
           WHERE id = ?
             AND restaurant_id = ?
             AND till_id = ?
             AND business_day_id = ?
           LIMIT 1`,
          [
            id,
            Number(session.restaurant_id),
            tillId,
            businessDayId
          ]
        );

        if (!orderRows.length || !orderRows[0].values.length) {
          return res.status(403).json({
            success: false,
            error: "You cannot remove another Cashier Till order."
          });
        }

        db.run(
          `DELETE FROM running_orders
           WHERE id = ?
             AND restaurant_id = ?
             AND till_id = ?
             AND business_day_id = ?`,
          [
            id,
            Number(session.restaurant_id),
            tillId,
            businessDayId
          ]
        );

      } else {

        db.run(
          `DELETE FROM running_orders WHERE id = ?`,
          [id]
        );
      }

      fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

      res.json({
        success: true,
        message: "Running order removed"
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        error: error.message
      });

    }
  });

  // =========================
  // SALES HISTORY
  // =========================

  app.get("/api/sales", (req, res) => {
    const { restaurant_id } = req.query;

    if (!restaurant_id) {
      return res.status(400).json({
        success: false,
        error: "Restaurant ID required"
      });
    }

    const result = db.exec(
      `SELECT
         id,
         restaurant_id,
         total,
         payment_method,
         payment_reference,
         till_id,
         business_day_id,
         created_at
       FROM sales
       WHERE restaurant_id = ?
       ORDER BY id DESC`,
      [Number(restaurant_id)]
    );

    const sales = result.length
      ? result[0].values.map(row => ({
          id: row[0],
          restaurant_id: row[1],
          total: row[2],
          payment_method: row[3] || "Cash",
          payment_reference: row[4] || "",
          till_id: row[5] || null,
          business_day_id: row[6] || null,
          created_at: row[7] || ""
        }))
      : [];

    res.json(sales);
  });

  // =========================
  // EDIT PRODUCT
  // =========================

  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { name, category, price, stock } = req.body;

    const result = db.exec(
      `SELECT * FROM products WHERE id = ?`,
      [Number(id)]
    );

    if (!result.length || !result[0].values.length) {
      return res.status(404).json({
        success: false,
        error: "Product not found"
      });
    }

    const old = result[0].values[0];

    db.run(
      `UPDATE products
       SET name = ?, category = ?, price = ?, stock = ?
       WHERE id = ?`,
      [
        name !== undefined && name.trim() ? name.trim() : old[2],
        category !== undefined ? category : old[3],
        price !== undefined ? Number(price) : old[4],
        stock !== undefined ? Number(stock) : old[5],
        Number(id)
      ]
    );

    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

    res.json({
      success: true,
      message: "Product updated successfully"
    });
  });

  // =========================
  // DELETE PRODUCT
  // =========================

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;

    db.run(
      `DELETE FROM products WHERE id = ?`,
      [Number(id)]
    );

    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

    res.json({
      success: true,
      message: "Product deleted successfully"
    });
  });

  // =========================
  
// =========================
// ADD STOCK / RESTOCK
// =========================

app.post("/api/products/:id/stock", (req, res) => {
  try {
    const id = Number(req.params.id);
    const qty = Number(req.body.quantity);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID"
      });
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid stock quantity required"
      });
    }

    const result = db.exec(
      `SELECT id, restaurant_id, name, stock
       FROM products
       WHERE id = ?`,
      [id]
    );

    if (!result.length || !result[0].values.length) {
      return res.status(404).json({
        success: false,
        error: "Product not found"
      });
    }

    const row = result[0].values[0];

    const productId = Number(row[0]);
    const restaurantId = Number(row[1]);
    const productName = row[2];
    const oldStock = Number(row[3]) || 0;
    const newStock = oldStock + qty;

    db.run(
      `UPDATE products
       SET stock = ?
       WHERE id = ?`,
      [newStock, productId]
    );

    db.run(
      `INSERT INTO inventory
       (restaurant_id, product_id, quantity, type)
       VALUES (?, ?, ?, ?)`,
      [restaurantId, productId, qty, "RESTOCK"]
    );

    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

    res.json({
      success: true,
      message: "Stock added successfully",
      product: {
        id: productId,
        name: productName,
        old_stock: oldStock,
        added: qty,
        new_stock: newStock
      }
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});


// =========================
// STOCK HISTORY
// =========================

app.get("/api/stock-history", (req, res) => {
  try {
    const restaurantId = Number(req.query.restaurant_id);

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: "restaurant_id required"
      });
    }

    const result = db.exec(
      `SELECT
        inventory.id,
        inventory.product_id,
        products.name AS product_name,
        inventory.quantity,
        inventory.type,
        inventory.created_at
       FROM inventory
       INNER JOIN products
         ON products.id = inventory.product_id
       WHERE inventory.restaurant_id = ?
       ORDER BY inventory.id DESC`,
      [restaurantId]
    );

    if (!result.length) {
      return res.json([]);
    }

    const columns = result[0].columns;

    const history = result[0].values.map(row =>
      Object.fromEntries(
        columns.map((column, i) => [column, row[i]])
      )
    );

    res.json(history);

  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

// SERVER
  // =========================

app.put("/api/order-takers/:id", (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();

  if (!id || !name) {
    return res.status(400).json({
      error: "Staff / Waiter name required"
    });
  }

  try {
    const restaurantId = 1;

    const checkRows = db.exec(
      `SELECT id FROM order_takers
       WHERE restaurant_id = ?
       AND LOWER(name) = LOWER(?)
       AND id != ?
       LIMIT 1`,
      [restaurantId, name, id]
    );

    if (checkRows.length && checkRows[0].values.length) {
      return res.status(409).json({
        error: "Staff / Waiter with this name already exists."
      });
    }

    db.run(
      `UPDATE order_takers
       SET name = ?, phone = ?
       WHERE id = ? AND restaurant_id = ?`,
      [name, phone, id, restaurantId]
    );

    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

    res.json({
      success: true,
      id,
      name,
      phone
    });

  } catch (e) {
    console.error("Order Taker UPDATE error:", e);
    res.status(500).json({
      error: e.message
    });
  }
});


app.get("/api/business-day", (req, res) => {
  const restaurantId = Number(req.query.restaurant_id || 1);

  try {
    const rows = db.exec(`
      SELECT id, restaurant_id, business_date, opening_cash,
             opened_at, closing_cash, closed_at, status
      FROM business_days
      WHERE restaurant_id = ?
      ORDER BY id DESC
      LIMIT 1
    `, [restaurantId]);

    const row = rows.length && rows[0].values.length
      ? rows[0].values[0]
      : null;

    res.json(row ? {
      id: row[0],
      restaurant_id: row[1],
      business_date: row[2],
      opening_cash: row[3],
      opened_at: row[4],
      closing_cash: row[5],
      closed_at: row[6],
      status: row[7]
    } : null);

  } catch (e) {
    res.status(500).json({error:e.message});
  }
});

  app.get("/api/business-days/history", (req, res) => {
    const restaurantId = Number(req.query.restaurant_id || 1);
    try {
      const rows = db.exec(`SELECT id, restaurant_id, business_date, opening_cash, opened_at, closing_cash, closed_at, status FROM business_days WHERE restaurant_id = ? ORDER BY id DESC`, [restaurantId]);
      const history = rows.length ? rows[0].values.map(row => ({
        id: row[0],
        restaurant_id: row[1],
        business_date: row[2],
        opening_cash: Number(row[3] || 0),
        opened_at: row[4],
        closing_cash: row[5] === null ? null : Number(row[5]),
        closed_at: row[6],
        status: row[7]
      })) : [];
      res.json(history);
    } catch (e) {
      console.error("DAY HISTORY ERROR:", e);
      res.status(500).json({error:e.message});
    }
  });

app.post("/api/business-day/start", (req, res) => {
  const restaurantId = Number(req.body.restaurant_id || 1);
  const openingCash = Number(req.body.opening_cash || 0);

  if (!Number.isFinite(openingCash) || openingCash < 0) {
    return res.status(400).json({
      error:"Invalid opening cash"
    });
  }

  try {
    const openRows = db.exec(`
      SELECT id
      FROM business_days
      WHERE restaurant_id = ?
      AND status = 'OPEN'
      LIMIT 1
    `, [restaurantId]);

    if (openRows.length && openRows[0].values.length) {
      return res.status(409).json({
        error:"A business day is already open."
      });
    }

    const now = new Date();
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);

    db.run(`
      INSERT INTO business_days
      (restaurant_id, business_date, opening_cash, status)
      VALUES (?, ?, ?, 'OPEN')
    `, [restaurantId, date, openingCash]);

    // Reset order numbering for every Cashier Till at the start of a new business day
    db.run(`
      UPDATE cashier_tills
      SET order_counter = 0
      WHERE restaurant_id = ?
    `, [restaurantId]);

    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

    res.json({
      success:true,
      message:"Business day started",
      business_date:date,
      opening_cash:openingCash
    });

  } catch (e) {
    res.status(500).json({error:e.message});
  }
});

app.post("/api/business-day/close", (req, res) => {
  const restaurantId = Number(req.body.restaurant_id || 1);
  const closingCash = Number(req.body.closing_cash);

  if (!Number.isFinite(closingCash) || closingCash < 0) {
    return res.status(400).json({
      error:"Invalid closing cash"
    });
  }

  try {
    const rows = db.exec(`
      SELECT id, opened_at
      FROM business_days
      WHERE restaurant_id = ?
      AND status = 'OPEN'
      ORDER BY id DESC
      LIMIT 1
    `, [restaurantId]);

    if (!rows.length || !rows[0].values.length) {
      return res.status(404).json({
        error:"No open business day found."
      });
    }

    const id = rows[0].values[0][0];
    const openedAt = rows[0].values[0][1];

    const runningRows = db.exec(`
      SELECT COUNT(*)
      FROM running_orders
      WHERE restaurant_id = ?
      AND created_at >= ?
    `, [restaurantId, openedAt]);

    const runningCount =
      runningRows.length && runningRows[0].values.length
        ? Number(runningRows[0].values[0][0] || 0)
        : 0;

    if (runningCount > 0) {
      return res.status(409).json({
        error:
          "Day Close blocked. " +
          runningCount +
          " Running Order(s) still open. Please complete or close them first.",
        running_orders: runningCount
      });
    }

    db.run(`
      UPDATE business_days
      SET closing_cash = ?,
          closed_at = CURRENT_TIMESTAMP,
          status = 'CLOSED'
      WHERE id = ?
    `, [closingCash, id]);

    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));

    res.json({
      success:true,
      message:"Business day closed",
      closing_cash:closingCash
    });

  } catch (e) {
    res.status(500).json({error:e.message});
  }
});


app.get("/api/business-day/till-report", (req, res) => {
  const restaurantId = Number(req.query.restaurant_id || 1);

  try {
    const dayRows = db.exec(`
      SELECT id, business_date, status
      FROM business_days
      WHERE restaurant_id = ?
      ORDER BY id DESC
      LIMIT 1
    `, [restaurantId]);

    if (!dayRows.length || !dayRows[0].values.length) {
      return res.json(null);
    }

    const day = dayRows[0].values[0];
    const dayId = Number(day[0]);

    const tillRows = db.exec(`
      SELECT id, till_name, active
      FROM cashier_tills
      WHERE restaurant_id = ?
      ORDER BY id ASC
    `, [restaurantId]);

    const salesRows = db.exec(`
      SELECT
        COALESCE(till_id, 0),
        COALESCE(SUM(total), 0),
        COUNT(*)
      FROM sales
      WHERE restaurant_id = ?
      AND business_day_id = ?
      GROUP BY till_id
    `, [restaurantId, dayId]);

    const tillMap = {};

    if (tillRows.length) {
      for (const row of tillRows[0].values) {
        tillMap[Number(row[0])] = {
          till_id: Number(row[0]),
          till_name: row[1],
          active: Number(row[2]) === 1,
          total_sales: 0,
          transactions: 0
        };
      }
    }

    const unassigned = {
      total_sales: 0,
      transactions: 0
    };

    if (salesRows.length) {
      for (const row of salesRows[0].values) {
        const tillId = Number(row[0] || 0);
        const sales = Number(row[1] || 0);
        const transactions = Number(row[2] || 0);

        if (tillId === 0) {
          unassigned.total_sales += sales;
          unassigned.transactions += transactions;
          continue;
        }

        if (!tillMap[tillId]) {
          tillMap[tillId] = {
            till_id: tillId,
            till_name: "Till #" + tillId + " (Historical)",
            active: false,
            total_sales: 0,
            transactions: 0
          };
        }

        tillMap[tillId].total_sales += sales;
        tillMap[tillId].transactions += transactions;
      }
    }

    const report = Object.values(tillMap).sort(
      (a, b) => a.till_id - b.till_id
    );

    const combinedSales =
      report.reduce((sum, till) => sum + till.total_sales, 0)
      + unassigned.total_sales;

    const combinedTransactions =
      report.reduce((sum, till) => sum + till.transactions, 0)
      + unassigned.transactions;

    res.json({
      business_day_id: dayId,
      business_date: day[1],
      status: day[2],
      combined: {
        total_sales: combinedSales,
        transactions: combinedTransactions
      },
      tills: report,
      unassigned
    });

  } catch (e) {
    console.error("TILL REPORT ERROR:", e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

app.get("/api/business-day/date-report", (req, res) => {
  const restaurantId = Number(req.query.restaurant_id || 1);
  const date = String(req.query.date || "").trim();

  if (!date) {
    return res.status(400).json({error:"Date is required"});
  }

  try {
    const dayRows = db.exec(`
      SELECT id, business_date, opening_cash, opened_at,
             closing_cash, closed_at, status
      FROM business_days
      WHERE restaurant_id = ? AND business_date = ?
      ORDER BY id DESC
      LIMIT 1
    `, [restaurantId, date]);

    if (!dayRows.length || !dayRows[0].values.length) {
      return res.json(null);
    }

    const d = dayRows[0].values[0];
    const businessDayId = Number(d[0]);

    const salesRows = db.exec(`
      SELECT payment_method, till_id, total
      FROM sales
      WHERE restaurant_id = ? AND business_day_id = ?
      ORDER BY id DESC
    `, [restaurantId, businessDayId]);

    const sales = salesRows.length ? salesRows[0].values : [];

    const paymentMap = {};
    const tillMap = {};

    sales.forEach(row => {
      const method = String(row[0] || "Cash");
      const tillId = row[1] === null ? null : Number(row[1]);
      const total = Number(row[2] || 0);

      if (!paymentMap[method]) {
        paymentMap[method] = {
          payment_method:method,
          total_sales:0,
          transactions:0
        };
      }

      paymentMap[method].total_sales += total;
      paymentMap[method].transactions += 1;

      const key = tillId === null ? "unassigned" : String(tillId);

      if (!tillMap[key]) {
        tillMap[key] = {
          till_id:tillId,
          payments:{}
        };
      }

      if (!tillMap[key].payments[method]) {
        tillMap[key].payments[method] = {
          payment_method:method,
          total_sales:0,
          transactions:0
        };
      }

      tillMap[key].payments[method].total_sales += total;
      tillMap[key].payments[method].transactions += 1;
    });

    const totalSales = sales.reduce(
      (sum,row)=>sum+Number(row[2]||0),0
    );

    res.json({
      business_day_id:businessDayId,
      business_date:d[1],
      opening_cash:Number(d[2] || 0),
      opened_at:d[3],
      closing_cash:d[4] === null ? null : Number(d[4]),
      closed_at:d[5],
      status:d[6],
      combined:{
        total_sales:totalSales,
        transactions:sales.length
      },
      payments:Object.values(paymentMap),
      tills:Object.values(tillMap).map(t => ({
        till_id:t.till_id,
        payments:Object.values(t.payments)
      }))
    });

  } catch(e) {
    console.error("DATE REPORT ERROR:", e);
    res.status(500).json({error:e.message});
  }
});

app.get("/api/business-day/payment-report", (req, res) => {
  const restaurantId = Number(req.query.restaurant_id || 1);

  try {
    const dayRows = db.exec(`
      SELECT id, business_date, status
      FROM business_days
      WHERE restaurant_id = ?
      ORDER BY id DESC
      LIMIT 1
    `, [restaurantId]);

    if (!dayRows.length || !dayRows[0].values.length) {
      return res.json(null);
    }

    const day = dayRows[0].values[0];
    const dayId = Number(day[0]);

    const paymentRows = db.exec(`
      SELECT
        COALESCE(payment_method, 'Cash'),
        COALESCE(SUM(total), 0),
        COUNT(*)
      FROM sales
      WHERE restaurant_id = ?
      AND business_day_id = ?
      GROUP BY COALESCE(payment_method, 'Cash')
      ORDER BY COALESCE(SUM(total), 0) DESC
    `, [restaurantId, dayId]);

    const tillRows = db.exec(`
      SELECT
        COALESCE(till_id, 0),
        COALESCE(payment_method, 'Cash'),
        COALESCE(SUM(total), 0),
        COUNT(*)
      FROM sales
      WHERE restaurant_id = ?
      AND business_day_id = ?
      GROUP BY COALESCE(till_id, 0), COALESCE(payment_method, 'Cash')
      ORDER BY COALESCE(till_id, 0), COALESCE(SUM(total), 0) DESC
    `, [restaurantId, dayId]);

    const combined = [];
    const combinedMap = {};

    if (paymentRows.length) {
      for (const row of paymentRows[0].values) {
        const method = String(row[0] || "Cash");
        const total = Number(row[1] || 0);
        const transactions = Number(row[2] || 0);

        combinedMap[method] = {
          payment_method: method,
          total_sales: total,
          transactions: transactions
        };

        combined.push(combinedMap[method]);
      }
    }

    const tills = {};

    if (tillRows.length) {
      for (const row of tillRows[0].values) {
        const tillId = Number(row[0] || 0);
        const method = String(row[1] || "Cash");
        const total = Number(row[2] || 0);
        const transactions = Number(row[3] || 0);

        if (!tills[tillId]) {
          tills[tillId] = {
            till_id: tillId,
            payments: []
          };
        }

        tills[tillId].payments.push({
          payment_method: method,
          total_sales: total,
          transactions: transactions
        });
      }
    }

    res.json({
      business_day_id: dayId,
      business_date: day[1],
      status: day[2],
      combined,
      tills: Object.values(tills)
    });

  } catch (e) {
    console.error("PAYMENT REPORT ERROR:", e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

app.get("/api/business-day/date-range-report", (req, res) => {
  const restaurantId = Number(req.query.restaurant_id || 1);
  const from = String(req.query.from || "").trim();
  const to = String(req.query.to || "").trim();

  if (!from || !to) {
    return res.status(400).json({
      error: "Both from and to dates are required"
    });
  }

  if (from > to) {
    return res.status(400).json({
      error: "From date cannot be after To date"
    });
  }

  try {
    const salesRows = db.exec(`
      SELECT
        s.payment_method,
        s.till_id,
        s.total,
        bd.business_date
      FROM sales s
      INNER JOIN business_days bd
        ON bd.id = s.business_day_id
      WHERE s.restaurant_id = ?
        AND bd.restaurant_id = ?
        AND bd.business_date >= ?
        AND bd.business_date <= ?
      ORDER BY bd.business_date ASC, s.id ASC
    `, [restaurantId, restaurantId, from, to]);

    const sales = salesRows.length
      ? salesRows[0].values
      : [];

    const paymentMap = {};
    const tillMap = {};

    let totalSales = 0;
    let transactions = 0;

    sales.forEach(row => {
      const method = String(row[0] || "Cash");
      const tillId = row[1] === null ? null : Number(row[1]);
      const total = Number(row[2] || 0);

      totalSales += total;
      transactions += 1;

      if (!paymentMap[method]) {
        paymentMap[method] = {
          payment_method: method,
          total_sales: 0,
          transactions: 0
        };
      }

      paymentMap[method].total_sales += total;
      paymentMap[method].transactions += 1;

      const key = tillId === null ? "unassigned" : String(tillId);

      if (!tillMap[key]) {
        tillMap[key] = {
          till_id: tillId,
          total_sales: 0,
          transactions: 0,
          payments: {}
        };
      }

      tillMap[key].total_sales += total;
      tillMap[key].transactions += 1;

      if (!tillMap[key].payments[method]) {
        tillMap[key].payments[method] = {
          payment_method: method,
          total_sales: 0,
          transactions: 0
        };
      }

      tillMap[key].payments[method].total_sales += total;
      tillMap[key].payments[method].transactions += 1;
    });

    const tills = Object.values(tillMap)
      .sort((a, b) => {
        const aa = a.till_id === null ? 0 : a.till_id;
        const bb = b.till_id === null ? 0 : b.till_id;
        return aa - bb;
      })
      .map(t => ({
        till_id: t.till_id,
        total_sales: t.total_sales,
        transactions: t.transactions,
        payments: Object.values(t.payments)
      }));

    res.json({
      from,
      to,
      combined: {
        total_sales: totalSales,
        transactions
      },
      payments: Object.values(paymentMap),
      tills
    });

  } catch (e) {
    console.error("DATE RANGE REPORT ERROR:", e);

    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

app.get("/api/business-day/summary", (req, res) => {
  const restaurantId = Number(req.query.restaurant_id || 1);

  try {
    const dayRows = db.exec(`
      SELECT id, business_date, opening_cash, opened_at,
             closing_cash, closed_at, status
      FROM business_days
      WHERE restaurant_id = ?
      ORDER BY id DESC
      LIMIT 1
    `, [restaurantId]);

    if (!dayRows.length || !dayRows[0].values.length) {
      return res.json(null);
    }

    const d = dayRows[0].values[0];
    const dayId = d[0];

    const salesRows = db.exec(`
      SELECT
        COALESCE(SUM(total), 0),
        COUNT(*)
      FROM sales
      WHERE restaurant_id = ?
      AND business_day_id = ?
      AND LOWER(COALESCE(payment_method, 'Cash')) = 'cash'
    `, [restaurantId, dayId]);

    const sales = salesRows.length && salesRows[0].values.length
      ? Number(salesRows[0].values[0][0] || 0)
      : 0;

    const transactions = salesRows.length && salesRows[0].values.length
      ? Number(salesRows[0].values[0][1] || 0)
      : 0;

    const runningRows = db.exec(`
      SELECT COUNT(*)
      FROM running_orders
      WHERE restaurant_id = ?
      AND business_day_id = ?
    `, [restaurantId, dayId]);

    const runningOrders =
      runningRows.length && runningRows[0].values.length
        ? Number(runningRows[0].values[0][0] || 0)
        : 0;

    const openingCash = Number(d[2] || 0);
    const closingCash = d[4] === null ? null : Number(d[4]);

    const expectedCash = openingCash + sales;
    const cashDifference =
      closingCash === null ? null : closingCash - expectedCash;

    res.json({
      id: dayId,
      business_date: d[1],
      opening_cash: openingCash,
      opened_at: d[3],
      closing_cash: closingCash,
      closed_at: d[5],
      status: d[6],
      total_sales: sales,
      total_transactions: transactions,
      running_orders: runningOrders,
      expected_cash: expectedCash,
      cash_difference: cashDifference
    });

  } catch (e) {
    console.error("DAY SUMMARY ERROR:", e);
    res.status(500).json({error:e.message});
  }
});


  // =========================
  // STAFF MANAGEMENT APIs
  // =========================

  app.get("/api/staff", (req, res) => {
    const restaurantId = Number(req.query.restaurant_id || 1);

    const rows = db.exec(`
      SELECT
        id,
        restaurant_id,
        name,
        phone,
        role,
        employee_code,
        joining_date,
        monthly_salary,
        status,
        notes,
        created_at,
        staff_username,
        staff_password,
        duty_start_time,
        late_deduction_per_minute,
        duty_end_time,
        duty_hours,
        duty_days_per_month
      FROM staff
      WHERE restaurant_id = ?
      ORDER BY status ASC, name ASC
    `, [restaurantId]);

    const staff = rows.length ? rows[0].values.map(r => ({
      id: r[0],
      restaurant_id: r[1],
      name: r[2],
      phone: r[3],
      role: r[4],
      employee_code: r[5],
      joining_date: r[6],
      monthly_salary: r[7],
      status: r[8],
      notes: r[9],
      created_at: r[10],
      staff_username: r[11],
      staff_password: r[12],
      duty_start_time: r[13],
      late_deduction_per_minute: r[14],
      duty_end_time: r[15],
      duty_hours: r[16],
      duty_days_per_month: r[17]
    })) : [];

    res.json({ success: true, staff });
  });


  app.post("/api/staff", (req, res) => {
    const restaurantId = Number(req.body.restaurant_id || 1);
    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Staff name is required"
      });
    }

    try {
      db.run(`
        INSERT INTO staff
        (restaurant_id, name, phone, role, employee_code, joining_date, monthly_salary, duty_hours, duty_days_per_month, duty_start_time, duty_end_time, status, notes, staff_username, staff_password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        restaurantId,
        name,
        req.body.phone || null,
        req.body.role || "Staff",
        req.body.employee_code || null,
        req.body.joining_date || null,
        Number(req.body.monthly_salary || 0),
        Number(req.body.duty_hours || 9),
        Number(req.body.duty_days_per_month || 26),
        req.body.duty_start_time || "09:00",
        req.body.duty_end_time || "18:00",
        req.body.status || "ACTIVE",
        req.body.notes || null,
        req.body.staff_username || null,
        req.body.staff_password || null
      ]);

      saveDatabase();

      const result = db.exec(`SELECT last_insert_rowid() AS id`);
      const id = result[0].values[0][0];

      res.json({ success: true, id });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e.message
      });
    }
  });


  app.put("/api/staff/:id", (req, res) => {
    const id = Number(req.params.id);

    try {
      db.run(`
        UPDATE staff
        SET name = ?,
            phone = ?,
            role = ?,
            employee_code = ?,
            joining_date = ?,
            monthly_salary = ?,
            duty_hours = ?,
            duty_days_per_month = ?,
            duty_start_time = ?,
            duty_end_time = ?,
            status = ?,
            notes = ?,
            staff_username = ?,
            staff_password = ?
        WHERE id = ?
      `, [
        String(req.body.name || "").trim(),
        req.body.phone || null,
        req.body.role || "Staff",
        req.body.employee_code || null,
        req.body.joining_date || null,
        Number(req.body.monthly_salary || 0),
        Number(req.body.duty_hours || 9),
        Number(req.body.duty_days_per_month || 26),
        req.body.duty_start_time || "09:00",
        req.body.duty_end_time || "18:00",
        req.body.status || "ACTIVE",
        req.body.notes || null,
        req.body.staff_username || null,
        req.body.staff_password || null,
        id
      ]);

      saveDatabase();
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e.message
      });
    }
  });


  app.delete("/api/staff/:id", (req, res) => {
    const id = Number(req.params.id);

    try {
      db.run(`DELETE FROM staff WHERE id = ?`, [id]);
      db.run(`DELETE FROM staff_attendance WHERE staff_id = ?`, [id]);
      db.run(`DELETE FROM staff_salary WHERE staff_id = ?`, [id]);
      db.run(`DELETE FROM staff_account_transactions WHERE staff_id = ?`, [id]);

      saveDatabase();

      res.json({ success: true });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e.message
      });
    }
  });


  app.get("/api/staff/:id/attendance", (req, res) => {
    const staffId = Number(req.params.id);

    const rows = db.exec(`
      SELECT *
      FROM staff_attendance
      WHERE staff_id = ?
      ORDER BY attendance_date DESC
    `, [staffId]);

    const attendance = rows.length
      ? rows[0].values.map(r => ({
          id: r[0],
          restaurant_id: r[1],
          staff_id: r[2],
          attendance_date: r[3],
          status: r[4],
          check_in: r[5],
          check_out: r[6],
          notes: r[7],
          created_at: r[8]
        }))
      : [];

    res.json({ success: true, attendance });
  });


  app.post("/api/staff/:id/attendance", (req, res) => {
    const staffId = Number(req.params.id);
    const restaurantId = Number(req.body.restaurant_id || 1);
    const date = String(req.body.attendance_date || "").trim();

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Attendance date is required"
      });
    }

    try {
      db.run(`
        INSERT INTO staff_attendance
        (restaurant_id, staff_id, attendance_date, status, check_in, check_out, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(staff_id, attendance_date)
        DO UPDATE SET
          status = excluded.status,
          check_in = excluded.check_in,
          check_out = excluded.check_out,
          notes = excluded.notes
      `, [
        restaurantId,
        staffId,
        date,
        req.body.status || "PRESENT",
        req.body.check_in || null,
        req.body.check_out || null,
        req.body.notes || null
      ]);

      saveDatabase();
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e.message
      });
    }
  });


  // ================= STAFF SELF TIME IN / TIME OUT =================

  app.post("/api/staff/me/time-in", requireStaffAuth, (req, res) => {
    try {
      const staff = req.staff;

      const now = new Date();
      const pad = n => String(n).padStart(2, "0");

      const attendanceDate =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const currentTime =
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const existing = db.exec(`
        SELECT id, time_in, time_out, status
        FROM staff_attendance
        WHERE staff_id = ${Number(staff.id)}
          AND attendance_date = '${attendanceDate}'
        LIMIT 1
      `);

      if (existing.length && existing[0].values.length) {
        const row = existing[0].values[0];

        if (row[1]) {
          return res.status(400).json({
            success: false,
            error: "TIME IN already recorded for today",
            attendance: {
              id: row[0],
              time_in: row[1],
              time_out: row[2],
              status: row[3]
            }
          });
        }
      }

      let lateMinutes = 0;
      let status = "PRESENT";

      const dutyStart = String(
        staff.duty_start_time || "09:00"
      );

      const startParts = dutyStart.split(":").map(Number);
      const startHour = Number(startParts[0] || 9);
      const startMinute = Number(startParts[1] || 0);

      const currentTotalMinutes =
        now.getHours() * 60 + now.getMinutes();

      const dutyStartMinutes =
        startHour * 60 + startMinute;

      if (currentTotalMinutes > dutyStartMinutes) {
        status = "LATE";
        lateMinutes = currentTotalMinutes - dutyStartMinutes;
      }

      let photoPath = null;

      // Camera/photo proof is sent as a compressed data URL.
      if (req.body.photo) {
        const photo = String(req.body.photo);

        if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(photo)) {
          return res.status(400).json({
            success: false,
            error: "Invalid attendance photo format"
          });
        }

        const base64Data = photo.replace(
          /^data:image\/(jpeg|jpg|png|webp);base64,/i,
          ""
        );

        const buffer = Buffer.from(base64Data, "base64");

        if (!buffer.length || buffer.length > 2 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            error: "Attendance photo is missing or too large"
          });
        }

        const photoDir = require("path").join(__dirname, "staff-photos");

        if (!fs.existsSync(photoDir)) {
          fs.mkdirSync(photoDir, { recursive: true });
        }

        const fileName =
          `staff_${Number(staff.id)}_${attendanceDate}_${Date.now()}.jpg`;

        const fullPath = require("path").join(photoDir, fileName);

        fs.writeFileSync(fullPath, buffer);

        photoPath = `/staff-photos/${fileName}`;
      }

      db.run(`
        INSERT INTO staff_attendance
        (
          restaurant_id,
          staff_id,
          attendance_date,
          status,
          check_in,
          time_in,
          time_in_photo,
          late_minutes,
          worked_minutes,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        Number(staff.restaurant_id),
        Number(staff.id),
        attendanceDate,
        status,
        currentTime,
        currentTime,
        photoPath,
        lateMinutes,
        0,
        status === "LATE"
          ? `Late by ${lateMinutes} minute(s)`
          : "Staff self TIME IN"
      ]);

      saveDatabase();

      res.json({
        success: true,
        message: status === "LATE"
          ? `TIME IN recorded — Late by ${lateMinutes} minute(s)`
          : "TIME IN recorded successfully",
        attendance: {
          attendance_date: attendanceDate,
          time_in: currentTime,
          status,
          late_minutes: lateMinutes,
          time_in_photo: photoPath
        }
      });

    } catch (e) {
      console.error("Staff TIME IN error:", e);

      res.status(500).json({
        success: false,
        error: e.message
      });
    }
  });


  app.post("/api/staff/me/time-out", requireStaffAuth, (req, res) => {
    try {
      const staff = req.staff;

      const now = new Date();
      const pad = n => String(n).padStart(2, "0");

      const attendanceDate =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const currentTime =
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const result = db.exec(`
        SELECT
          id,
          time_in,
          time_out,
          status,
          late_minutes
        FROM staff_attendance
        WHERE staff_id = ${Number(staff.id)}
          AND attendance_date = '${attendanceDate}'
        LIMIT 1
      `);

      if (!result.length || !result[0].values.length) {
        return res.status(400).json({
          success: false,
          error: "TIME IN is required before TIME OUT"
        });
      }

      const row = result[0].values[0];

      const attendanceId = Number(row[0]);
      const timeIn = row[1];
      const timeOut = row[2];

      if (!timeIn) {
        return res.status(400).json({
          success: false,
          error: "TIME IN is required before TIME OUT"
        });
      }

      if (timeOut) {
        return res.status(400).json({
          success: false,
          error: "TIME OUT already recorded for today",
          attendance: {
            time_in: timeIn,
            time_out: timeOut
          }
        });
      }

      const parseTime = value => {
        const parts = String(value).split(":").map(Number);

        return (
          Number(parts[0] || 0) * 60 +
          Number(parts[1] || 0)
        );
      };

      const timeInMinutes = parseTime(timeIn);
      const timeOutMinutes =
        now.getHours() * 60 + now.getMinutes();

      let workedMinutes = timeOutMinutes - timeInMinutes;

      if (workedMinutes < 0) {
        workedMinutes += 24 * 60;
      }

      db.run(`
        UPDATE staff_attendance
        SET
          check_out = ?,
          time_out = ?,
          worked_minutes = ?
        WHERE id = ?
          AND staff_id = ?
      `, [
        currentTime,
        currentTime,
        workedMinutes,
        attendanceId,
        Number(staff.id)
      ]);

      saveDatabase();

      res.json({
        success: true,
        message: "TIME OUT recorded successfully",
        attendance: {
          attendance_date: attendanceDate,
          time_in: timeIn,
          time_out: currentTime,
          worked_minutes: workedMinutes,
          late_minutes: Number(row[4] || 0)
        }
      });

    } catch (e) {
      console.error("Staff TIME OUT error:", e);

      res.status(500).json({
        success: false,
        error: e.message
      });
    }
  });


  app.get("/api/staff/me/today-attendance", requireStaffAuth, (req, res) => {
    try {
      const now = new Date();
      const pad = n => String(n).padStart(2, "0");

      const attendanceDate =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const result = db.exec(`
        SELECT *
        FROM staff_attendance
        WHERE staff_id = ${Number(req.staff.id)}
          AND attendance_date = '${attendanceDate}'
        LIMIT 1
      `);

      if (!result.length || !result[0].values.length) {
        return res.json({
          success: true,
          attendance: null
        });
      }

      const columns = result[0].columns;
      const row = result[0].values[0];

      const attendance = {};

      columns.forEach((column, index) => {
        attendance[column] = row[index];
      });

      res.json({
        success: true,
        attendance
      });

    } catch (e) {
      res.status(500).json({
        success: false,
        error: e.message
      });
    }
  });



  // ================= STAFF SELF TIME IN / TIME OUT =================

  app.post("/api/staff/me/time-in", requireStaffAuth, (req, res) => {
    try {
      const staff = req.staff;

      const now = new Date();
      const pad = n => String(n).padStart(2, "0");

      const attendanceDate =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const currentTime =
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const existing = db.exec(`
        SELECT id, time_in, time_out, status
        FROM staff_attendance
        WHERE staff_id = ${Number(staff.id)}
          AND attendance_date = '${attendanceDate}'
        LIMIT 1
      `);

      if (existing.length && existing[0].values.length) {
        const row = existing[0].values[0];

        if (row[1]) {
          return res.status(400).json({
            success: false,
            error: "TIME IN already recorded for today",
            attendance: {
              id: row[0],
              time_in: row[1],
              time_out: row[2],
              status: row[3]
            }
          });
        }
      }

      let lateMinutes = 0;
      let status = "PRESENT";

      const dutyStart = String(
        staff.duty_start_time || "09:00"
      );

      const startParts = dutyStart.split(":").map(Number);
      const startHour = Number(startParts[0] || 9);
      const startMinute = Number(startParts[1] || 0);

      const currentTotalMinutes =
        now.getHours() * 60 + now.getMinutes();

      const dutyStartMinutes =
        startHour * 60 + startMinute;

      if (currentTotalMinutes > dutyStartMinutes) {
        status = "LATE";
        lateMinutes = currentTotalMinutes - dutyStartMinutes;
      }

      let photoPath = null;

      // Camera/photo proof is sent as a compressed data URL.
      if (req.body.photo) {
        const photo = String(req.body.photo);

        if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(photo)) {
          return res.status(400).json({
            success: false,
            error: "Invalid attendance photo format"
          });
        }

        const base64Data = photo.replace(
          /^data:image\/(jpeg|jpg|png|webp);base64,/i,
          ""
        );

        const buffer = Buffer.from(base64Data, "base64");

        if (!buffer.length || buffer.length > 2 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            error: "Attendance photo is missing or too large"
          });
        }

        const photoDir = require("path").join(__dirname, "staff-photos");

        if (!fs.existsSync(photoDir)) {
          fs.mkdirSync(photoDir, { recursive: true });
        }

        const fileName =
          `staff_${Number(staff.id)}_${attendanceDate}_${Date.now()}.jpg`;

        const fullPath = require("path").join(photoDir, fileName);

        fs.writeFileSync(fullPath, buffer);

        photoPath = `/staff-photos/${fileName}`;
      }

      db.run(`
        INSERT INTO staff_attendance
        (
          restaurant_id,
          staff_id,
          attendance_date,
          status,
          check_in,
          time_in,
          time_in_photo,
          late_minutes,
          worked_minutes,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        Number(staff.restaurant_id),
        Number(staff.id),
        attendanceDate,
        status,
        currentTime,
        currentTime,
        photoPath,
        lateMinutes,
        0,
        status === "LATE"
          ? `Late by ${lateMinutes} minute(s)`
          : "Staff self TIME IN"
      ]);

      saveDatabase();

      res.json({
        success: true,
        message: status === "LATE"
          ? `TIME IN recorded — Late by ${lateMinutes} minute(s)`
          : "TIME IN recorded successfully",
        attendance: {
          attendance_date: attendanceDate,
          time_in: currentTime,
          status,
          late_minutes: lateMinutes,
          time_in_photo: photoPath
        }
      });

    } catch (e) {
      console.error("Staff TIME IN error:", e);

      res.status(500).json({
        success: false,
        error: e.message
      });
    }
  });


  app.post("/api/staff/me/time-out", requireStaffAuth, (req, res) => {
    try {
      const staff = req.staff;

      const now = new Date();
      const pad = n => String(n).padStart(2, "0");

      const attendanceDate =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const currentTime =
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const result = db.exec(`
        SELECT
          id,
          time_in,
          time_out,
          status,
          late_minutes
        FROM staff_attendance
        WHERE staff_id = ${Number(staff.id)}
          AND attendance_date = '${attendanceDate}'
        LIMIT 1
      `);

      if (!result.length || !result[0].values.length) {
        return res.status(400).json({
          success: false,
          error: "TIME IN is required before TIME OUT"
        });
      }

      const row = result[0].values[0];

      const attendanceId = Number(row[0]);
      const timeIn = row[1];
      const timeOut = row[2];

      if (!timeIn) {
        return res.status(400).json({
          success: false,
          error: "TIME IN is required before TIME OUT"
        });
      }

      if (timeOut) {
        return res.status(400).json({
          success: false,
          error: "TIME OUT already recorded for today",
          attendance: {
            time_in: timeIn,
            time_out: timeOut
          }
        });
      }

      const parseTime = value => {
        const parts = String(value).split(":").map(Number);

        return (
          Number(parts[0] || 0) * 60 +
          Number(parts[1] || 0)
        );
      };

      const timeInMinutes = parseTime(timeIn);
      const timeOutMinutes =
        now.getHours() * 60 + now.getMinutes();

      let workedMinutes = timeOutMinutes - timeInMinutes;

      if (workedMinutes < 0) {
        workedMinutes += 24 * 60;
      }

      db.run(`
        UPDATE staff_attendance
        SET
          check_out = ?,
          time_out = ?,
          worked_minutes = ?
        WHERE id = ?
          AND staff_id = ?
      `, [
        currentTime,
        currentTime,
        workedMinutes,
        attendanceId,
        Number(staff.id)
      ]);

      saveDatabase();

      res.json({
        success: true,
        message: "TIME OUT recorded successfully",
        attendance: {
          attendance_date: attendanceDate,
          time_in: timeIn,
          time_out: currentTime,
          worked_minutes: workedMinutes,
          late_minutes: Number(row[4] || 0)
        }
      });

    } catch (e) {
      console.error("Staff TIME OUT error:", e);

      res.status(500).json({
        success: false,
        error: e.message
      });
    }
  });


  app.get("/api/staff/me/today-attendance", requireStaffAuth, (req, res) => {
    try {
      const now = new Date();
      const pad = n => String(n).padStart(2, "0");

      const attendanceDate =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const result = db.exec(`
        SELECT *
        FROM staff_attendance
        WHERE staff_id = ${Number(req.staff.id)}
          AND attendance_date = '${attendanceDate}'
        LIMIT 1
      `);

      if (!result.length || !result[0].values.length) {
        return res.json({
          success: true,
          attendance: null
        });
      }

      const columns = result[0].columns;
      const row = result[0].values[0];

      const attendance = {};

      columns.forEach((column, index) => {
        attendance[column] = row[index];
      });

      res.json({
        success: true,
        attendance
      });

    } catch (e) {
      res.status(500).json({
        success: false,
        error: e.message
      });
    }
  });



  app.get("/api/staff/:id/salary-calculation", (req, res) => {
    const staffId = Number(req.params.id);
    const month = String(req.query.month || "").trim();

    if (!month) {
      return res.status(400).json({
        success: false,
        error: "Salary month is required (YYYY-MM)"
      });
    }

    try {
      const staffRows = db.exec(`
        SELECT id, name, monthly_salary, duty_hours, duty_days_per_month
        FROM staff
        WHERE id = ?
        LIMIT 1
      `, [staffId]);

      if (!staffRows.length || !staffRows[0].values.length) {
        return res.status(404).json({
          success: false,
          error: "Staff not found"
        });
      }

      const staff = staffRows[0].values[0];

      const monthlySalary = Number(staff[2] || 0);
      const dutyHours = Number(staff[3] || 9);
      const dutyDays = Number(staff[4] || 26);

      const totalDutyHours = dutyHours * dutyDays;
      const hourlyRate = totalDutyHours > 0
        ? monthlySalary / totalDutyHours
        : 0;

      const attendanceRows = db.exec(`
        SELECT COALESCE(SUM(late_minutes), 0)
        FROM staff_attendance
        WHERE staff_id = ?
          AND substr(attendance_date, 1, 7) = ?
      `, [staffId, month]);

      const lateMinutes = attendanceRows.length
        ? Number(attendanceRows[0].values[0][0] || 0)
        : 0;

      const lateDeduction = (lateMinutes / 60) * hourlyRate;

      const fineRows = db.exec(`
        SELECT COALESCE(SUM(amount), 0)
        FROM staff_fines
        WHERE staff_id = ?
          AND status = 'ACTIVE'
          AND substr(fine_date, 1, 7) = ?
      `, [staffId, month]);

      const fineAmount = fineRows.length
        ? Number(fineRows[0].values[0][0] || 0)
        : 0;

      res.json({
        success: true,
        calculation: {
          staff_id: staffId,
          staff_name: staff[1],
          salary_month: month,
          monthly_salary: monthlySalary,
          duty_hours: dutyHours,
          duty_days_per_month: dutyDays,
          total_duty_hours: totalDutyHours,
          hourly_rate: hourlyRate,
          late_minutes: lateMinutes,
          late_hours: lateMinutes / 60,
          late_deduction: lateDeduction,
          fine_amount: fineAmount
        }
      });

    } catch (e) {
      res.status(500).json({
        success: false,
        error: e.message
      });
    }
  });


  app.get("/api/staff/:id/salary", (req, res) => {
    const staffId = Number(req.params.id);

    const rows = db.exec(`
      SELECT *
      FROM staff_salary
      WHERE staff_id = ?
      ORDER BY salary_month DESC
    `, [staffId]);

    const salary = rows.length
      ? rows[0].values.map(r => ({
          id: r[0],
          restaurant_id: r[1],
          staff_id: r[2],
          salary_month: r[3],
          basic_salary: r[4],
          bonus: r[5],
          deduction: r[6],
          advance: r[7],
          paid_amount: r[8],
          payment_date: r[9],
          status: r[10],
          notes: r[11],
          created_at: r[12],
          late_deduction: r[13] || 0,
          fine_deduction: r[14] || 0
        }))
      : [];

    res.json({ success: true, salary });
  });


  app.post("/api/staff/:id/salary", (req, res) => {
    const staffId = Number(req.params.id);
    const restaurantId = Number(req.body.restaurant_id || 1);
    const month = String(req.body.salary_month || "").trim();

    if (!month) {
      return res.status(400).json({
        success: false,
        error: "Salary month is required"
      });
    }

    try {
      const staffRows = db.exec(`
        SELECT monthly_salary, duty_hours, duty_days_per_month
        FROM staff
        WHERE id = ?
        LIMIT 1
      `, [staffId]);

      if (!staffRows.length || !staffRows[0].values.length) {
        return res.status(404).json({
          success: false,
          error: "Staff not found"
        });
      }

      const staff = staffRows[0].values[0];

      const monthlySalary = Number(staff[0] || 0);
      const dutyHours = Number(staff[1] || 9);
      const dutyDays = Number(staff[2] || 26);

      const totalDutyHours = dutyHours * dutyDays;

      const hourlyRate = totalDutyHours > 0
        ? monthlySalary / totalDutyHours
        : 0;

      const attendanceRows = db.exec(`
        SELECT COALESCE(SUM(late_minutes), 0)
        FROM staff_attendance
        WHERE staff_id = ?
          AND substr(attendance_date, 1, 7) = ?
      `, [staffId, month]);

      const lateMinutes = attendanceRows.length
        ? Number(attendanceRows[0].values[0][0] || 0)
        : 0;

      const lateDeduction =
        (lateMinutes / 60) * hourlyRate;

      const fineRows = db.exec(`
        SELECT COALESCE(SUM(amount), 0)
        FROM staff_fines
        WHERE staff_id = ?
          AND status = 'ACTIVE'
          AND substr(fine_date, 1, 7) = ?
      `, [staffId, month]);

      const fineDeduction = fineRows.length
        ? Number(fineRows[0].values[0][0] || 0)
        : 0;

      const basicSalary =
        Number(req.body.basic_salary || monthlySalary);

      const bonus =
        Number(req.body.bonus || 0);

      const deduction =
        Number(req.body.deduction || 0);

      const advance =
        Number(req.body.advance || 0);

      const paidAmount =
        Number(req.body.paid_amount || 0);

      const netSalary =
        basicSalary +
        bonus -
        deduction -
        lateDeduction -
        fineDeduction -
        advance;

      db.run(`
        INSERT INTO staff_salary
        (
          restaurant_id,
          staff_id,
          salary_month,
          basic_salary,
          bonus,
          deduction,
          advance,
          paid_amount,
          payment_date,
          status,
          notes,
          late_deduction,
          fine_deduction
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        ON CONFLICT(staff_id, salary_month)
        DO UPDATE SET
          basic_salary = excluded.basic_salary,
          bonus = excluded.bonus,
          deduction = excluded.deduction,
          advance = excluded.advance,
          paid_amount = excluded.paid_amount,
          payment_date = excluded.payment_date,
          status = excluded.status,
          notes = excluded.notes,
          late_deduction = excluded.late_deduction,
          fine_deduction = excluded.fine_deduction
      `, [
        restaurantId,
        staffId,
        month,
        basicSalary,
        bonus,
        deduction,
        advance,
        paidAmount,
        req.body.payment_date || null,
        req.body.status || "UNPAID",
        req.body.notes || null,
        lateDeduction,
        fineDeduction
      ]);

      saveDatabase();

      res.json({
        success: true,
        calculation: {
          monthly_salary: monthlySalary,
          duty_hours: dutyHours,
          duty_days_per_month: dutyDays,
          total_duty_hours: totalDutyHours,
          hourly_rate: hourlyRate,
          late_minutes: lateMinutes,
          late_deduction: lateDeduction,
          fine_deduction: fineDeduction,
          basic_salary: basicSalary,
          bonus: bonus,
          manual_deduction: deduction,
          advance: advance,
          net_salary: netSalary,
          paid_amount: paidAmount,
          remaining: Math.max(0, netSalary - paidAmount)
        }
      });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e.message
      });
    }
  });


  app.get("/api/staff/:id/fines", (req, res) => {
    const staffId = Number(req.params.id);

    const rows = db.exec(`
      SELECT id, restaurant_id, staff_id, fine_date, amount, reason, status, created_at
      FROM staff_fines
      WHERE staff_id = ?
      ORDER BY fine_date DESC, id DESC
    `, [staffId]);

    const fines = rows.length
      ? rows[0].values.map(r => ({
          id: r[0],
          restaurant_id: r[1],
          staff_id: r[2],
          fine_date: r[3],
          amount: r[4],
          reason: r[5],
          status: r[6],
          created_at: r[7]
        }))
      : [];

    res.json({ success: true, fines });
  });


  app.post("/api/staff/:id/fines", (req, res) => {
    const staffId = Number(req.params.id);
    const restaurantId = Number(req.body.restaurant_id || 1);
    const date = String(req.body.fine_date || "").trim();
    const amount = Number(req.body.amount || 0);
    const reason = String(req.body.reason || "").trim();

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Fine date is required"
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Fine amount must be greater than 0"
      });
    }

    try {
      db.run(`
        INSERT INTO staff_fines
        (restaurant_id, staff_id, fine_date, amount, reason, status)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE')
      `, [
        restaurantId,
        staffId,
        date,
        amount,
        reason || null
      ]);

      saveDatabase();

      res.json({
        success: true,
        message: "Fine added successfully"
      });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e.message
      });
    }
  });


  app.delete("/api/staff/fines/:id", (req, res) => {
    const fineId = Number(req.params.id);

    try {
      db.run(`DELETE FROM staff_fines WHERE id = ?`, [fineId]);

      saveDatabase();

      res.json({
        success: true,
        message: "Fine deleted successfully"
      });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e.message
      });
    }
  });


  app.get("/api/staff/:id/account", (req, res) => {
    const staffId = Number(req.params.id);

    const rows = db.exec(`
      SELECT *
      FROM staff_account_transactions
      WHERE staff_id = ?
      ORDER BY transaction_date DESC, id DESC
    `, [staffId]);

    const transactions = rows.length
      ? rows[0].values.map(r => ({
          id: r[0],
          restaurant_id: r[1],
          staff_id: r[2],
          transaction_date: r[3],
          type: r[4],
          amount: r[5],
          description: r[6],
          created_at: r[7]
        }))
      : [];

    res.json({ success: true, transactions });
  });


  app.post("/api/staff/:id/account", (req, res) => {
    const staffId = Number(req.params.id);
    const restaurantId = Number(req.body.restaurant_id || 1);
    const date = String(req.body.transaction_date || "").trim();

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Transaction date is required"
      });
    }

    try {
      db.run(`
        INSERT INTO staff_account_transactions
        (restaurant_id, staff_id, transaction_date, type, amount, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        restaurantId,
        staffId,
        date,
        req.body.type || "OTHER",
        Number(req.body.amount || 0),
        req.body.description || null
      ]);

      saveDatabase();
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e.message
      });
    }
  });


  app.get("/api/staff/guidelines", (req, res) => {
    const restaurantId = Number(req.query.restaurant_id || 1);

    const rows = db.exec(`
      SELECT *
      FROM staff_guidelines
      WHERE restaurant_id = ?
        AND active = 1
      ORDER BY id DESC
    `, [restaurantId]);

    const guidelines = rows.length
      ? rows[0].values.map(r => ({
          id: r[0],
          restaurant_id: r[1],
          title: r[2],
          description: r[3],
          active: r[4],
          created_at: r[5]
        }))
      : [];

    res.json({ success: true, guidelines });
  });


  app.post("/api/staff/guidelines", (req, res) => {
    const restaurantId = Number(req.body.restaurant_id || 1);
    const title = String(req.body.title || "").trim();

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Guideline title is required"
      });
    }

    try {
      db.run(`
        INSERT INTO staff_guidelines
        (restaurant_id, title, description)
        VALUES (?, ?, ?)
      `, [
        restaurantId,
        title,
        req.body.description || null
      ]);

      saveDatabase();
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e.message
      });
    }
  });


  // =========================
  // STAFF WORK / ORDER RECORD
  // =========================

  app.get("/api/staff/:id/work-records", (req, res) => {

    try {

      const staffId = Number(req.params.id);

      if (!staffId) {
        return res.status(400).json({
          success: false,
          error: "Invalid staff"
        });
      }

      const rows = db.exec(`
        SELECT *
        FROM staff_work_records
        WHERE staff_id = ?
        ORDER BY work_date DESC, id DESC
      `, [staffId]);

      const records = rows.length
        ? rows[0].values.map(r => ({
            id: r[0],
            restaurant_id: r[1],
            staff_id: r[2],
            work_date: r[3],
            work_type: r[4],
            order_count: r[5],
            amount: r[6],
            description: r[7],
            created_at: r[8]
          }))
        : [];

      res.json({
        success: true,
        records
      });

    } catch (e) {

      res.status(500).json({
        success: false,
        error: e.message
      });

    }

  });


  app.post("/api/staff/:id/work-records", (req, res) => {

    const staffId = Number(req.params.id);
    const restaurantId =
      Number(req.body.restaurant_id || 1);

    const workDate =
      String(req.body.work_date || "").trim();

    const workType =
      String(req.body.work_type || "GENERAL").trim();

    const orderCount =
      Number(req.body.order_count || 0);

    const amount =
      Number(req.body.amount || 0);

    const description =
      String(req.body.description || "").trim();

    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: "Invalid staff"
      });
    }

    if (!workDate) {
      return res.status(400).json({
        success: false,
        error: "Work date required"
      });
    }

    if (orderCount < 0 || amount < 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid work values"
      });
    }

    try {

      db.run(`
        INSERT INTO staff_work_records
        (
          restaurant_id,
          staff_id,
          work_date,
          work_type,
          order_count,
          amount,
          description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        restaurantId,
        staffId,
        workDate,
        workType,
        orderCount,
        amount,
        description
      ]);

      saveDatabase();

      res.json({
        success: true,
        message: "Work record saved"
      });

    } catch (e) {

      res.status(400).json({
        success: false,
        error: e.message
      });

    }

  });


  app.delete("/api/staff/work-records/:id", (req, res) => {

    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Invalid record"
      });
    }

    try {

      db.run(
        "DELETE FROM staff_work_records WHERE id = ?",
        [id]
      );

      saveDatabase();

      res.json({
        success: true,
        message: "Work record deleted"
      });

    } catch (e) {

      res.status(400).json({
        success: false,
        error: e.message
      });

    }

  });


  // STAFF LOGIN
  // =========================
  app.post("/api/staff-login", (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password required"
      });
    }

    const safeUsername = String(username).replace(/'/g, "''");
    const safePassword = String(password).replace(/'/g, "''");

    const result = db.exec(`
      SELECT
        id,
        restaurant_id,
        name,
        phone,
        role,
        employee_code,
        joining_date,
        monthly_salary,
        status
      FROM staff
      WHERE staff_username = '${safeUsername}'
        AND staff_password = '${safePassword}'
        AND status = 'ACTIVE'
      LIMIT 1
    `);

    if (!result.length || !result[0].values.length) {
      return res.status(401).json({
        success: false,
        error: "Invalid staff username or password"
      });
    }

    const row = result[0].values[0];

    const staff = {
      id: row[0],
      restaurant_id: row[1],
      name: row[2],
      phone: row[3],
      role: row[4],
      employee_code: row[5],
      joining_date: row[6],
      monthly_salary: row[7],
      status: row[8]
    };

    const token =
      "staff_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2);

    if (!global.staffSessions) {
      global.staffSessions = new Map();
    }

    global.staffSessions.set(token, {
      staff_id: Number(staff.id),
      restaurant_id: Number(staff.restaurant_id),
      created_at: Date.now()
    });

    res.json({
      success: true,
      message: "Staff login successful",
      token,
      staff
    });

  });

  // STAFF AUTHENTICATION HELPER
  // =========================
  function requireStaffAuth(req, res, next) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "").trim();

    if (!token || !global.staffSessions || !global.staffSessions.has(token)) {
      return res.status(401).json({
        success: false,
        error: "Staff login required"
      });
    }

    const session = global.staffSessions.get(token);

    const result = db.exec(`
      SELECT id, restaurant_id, name, phone, role,
             employee_code, joining_date, monthly_salary, status
      FROM staff
      WHERE id = ${Number(session.staff_id)}
        AND restaurant_id = ${Number(session.restaurant_id)}
        AND status = 'ACTIVE'
      LIMIT 1
    `);

    if (!result.length || !result[0].values.length) {
      global.staffSessions.delete(token);
      return res.status(401).json({
        success: false,
        error: "Staff account is no longer active"
      });
    }

    const row = result[0].values[0];

    req.staff = {
      id: row[0],
      restaurant_id: row[1],
      name: row[2],
      phone: row[3],
      role: row[4],
      employee_code: row[5],
      joining_date: row[6],
      monthly_salary: row[7],
      status: row[8]
    };

    next();
  }

  // Logged-in staff profile
  app.get("/api/staff/me", requireStaffAuth, (req, res) => {
    res.json({
      success: true,
      staff: req.staff
    });
  });

  
// ================= STAFF LEAVE & NOTIFICATIONS =================

db.run(`
  CREATE TABLE IF NOT EXISTS staff_attendance_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL,
    request_date TEXT NOT NULL,
    request_type TEXT NOT NULL DEFAULT 'LEAVE',
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    manager_note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS staff_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    staff_id INTEGER,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);


// ================= STAFF LEAVE REQUEST API =================

app.post("/api/staff/me/leave-request", requireStaffAuth, (req, res) => {
  const requestDate = String(req.body.request_date || "").trim();
  const requestType = String(req.body.request_type || "LEAVE").trim().toUpperCase();
  const reason = String(req.body.reason || "").trim();

  if (!requestDate) {
    return res.status(400).json({
      success: false,
      error: "Request date is required"
    });
  }

  if (!reason) {
    return res.status(400).json({
      success: false,
      error: "Reason is required"
    });
  }

  try {
    db.run(`
      INSERT INTO staff_attendance_requests
      (restaurant_id, staff_id, request_date, request_type, reason, status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `, [
      req.staff.restaurant_id,
      req.staff.id,
      requestDate,
      requestType,
      reason
    ]);

    db.run(`
      INSERT INTO staff_notifications
      (restaurant_id, staff_id, notification_type, title, message)
      VALUES (?, ?, 'LEAVE_REQUEST', ?, ?)
    `, [
      req.staff.restaurant_id,
      req.staff.id,
      "New Leave / Absence Request",
      req.staff.name + " requested " + requestType +
      " for " + requestDate + ". Reason: " + reason
    ]);

    saveDatabase();

    res.json({
      success: true,
      message: "Leave request submitted successfully."
    });

  } catch (e) {
    res.status(400).json({
      success: false,
      error: e.message
    });
  }
});

app.get("/api/staff/me/leave-requests", requireStaffAuth, (req, res) => {
  try {
    const result = db.exec(`
      SELECT
        id,
        request_date,
        request_type,
        reason,
        status,
        manager_note,
        created_at
      FROM staff_attendance_requests
      WHERE staff_id = ${Number(req.staff.id)}
        AND restaurant_id = ${Number(req.staff.restaurant_id)}
      ORDER BY request_date DESC, id DESC
    `);

    const rows = result.length ? result[0].values : [];

    const requests = rows.map(row => ({
      id: row[0],
      request_date: row[1],
      request_type: row[2],
      reason: row[3],
      status: row[4],
      manager_note: row[5],
      created_at: row[6]
    }));

    res.json({
      success: true,
      requests
    });

  } catch (e) {
    res.status(400).json({
      success: false,
      error: e.message
    });
  }
});


// ================= MANAGER STAFF NOTIFICATIONS =================

app.get("/api/staff/manager-notifications", (req, res) => {
  const restaurantId = Number(req.query.restaurant_id || 1);

  try {
    const result = db.exec(`
      SELECT
        n.id,
        n.staff_id,
        s.name AS staff_name,
        n.notification_type,
        n.title,
        n.message,
        n.is_read,
        n.created_at
      FROM staff_notifications n
      LEFT JOIN staff s ON s.id = n.staff_id
      WHERE n.restaurant_id = ${restaurantId}
      ORDER BY n.id DESC
      LIMIT 100
    `);

    const rows = result.length ? result[0].values : [];

    const notifications = rows.map(row => ({
      id: row[0],
      staff_id: row[1],
      staff_name: row[2],
      notification_type: row[3],
      title: row[4],
      message: row[5],
      is_read: row[6],
      created_at: row[7]
    }));

    res.json({
      success: true,
      notifications
    });

  } catch (e) {
    res.status(400).json({
      success: false,
      error: e.message
    });
  }
});

app.get("/api/staff/manager-leave-requests", (req, res) => {
  const restaurantId = Number(req.query.restaurant_id || 1);

  try {
    const result = db.exec(`
      SELECT
        r.id,
        r.staff_id,
        s.name AS staff_name,
        r.request_date,
        r.request_type,
        r.reason,
        r.status,
        r.manager_note,
        r.created_at
      FROM staff_attendance_requests r
      LEFT JOIN staff s ON s.id = r.staff_id
      WHERE r.restaurant_id = ${restaurantId}
      ORDER BY
        CASE WHEN r.status = 'PENDING' THEN 0 ELSE 1 END,
        r.id DESC
    `);

    const rows = result.length ? result[0].values : [];

    const requests = rows.map(row => ({
      id: row[0],
      staff_id: row[1],
      staff_name: row[2],
      request_date: row[3],
      request_type: row[4],
      reason: row[5],
      status: row[6],
      manager_note: row[7],
      created_at: row[8]
    }));

    res.json({
      success: true,
      requests
    });

  } catch (e) {
    res.status(400).json({
      success: false,
      error: e.message
    });
  }
});

app.post("/api/staff/manager-leave-requests/:id/decision", (req, res) => {
  const requestId = Number(req.params.id);
  const restaurantId = Number(req.body.restaurant_id || 1);
  const status = String(req.body.status || "").trim().toUpperCase();
  const managerNote = String(req.body.manager_note || "").trim();

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({
      success: false,
      error: "Decision must be APPROVED or REJECTED"
    });
  }

  try {
    const result = db.exec(`
      SELECT staff_id, request_date, request_type
      FROM staff_attendance_requests
      WHERE id = ${requestId}
        AND restaurant_id = ${restaurantId}
      LIMIT 1
    `);

    if (!result.length || !result[0].values.length) {
      return res.status(404).json({
        success: false,
        error: "Leave request not found"
      });
    }

    const row = result[0].values[0];
    const staffId = Number(row[0]);
    const requestDate = row[1];
    const requestType = row[2];

    db.run(`
      UPDATE staff_attendance_requests
      SET status = ?, manager_note = ?
      WHERE id = ?
        AND restaurant_id = ?
    `, [
      status,
      managerNote || null,
      requestId,
      restaurantId
    ]);

    db.run(`
      INSERT INTO staff_notifications
      (restaurant_id, staff_id, notification_type, title, message)
      VALUES (?, ?, 'LEAVE_DECISION', ?, ?)
    `, [
      restaurantId,
      staffId,
      "Leave Request " + status,
      requestType + " for " + requestDate + " has been " + status +
      (managerNote ? ". Manager note: " + managerNote : ".")
    ]);

    saveDatabase();

    res.json({
      success: true,
      message: "Leave request " + status.toLowerCase() + "."
    });

  } catch (e) {
    res.status(400).json({
      success: false,
      error: e.message
    });
  }
});

app.post("/api/staff/manager-notifications/:id/read", (req, res) => {
  const notificationId = Number(req.params.id);
  const restaurantId = Number(req.body.restaurant_id || 1);

  try {
    db.run(`
      UPDATE staff_notifications
      SET is_read = 1
      WHERE id = ?
        AND restaurant_id = ?
    `, [notificationId, restaurantId]);

    saveDatabase();

    res.json({
      success: true
    });

  } catch (e) {
    res.status(400).json({
      success: false,
      error: e.message
    });
  }
});

app.listen(PORT, () => {
    console.log("=================================");
    console.log("👑 MS RESTAURANT MANAGER 👑");
    console.log(`🖥️ Server: http://localhost:${PORT}`);
    console.log("💾 Database: Connected");
    console.log("=================================");
  });
}

startServer().catch(error => {
  console.error("❌ Server error:", error);
});



