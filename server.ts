import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import crypto from 'crypto';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json());

  // Generar firma de integridad para Wompi (opcional pero recomendado)
  app.post("/api/wompi/signature", (req, res) => {
    try {
      const { reference, amountInCents, currency } = req.body;
      const secret = process.env.WOMPI_INTEGRITY_SECRET;
      
      if (!secret) return res.json({ signature: null }); // Si no hay secret, podemos seguir sin firma (solo test)

      const concatString = `${reference}${amountInCents}${currency}${secret}`;
      const hash = crypto.createHash('sha256').update(concatString).digest('hex');
      
      res.json({ signature: hash });
    } catch (error: any) {
      console.error("Wompi signature error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Wompi Webhook handler
  app.post("/api/wompi/webhook", (req, res) => {
    // Aquí recibimos eventos asíncronos de Wompi (e.g. cuando el pago es aprobado)
    const event = req.body.event;
    console.log("🔔 Wompi Webhook recibido:", event);
    
    // Aquí actualizarías en Firestore con Firebase Admin Auth/Firestore o similar
    
    res.status(200).send("OK");
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
