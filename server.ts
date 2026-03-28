import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Finance & Tax Calculation (Ghana Specific)
  app.post("/api/finance/calculate-tax", (req, res) => {
    const { baseAmount } = req.body;
    const vat = baseAmount * 0.15;
    const nhil = baseAmount * 0.025;
    const getFund = baseAmount * 0.025;
    const covidLevy = baseAmount * 0.01;
    const totalTax = vat + nhil + getFund + covidLevy;
    const totalAmount = baseAmount + totalTax;

    res.json({
      baseAmount,
      taxes: { vat, nhil, getFund, covidLevy, totalTax },
      totalAmount
    });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Melcom Platform running on http://localhost:${PORT}`);
  });
}

startServer();
