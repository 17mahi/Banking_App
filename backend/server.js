const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-kodbank-key";

app.use(cors());
app.use(express.json());

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  db.get("SELECT id FROM users WHERE email = ?", [normalizedEmail], (err, existing) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    db.run(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, normalizedEmail, passwordHash],
      function (insertErr) {
        if (insertErr) {
          console.error(insertErr);
          return res.status(500).json({ message: "Failed to create user" });
        }

        const userId = this.lastID;

        const createAccountsStmt = db.prepare(
          "INSERT INTO accounts (user_id, name, type, balance) VALUES (?, ?, ?, ?)"
        );
        createAccountsStmt.run(userId, "Kodbank Everyday", "checking", 14520.75);
        createAccountsStmt.run(userId, "Kodbank Savings", "savings", 32000.0);
        createAccountsStmt.finalize();

        const user = { id: userId, name, email: normalizedEmail };
        const token = generateToken(user);
        res.status(201).json({ token, user });
      }
    );
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  db.get("SELECT * FROM users WHERE email = ?", [normalizedEmail], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payloadUser = { id: user.id, name: user.name, email: user.email };
    const token = generateToken(payloadUser);
    res.json({ token, user: payloadUser });
  });
});

app.get("/api/profile", authMiddleware, (req, res) => {
  db.get(
    "SELECT id, name, email, created_at FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json({ user });
    }
  );
});

app.get("/api/accounts", authMiddleware, (req, res) => {
  db.all(
    "SELECT id, name, type, balance, created_at FROM accounts WHERE user_id = ? ORDER BY id",
    [req.user.id],
    (err, accounts) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json({ accounts });
    }
  );
});

app.get("/api/accounts/:id/transactions", authMiddleware, (req, res) => {
  const accountId = req.params.id;
  db.get(
    "SELECT id FROM accounts WHERE id = ? AND user_id = ?",
    [accountId, req.user.id],
    (accountErr, account) => {
      if (accountErr) {
        console.error(accountErr);
        return res.status(500).json({ message: "Database error" });
      }
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      db.all(
        "SELECT id, amount, type, description, created_at FROM transactions WHERE account_id = ? ORDER BY created_at DESC",
        [accountId],
        (err, transactions) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
          }
          res.json({ transactions });
        }
      );
    }
  );
});

app.post("/api/transfer", authMiddleware, (req, res) => {
  const { fromAccountId, toAccountId, amount, description } = req.body;
  const numericAmount = Number(amount);

  if (!fromAccountId || !toAccountId || !numericAmount || numericAmount <= 0) {
    return res.status(400).json({ message: "Invalid transfer data" });
  }

  if (fromAccountId === toAccountId) {
    return res.status(400).json({ message: "Cannot transfer to the same account" });
  }

  db.all(
    "SELECT * FROM accounts WHERE id IN (?, ?) AND user_id = ?",
    [fromAccountId, toAccountId, req.user.id],
    (err, accounts) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
      if (!accounts || accounts.length !== 2) {
        return res.status(404).json({ message: "Accounts not found" });
      }

      const from = accounts.find((a) => String(a.id) === String(fromAccountId));
      const to = accounts.find((a) => String(a.id) === String(toAccountId));

      if (!from || !to) {
        return res.status(404).json({ message: "Accounts not found" });
      }

      if (from.balance < numericAmount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run(
          "UPDATE accounts SET balance = balance - ? WHERE id = ?",
          [numericAmount, from.id],
          function (updateErr1) {
            if (updateErr1) {
              console.error(updateErr1);
              db.run("ROLLBACK");
              return res.status(500).json({ message: "Failed to update source account" });
            }

            db.run(
              "UPDATE accounts SET balance = balance + ? WHERE id = ?",
              [numericAmount, to.id],
              function (updateErr2) {
                if (updateErr2) {
                  console.error(updateErr2);
                  db.run("ROLLBACK");
                  return res.status(500).json({ message: "Failed to update destination account" });
                }

                const insertTxStmt = db.prepare(
                  "INSERT INTO transactions (account_id, amount, type, description) VALUES (?, ?, ?, ?)"
                );
                insertTxStmt.run(
                  from.id,
                  numericAmount,
                  "DEBIT",
                  description || `Transfer to ${to.name}`
                );
                insertTxStmt.run(
                  to.id,
                  numericAmount,
                  "CREDIT",
                  description || `Transfer from ${from.name}`
                );
                insertTxStmt.finalize();

                db.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                    console.error(commitErr);
                    return res.status(500).json({ message: "Failed to finalize transfer" });
                  }
                  res.json({ message: "Transfer successful" });
                });
              }
            );
          }
        );
      });
    }
  );
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "kodbank-backend" });
});

// Serve frontend static files in production
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Kodbank backend listening on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;

