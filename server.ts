import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_PRODUCTS } from './src/data/seedCatalog.ts';
import { Enquiry, Order, Product } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_EMAIL = 'quadritunde1993@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'wealth123';
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'wealth-fashion-boutique-lagos-2026-secret';

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'store.json');

interface StoreData {
  products: Product[];
  orders: Order[];
  enquiries: Enquiry[];
}

function ensureStore(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial: StoreData = {
      products: INITIAL_PRODUCTS.map((p) => ({
        ...p,
        createdAt: new Date().toISOString(),
      })),
      orders: [
        {
          id: 'ord-seed-1',
          orderNumber: 'WFB-1041',
          customerName: 'Adebayo Ogunleye',
          customerPhone: '+2348034459012',
          deliveryAddress: '12 Oba Akinyele Avenue, Bodija, Ibadan',
          note: 'Please deliver before 5 PM',
          items: [
            {
              productId: 'wfb-cloth-01',
              name: 'Royal Black & Gold Agbada',
              price: 185000,
              selectedOption: 'L',
              quantity: 1,
            },
            {
              productId: 'wfb-cap-02',
              name: 'Royal Velvet & Gold Fila',
              price: 45000,
              selectedOption: 'Black/Gold',
              quantity: 1,
            },
          ],
          totalAmount: 230000,
          status: 'Confirmed',
          source: 'Cart Checkout',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        },
      ],
      enquiries: [
        {
          id: 'enq-seed-1',
          customerName: 'Folake Adeyemi',
          customerPhone: '+2348091127744',
          productName: 'Champagne & Noir Silk Kaftan',
          selectedOption: 'M',
          message: 'Good afternoon! Is this available for express delivery to Jericho, Ibadan tomorrow?',
          status: 'New Enquiry',
          source: 'Contact Form',
          createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        },
      ],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as StoreData;
    if (!Array.isArray(parsed.products) || parsed.products.length === 0) {
      parsed.products = INITIAL_PRODUCTS;
    }
    if (!Array.isArray(parsed.orders)) parsed.orders = [];
    if (!Array.isArray(parsed.enquiries)) parsed.enquiries = [];
    return parsed;
  } catch {
    const fallback: StoreData = {
      products: INITIAL_PRODUCTS,
      orders: [],
      enquiries: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function saveStore(data: StoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

function createAdminToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      email?: string;
      exp?: number;
    };
    return (
      decoded.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      typeof decoded.exp === 'number' &&
      decoded.exp > Date.now()
    );
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  next();
}

const aiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  ensureStore();
  const app = express();

  app.use(express.json({ limit: '8mb' }));

  // Lightweight built-in gzip compression for fast API & HTML delivery
  app.use((req: Request, res: Response, next: NextFunction) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (
      typeof acceptEncoding !== 'string' ||
      !acceptEncoding.includes('gzip') ||
      req.path.startsWith('/src/assets/images/')
    ) {
      next();
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      const jsonStr = JSON.stringify(body);
      if (jsonStr.length < 1024) {
        return originalJson(body);
      }
      const compressed = zlib.gzipSync(Buffer.from(jsonStr, 'utf-8'));
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(compressed);
    };
    next();
  });

  // Cache product & hero photography for 7 days for instant repeat loads
  app.use('/src/assets/images', (_req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    next();
  });

  // Dynamic SEO robots.txt and sitemap.xml
  app.get('/robots.txt', (req, res) => {
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        `Sitemap: ${baseUrl.replace(/\/+$/, '')}/sitemap.xml`,
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = (
      process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`
    ).replace(/\/+$/, '');
    const store = ensureStore();
    const staticRoutes = [
      { path: '/', changefreq: 'daily', priority: '1.0' },
      { path: '/shop', changefreq: 'daily', priority: '0.9' },
      { path: '/shop/clothes', changefreq: 'daily', priority: '0.85' },
      { path: '/shop/shoes', changefreq: 'daily', priority: '0.85' },
      { path: '/shop/caps', changefreq: 'daily', priority: '0.85' },
      { path: '/about', changefreq: 'weekly', priority: '0.8' },
      { path: '/contact', changefreq: 'weekly', priority: '0.8' },
    ];
    const productRoutes = store.products.map((p) => ({
      path: `/product/${encodeURIComponent(p.id)}`,
      changefreq: 'weekly',
      priority: '0.75',
    }));
    const allRoutes = [...staticRoutes, ...productRoutes];
    const lastMod = new Date().toISOString().split('T')[0];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', store: 'Wealth Fashion Boutique' });
  });

  // --- PRODUCTS ---
  app.get('/api/products', (_req, res) => {
    const store = ensureStore();
    res.json({ products: store.products });
  });

  app.post('/api/products', requireAdmin, (req, res) => {
    const store = ensureStore();
    const body = req.body as Partial<Product>;
    if (!body.name || !body.category || typeof body.price !== 'number' || body.price <= 0) {
      res.status(400).json({ error: 'Product name, category, and valid Naira price are required.' });
      return;
    }

    const category = body.category;
    const defaultOptions =
      category === 'Clothes'
        ? ['S', 'M', 'L', 'XL']
        : category === 'Shoes'
          ? ['40', '41', '42', '43', '44', '45']
          : ['Obsidian Black', 'Alabaster White', 'Black/Gold'];

    const newProduct: Product = {
      id: `wfb-${category.toLowerCase()}-${Date.now()}`,
      name: body.name.trim(),
      category,
      gender: body.gender || 'Unisex',
      price: Math.round(body.price),
      image:
        body.image?.trim() ||
        '/src/assets/images/cloth_velvet_blazer_1794943008375.jpg',
      options:
        Array.isArray(body.options) && body.options.length > 0
          ? body.options
          : defaultOptions,
      optionLabel: category === 'Caps' ? 'Colour' : 'Size',
      description:
        body.description?.trim() ||
        'Crafted to Wealth Fashion Boutique luxury standards in Ibadan.',
      isBestSeller: Boolean(body.isBestSeller),
      inStock: body.inStock !== false,
      createdAt: new Date().toISOString(),
    };

    store.products.unshift(newProduct);
    saveStore(store);
    res.status(201).json({ product: newProduct });
  });

  app.patch('/api/products/:id', requireAdmin, (req, res) => {
    const store = ensureStore();
    const { id } = req.params;
    const index = store.products.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const existing = store.products[index];
    const updates = req.body as Partial<Product>;

    const nextCategory = updates.category ?? existing.category;
    const updated: Product = {
      ...existing,
      ...updates,
      id: existing.id,
      price:
        typeof updates.price === 'number' && updates.price > 0
          ? Math.round(updates.price)
          : existing.price,
      name: updates.name?.trim() || existing.name,
      image: updates.image?.trim() || existing.image,
      description: updates.description?.trim() ?? existing.description,
      optionLabel: nextCategory === 'Caps' ? 'Colour' : 'Size',
    };

    store.products[index] = updated;
    saveStore(store);
    res.json({ product: updated });
  });

  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const store = ensureStore();
    const { id } = req.params;
    const before = store.products.length;
    store.products = store.products.filter((p) => p.id !== id);
    if (store.products.length === before) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    saveStore(store);
    res.json({ deleted: id });
  });

  // --- ORDERS ---
  app.get('/api/orders', requireAdmin, (_req, res) => {
    const store = ensureStore();
    res.json({ orders: store.orders });
  });

  app.post('/api/orders', (req, res) => {
    const store = ensureStore();
    const body = req.body as {
      customerName?: string;
      customerPhone?: string;
      deliveryAddress?: string;
      note?: string;
      items?: Order['items'];
      source?: Order['source'];
    };

    if (!body.customerName?.trim() || !body.customerPhone?.trim() || !Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'Customer name, WhatsApp/phone number, and at least one item are required.' });
      return;
    }

    const totalAmount = body.items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );

    const orderNumber = `WFB-${1042 + store.orders.length}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      deliveryAddress: body.deliveryAddress?.trim() || 'Ibadan Pickup / WhatsApp Coordination',
      note: body.note?.trim() || '',
      items: body.items,
      totalAmount,
      status: 'Pending',
      source: body.source || 'Cart Checkout',
      createdAt: new Date().toISOString(),
    };

    store.orders.unshift(newOrder);

    // Also log into enquiries as "New Enquiry" when placed via Quick Order so owner sees it right away
    if (body.source === 'Quick Order') {
      const firstItem = body.items[0];
      const linkedEnquiry: Enquiry = {
        id: `enq-${Date.now()}`,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        productName: firstItem.name,
        selectedOption: firstItem.selectedOption,
        message: body.note?.trim() || `Quick Order ${orderNumber} placed for ${firstItem.name} (${firstItem.selectedOption}).`,
        status: 'New Enquiry',
        source: 'Order Now',
        createdAt: newOrder.createdAt,
      };
      store.enquiries.unshift(linkedEnquiry);
    }

    saveStore(store);
    res.status(201).json({
      order: newOrder,
      confirmationMessage: 'Thank you, Wealth Fashion Boutique will reply you on WhatsApp shortly',
    });
  });

  app.patch('/api/orders/:id', requireAdmin, (req, res) => {
    const store = ensureStore();
    const { id } = req.params;
    const { status } = req.body as { status?: Order['status'] };
    const order = store.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (status) {
      order.status = status;
      saveStore(store);
    }
    res.json({ order });
  });

  // --- ENQUIRIES ---
  app.get('/api/enquiries', requireAdmin, (_req, res) => {
    const store = ensureStore();
    res.json({ enquiries: store.enquiries });
  });

  app.post('/api/enquiries', (req, res) => {
    const store = ensureStore();
    const body = req.body as {
      customerName?: string;
      customerPhone?: string;
      productName?: string;
      selectedOption?: string;
      message?: string;
      source?: Enquiry['source'];
    };

    if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
      res.status(400).json({ error: 'Name and WhatsApp/phone number are required.' });
      return;
    }

    const newEnquiry: Enquiry = {
      id: `enq-${Date.now()}`,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      productName: body.productName?.trim() || 'General Boutique Enquiry',
      selectedOption: body.selectedOption?.trim() || 'Standard',
      message: body.message?.trim() || 'Customer requested styling & order details.',
      status: 'New Enquiry',
      source: body.source || 'Contact Form',
      createdAt: new Date().toISOString(),
    };

    store.enquiries.unshift(newEnquiry);
    saveStore(store);

    res.status(201).json({
      enquiry: newEnquiry,
      confirmationMessage: 'Thank you, Wealth Fashion Boutique will reply you on WhatsApp shortly',
    });
  });

  app.patch('/api/enquiries/:id', requireAdmin, (req, res) => {
    const store = ensureStore();
    const { id } = req.params;
    const { status } = req.body as { status?: Enquiry['status'] };
    const enquiry = store.enquiries.find((e) => e.id === id);
    if (!enquiry) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    if (status) {
      enquiry.status = status;
      saveStore(store);
    }
    res.json({ enquiry });
  });

  // --- ADMIN AUTH ---
  app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (
      email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD
    ) {
      const token = createAdminToken(ADMIN_EMAIL);
      res.json({
        token,
        admin: { email: ADMIN_EMAIL, name: 'Mr. Wealth (Owner)' },
      });
      return;
    }
    res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
  });

  app.get('/api/admin/session', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    if (!verifyAdminToken(token)) {
      res.status(401).json({ authenticated: false });
      return;
    }
    res.json({ authenticated: true, email: ADMIN_EMAIL });
  });

  // --- WEALTH STYLIST AI ASSISTANT ---
  app.post('/api/stylist', async (req, res) => {
    const { message, history } = req.body as {
      message?: string;
      history?: Array<{ role: string; text: string }>;
    };

    if (!message?.trim()) {
      res.status(400).json({ error: 'Please share what outfit, shoes, or cap you are looking for.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        error: 'Gemini API key is not configured yet. Please add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const store = ensureStore();
    const catalogContext = store.products
      .filter((p) => p.inStock)
      .map(
        (p) =>
          `- ID: "${p.id}" | Name: "${p.name}" | Category: ${p.category} | Gender: ${p.gender} | Price: ₦${p.price.toLocaleString('en-NG')} | ${p.optionLabel}s: ${p.options.join(', ')} | Details: ${p.description}`
      )
      .join('\n');

    const recentHistory = Array.isArray(history)
      ? history
          .slice(-6)
          .map((h) => `${h.role === 'user' ? 'Client' : 'Wealth Stylist'}: ${h.text}`)
          .join('\n')
      : '';

    const systemInstruction = `You are "Wealth Stylist", the signature AI Fashion Assistant for Wealth Fashion Boutique in Ibadan, Nigeria (Instagram: @mr_wealth2022, WhatsApp: +234 904 755 2985).
Your persona: Warm, confident, sharp, trendy Nigerian luxury fashion stylist based in Bodija, Ibadan. Use natural Nigerian luxury phrasing lightly and authentically (like "clean look", "Owanbe-ready", "Ibadan evening elegance", "sharp finish", "step out looking like money")—never overly slangy or robotic, always polished and helpful.
Your job:
1. Understand the client's occasion, budget in Naira (₦), gender/vibe, or pairing request (e.g., matching shoes to a shirt, choosing the right cap/fila, party outfit, corporate look).
2. Always suggest EXACTLY 3 real products from our live boutique catalog below that best fit their request and budget.
3. Keep your reply concise (2 to 4 crisp sentences) explaining why those 3 pieces work together or suit the occasion, plus a brief 1-line styling tip.
4. Only return product IDs that exist verbatim in the live catalog below.

LIVE WEALTH FASHION BOUTIQUE CATALOG:
${catalogContext}`;

    const userPrompt = recentHistory
      ? `Recent conversation:\n${recentHistory}\n\nClient's new message: ${message.trim()}`
      : `Client's message: ${message.trim()}`;

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description:
                  'Friendly, trendy Nigerian luxury stylist response addressing the client request and explaining the 3 picks.',
              },
              stylingNote: {
                type: Type.STRING,
                description: 'One short practical styling tip (e.g., pairing colour, sizing, or occasion accessory).',
              },
              recommendedProductIds: {
                type: Type.ARRAY,
                description: 'Array of exactly 3 exact product IDs from the live boutique catalog.',
                items: { type: Type.STRING },
              },
            },
            required: ['reply', 'stylingNote', 'recommendedProductIds'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as {
        reply?: string;
        stylingNote?: string;
        recommendedProductIds?: string[];
      };

      const validIds = new Set(store.products.map((p) => p.id));
      let matchedProducts = (parsed.recommendedProductIds || [])
        .filter((id) => validIds.has(id))
        .map((id) => store.products.find((p) => p.id === id)!)
        .filter(Boolean);

      // Ensure exactly 3 unique shop items are returned
      const seen = new Set(matchedProducts.map((p) => p.id));
      for (const fallback of store.products) {
        if (matchedProducts.length >= 3) break;
        if (!seen.has(fallback.id)) {
          matchedProducts.push(fallback);
          seen.add(fallback.id);
        }
      }
      matchedProducts = matchedProducts.slice(0, 3);

      res.json({
        reply:
          parsed.reply ||
          'Welcome to Wealth Fashion Boutique! Here are three curated pieces from our Ibadan atelier tailored to elevate your look.',
        stylingNote:
          parsed.stylingNote ||
          'Pair structured black tailoring with brushed gold accents for effortless Ibadan evening poise.',
        recommendedProducts: matchedProducts,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to reach Wealth Stylist right now.';
      console.error('Wealth Stylist Gemini error:', err);
      res.status(502).json({
        error: `Wealth Stylist is temporarily unavailable (${msg}). Please try again or reach us on WhatsApp +234 904 755 2985.`,
      });
    }
  });

  // Vite dev middleware or production static serving
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '30d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wealth Fashion Boutique server running at http://localhost:${PORT}`);
  });
}

startServer();
