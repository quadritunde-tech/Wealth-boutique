import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Lock,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { BUSINESS_INFO, PRESET_GALLERY_IMAGES } from '../data/seedCatalog.ts';
import {
  Enquiry,
  EnquiryStatus,
  GenderAudience,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
} from '../types.ts';
import { buildCustomerWhatsAppReplyUrl, formatNaira } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface AdminDashboardProps {
  products: Product[];
  onRefreshProducts: () => Promise<void>;
}

const ADMIN_TOKEN_KEY = 'wfb_admin_token';

export function AdminDashboard({
  products,
  onRefreshProducts,
}: AdminDashboardProps) {
  const [token, setToken] = useState<string>(() =>
    localStorage.getItem(ADMIN_TOKEN_KEY) || ''
  );
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'enquiries'>('inventory');
  const [orders, setOrders] = useState<Order[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState('');

  // Add / Edit Product modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Clothes');
  const [formGender, setFormGender] = useState<GenderAudience>('Unisex');
  const [formPrice, setFormPrice] = useState('');
  const [formImage, setFormImage] = useState(PRESET_GALLERY_IMAGES[0].url);
  const [formOptions, setFormOptions] = useState('S, M, L, XL');
  const [formDescription, setFormDescription] = useState('');
  const [formBestSeller, setFormBestSeller] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Inline quick price edit & delete confirm state
  const [inlinePrices, setInlinePrices] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const map: Record<string, string> = {};
    products.forEach((p) => {
      map[p.id] = String(p.price);
    });
    setInlinePrices(map);
  }, [products]);

  const fetchAdminCollections = async (activeToken: string) => {
    setLoadingAdminData(true);
    try {
      const headers = { Authorization: `Bearer ${activeToken}` };
      const [ordRes, enqRes] = await Promise.all([
        fetch('/api/orders', { headers }),
        fetch('/api/enquiries', { headers }),
      ]);
      if (ordRes.status === 401 || enqRes.status === 401) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken('');
        setAuthenticated(false);
        return;
      }
      const ordData = await ordRes.json();
      const enqData = await enqRes.json();
      setOrders(ordData.orders || []);
      setEnquiries(enqData.enquiries || []);
    } finally {
      setLoadingAdminData(false);
    }
  };

  useEffect(() => {
    const verifyExisting = async () => {
      if (!token) {
        setCheckingAuth(false);
        setAuthenticated(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/session', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setAuthenticated(true);
          await fetchAdminCollections(token);
        } else {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          setToken('');
          setAuthenticated(false);
        }
      } catch {
        setAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    verifyExisting();
  }, [token]);

  const showNotice = (msg: string) => {
    setFeedbackBanner(msg);
    window.setTimeout(() => setFeedbackBanner(''), 3200);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid admin credentials.');
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setToken(data.token);
      setAuthenticated(true);
      await fetchAdminCollections(data.token);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken('');
    setAuthenticated(false);
    setPassword('');
  };

  const openAddEditor = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Clothes');
    setFormGender('Unisex');
    setFormPrice('95000');
    setFormImage(PRESET_GALLERY_IMAGES[0].url);
    setFormOptions('S, M, L, XL');
    setFormDescription('');
    setFormBestSeller(false);
    setEditorOpen(true);
  };

  const openEditEditor = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormGender(p.gender);
    setFormPrice(String(p.price));
    setFormImage(p.image);
    setFormOptions(p.options.join(', '));
    setFormDescription(p.description);
    setFormBestSeller(Boolean(p.isBestSeller));
    setEditorOpen(true);
  };

  const handleCategoryChangeInForm = (cat: ProductCategory) => {
    setFormCategory(cat);
    if (!editingProduct) {
      if (cat === 'Clothes') setFormOptions('S, M, L, XL');
      else if (cat === 'Shoes') setFormOptions('40, 41, 42, 43, 44, 45');
      else setFormOptions('Obsidian Black, Alabaster White, Black/Gold');
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(formPrice);
    if (!formName.trim() || !numericPrice || numericPrice <= 0) return;

    setSavingProduct(true);
    try {
      const optionsArr = formOptions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: formName.trim(),
        category: formCategory,
        gender: formGender,
        price: numericPrice,
        image: formImage.trim(),
        options: optionsArr,
        description: formDescription.trim(),
        isBestSeller: formBestSeller,
      };

      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products';
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save product.');
      }

      await onRefreshProducts();
      setEditorOpen(false);
      showNotice(
        editingProduct
          ? `Updated "${formName.trim()}" successfully.`
          : `Added "${formName.trim()}" to the boutique.`
      );
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Error saving product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleQuickPriceSave = async (product: Product) => {
    const val = Number(inlinePrices[product.id]);
    if (!val || val <= 0) return;

    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ price: val }),
    });
    if (res.ok) {
      await onRefreshProducts();
      showNotice(`Price for ${product.name} updated to ${formatNaira(val)}.`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setConfirmDeleteId(null);
      await onRefreshProducts();
      showNotice('Product removed from catalog.');
    }
  };

  const handleOrderStatus = async (orderId: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      showNotice(`Order status updated to ${status}.`);
    }
  };

  const handleEnquiryStatus = async (enquiryId: string, status: EnquiryStatus) => {
    const res = await fetch(`/api/enquiries/${enquiryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setEnquiries((prev) =>
        prev.map((eq) => (eq.id === enquiryId ? { ...eq, status } : eq))
      );
      showNotice(`Enquiry marked as ${status}.`);
    }
  };

  if (checkingAuth) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="text-sm text-[#6B665C]">Verifying owner session...</p>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-md mx-auto bg-white border border-[#E5DFD3] shadow-sm">
          <div className="px-7 py-6 bg-[#0B0B0D] text-[#FAF8F4] border-b border-[#C6A254]/30">
            <div className="flex items-center gap-2.5 text-[#C6A254] text-xs uppercase tracking-widest mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Owner Access</span>
            </div>
            <h1 className="font-serif text-2xl font-semibold">
              Wealth Fashion Admin
            </h1>
            <p className="mt-1 text-xs text-[#FAF8F4]/70">
              Sign in to manage boutique inventory, prices, photos, orders, and customer enquiries.
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-7 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                Owner Email
              </label>
              <input
                type="email"
                required
                placeholder={BUSINESS_INFO.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[#FAF8F4] border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter owner password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[#FAF8F4] border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
              />
            </div>

            {authError && (
              <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-2">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full min-h-[46px] px-5 py-3 text-sm font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {loggingIn ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </section>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const newEnquiryCount = enquiries.filter((e) => e.status === 'New Enquiry').length;

  return (
    <section className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5DFD3]">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#9D7B32] font-semibold">
            Boutique Management Console
          </p>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#0B0B0D]">
            Wealth Fashion Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openAddEditor}
            className="min-h-[42px] px-4 py-2 text-xs font-semibold bg-[#C6A254] text-[#0B0B0D] hover:bg-[#B89242] inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
          <button
            type="button"
            onClick={() => fetchAdminCollections(token)}
            className="min-h-[42px] px-4 py-2 text-xs font-medium bg-white border border-[#DCD5C7] text-[#0B0B0D] hover:bg-[#FAF8F4] whitespace-nowrap cursor-pointer"
          >
            Refresh Data
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[42px] px-4 py-2 text-xs font-medium bg-[#0B0B0D] text-[#FAF8F4] hover:bg-[#232329] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {feedbackBanner && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#0B0B0D] text-[#C6A254] text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5DFD3] p-5">
          <p className="text-xs text-[#6B665C]">Catalog Products</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0B0B0D] tabular-nums">
            {products.length}
          </p>
        </div>
        <div className="bg-white border border-[#E5DFD3] p-5">
          <p className="text-xs text-[#6B665C]">Total Orders</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0B0B0D] tabular-nums">
            {orders.length}
          </p>
        </div>
        <div className="bg-white border border-[#E5DFD3] p-5">
          <p className="text-xs text-[#6B665C]">New Enquiries</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#9D7B32] tabular-nums">
            {newEnquiryCount}
          </p>
        </div>
        <div className="bg-white border border-[#E5DFD3] p-5">
          <p className="text-xs text-[#6B665C]">Recorded Order Value</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[#0B0B0D] tabular-nums">
            {formatNaira(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5DFD3] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-[#0B0B0D] text-[#C6A254]'
              : 'bg-white border border-[#DCD5C7] text-[#44403C] hover:border-[#0B0B0D]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Products ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#0B0B0D] text-[#C6A254]'
              : 'bg-white border border-[#DCD5C7] text-[#44403C] hover:border-[#0B0B0D]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Orders ({orders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('enquiries')}
          className={`px-4 py-2 text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'enquiries'
              ? 'bg-[#0B0B0D] text-[#C6A254]'
              : 'bg-white border border-[#DCD5C7] text-[#44403C] hover:border-[#0B0B0D]'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>
            Customer Enquiries ({enquiries.length}
            {newEnquiryCount > 0 ? ` · ${newEnquiryCount} New` : ''})
          </span>
        </button>
      </div>

      {/* TAB 1: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-[#E5DFD3] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-[#E5DFD3] bg-[#FAF8F4] text-xs uppercase tracking-wider text-[#6B665C]">
                <th className="py-3.5 px-4 font-semibold">Product</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Price (₦)</th>
                <th className="py-3.5 px-4 font-semibold">Options</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE0] text-sm">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[#FAF8F4]/60">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-12 shrink-0 overflow-hidden bg-[#F3EFE6]">
                        <ResilientImage
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0B0B0D]">{product.name}</p>
                        <p className="text-xs text-[#6B665C]">
                          {product.gender}
                          {product.isBestSeller ? ' · Best Seller' : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-[#44403C]">
                    {product.category}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={500}
                        value={inlinePrices[product.id] ?? String(product.price)}
                        onChange={(e) =>
                          setInlinePrices((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        className="w-28 px-2.5 py-1.5 text-xs font-mono bg-[#FAF8F4] border border-[#DCD5C7] tabular-nums focus:border-[#0B0B0D] focus:outline-none"
                      />
                      {Number(inlinePrices[product.id]) !== product.price && (
                        <button
                          type="button"
                          onClick={() => handleQuickPriceSave(product)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-[#C6A254] text-[#0B0B0D] hover:bg-[#B89242] cursor-pointer"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#57534E]">
                    {product.options.join(', ')}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditEditor(product)}
                        className="px-3 py-1.5 text-xs font-medium border border-[#DCD5C7] text-[#0B0B0D] hover:bg-[#FAF8F4] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit / Photo</span>
                      </button>

                      {confirmDeleteId === product.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-red-700 text-white hover:bg-red-800 cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 text-xs border border-[#DCD5C7] text-[#44403C] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(product.id)}
                          aria-label={`Delete ${product.name}`}
                          className="p-1.5 border border-[#DCD5C7] text-[#78716C] hover:text-red-700 hover:border-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingAdminData && orders.length === 0 ? (
            <p className="text-sm text-[#6B665C]">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-[#E5DFD3] p-10 text-center text-sm text-[#6B665C]">
              No customer orders yet.
            </div>
          ) : (
            orders.map((order) => {
              const replyUrl = buildCustomerWhatsAppReplyUrl(
                order.customerPhone,
                `Hello ${order.customerName}, thank you for your order (${order.orderNumber}) with Wealth Fashion Boutique!`
              );
              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#E5DFD3] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B665C]">
                      <span className="font-mono font-semibold text-[#0B0B0D]">
                        {order.orderNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{order.source}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="text-sm font-semibold text-[#0B0B0D]">
                      {order.customerName}{' '}
                      <span className="font-mono font-normal text-[#57534E]">
                        ({order.customerPhone})
                      </span>
                    </div>

                    <p className="text-xs text-[#57534E]">
                      Delivery: {order.deliveryAddress}
                      {order.note ? ` · Note: "${order.note}"` : ''}
                    </p>

                    <div className="pt-2 space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={`${order.id}-${idx}`} className="text-xs text-[#292524]">
                          {item.quantity}x <span className="font-medium">{item.name}</span> ({item.selectedOption}) —{' '}
                          <span className="font-mono tabular-nums">
                            {formatNaira(item.price * item.quantity)}
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
                    <p className="font-mono text-lg font-semibold text-[#0B0B0D] tabular-nums">
                      {formatNaira(order.totalAmount)}
                    </p>
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleOrderStatus(order.id, e.target.value as OrderStatus)
                        }
                        className="px-3 py-1.5 text-xs font-medium bg-[#FAF8F4] border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                      <a
                        href={replyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#232329] inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: ENQUIRIES */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          {loadingAdminData && enquiries.length === 0 ? (
            <p className="text-sm text-[#6B665C]">Loading customer enquiries...</p>
          ) : enquiries.length === 0 ? (
            <div className="bg-white border border-[#E5DFD3] p-10 text-center text-sm text-[#6B665C]">
              No customer enquiries yet.
            </div>
          ) : (
            enquiries.map((enquiry) => {
              const isNew = enquiry.status === 'New Enquiry';
              const waReplyUrl = buildCustomerWhatsAppReplyUrl(
                enquiry.customerPhone,
                `Hello ${enquiry.customerName}, this is Wealth Fashion Boutique replying to your enquiry about ${enquiry.productName} (${enquiry.selectedOption}).`
              );
              return (
                <div
                  key={enquiry.id}
                  className="bg-white border border-[#E5DFD3] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          isNew ? 'text-[#9D7B32]' : 'text-[#57534E]'
                        }`}
                      >
                        {enquiry.status}
                      </span>
                      <span className="text-[#78716C]" aria-hidden="true">·</span>
                      <span className="text-[#6B665C]">{enquiry.source}</span>
                      <span className="text-[#78716C]" aria-hidden="true">·</span>
                      <span className="text-[#6B665C]">
                        {new Date(enquiry.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#0B0B0D]">
                      {enquiry.customerName}{' '}
                      <span className="font-mono font-normal text-[#57534E]">
                        ({enquiry.customerPhone})
                      </span>
                    </p>

                    <p className="text-xs font-medium text-[#292524]">
                      Requested: {enquiry.productName} · Option: {enquiry.selectedOption}
                    </p>

                    <p className="text-sm text-[#57534E] leading-relaxed">
                      “{enquiry.message}”
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleEnquiryStatus(
                          enquiry.id,
                          isNew ? 'Replied' : 'New Enquiry'
                        )
                      }
                      className="px-3 py-2 text-xs font-medium border border-[#DCD5C7] text-[#0B0B0D] hover:bg-[#FAF8F4] cursor-pointer"
                    >
                      {isNew ? 'Mark as Replied' : 'Reopen as New'}
                    </button>
                    <a
                      href={waReplyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 text-xs font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#232329] inline-flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Reply on WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingProduct ? 'Edit Product' : 'Add New Product'}
        >
          <div className="w-full max-w-xl bg-white border border-[#E5DFD3] shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0B0B0D] text-[#FAF8F4]">
              <h2 className="font-serif text-xl font-semibold">
                {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Boutique Piece'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                aria-label="Close product editor"
                className="p-2 text-[#FAF8F4]/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Victoria Gold Silk Agbada"
                  className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      handleCategoryChangeInForm(e.target.value as ProductCategory)
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                  >
                    <option value="Clothes">Clothes</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Caps">Caps</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                    Collection
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) =>
                      setFormGender(e.target.value as GenderAudience)
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                    Price (₦ Naira) *
                  </label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm font-mono tabular-nums border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                  {formCategory === 'Caps' ? 'Colours' : 'Sizes'} (comma-separated)
                </label>
                <input
                  type="text"
                  value={formOptions}
                  onChange={(e) => setFormOptions(e.target.value)}
                  placeholder="S, M, L, XL"
                  className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                  Product Picture (Paste URL, Upload Image, or Choose Studio Shot)
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <div className="w-24 h-20 shrink-0 overflow-hidden bg-[#F3EFE6] border border-[#E5DFD3]">
                    <ResilientImage
                      src={formImage}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="/src/assets/images/..."
                      className="w-full min-h-[40px] px-3 py-2 text-xs font-mono border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 text-xs font-medium bg-[#FAF8F4] border border-[#DCD5C7] hover:border-[#0B0B0D] inline-flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) setFormImage(e.target.value);
                        }}
                        className="px-2.5 py-1.5 text-xs bg-[#FAF8F4] border border-[#DCD5C7] focus:outline-none"
                      >
                        <option value="">Choose Studio Image...</option>
                        {PRESET_GALLERY_IMAGES.map((img) => (
                          <option key={img.url} value={img.url}>
                            {img.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#44403C] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Material, tailoring, and occasion details..."
                  className="w-full px-3 py-2 text-sm border border-[#DCD5C7] focus:border-[#0B0B0D] focus:outline-none"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#292524] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formBestSeller}
                  onChange={(e) => setFormBestSeller(e.target.checked)}
                  className="accent-[#0B0B0D]"
                />
                <span>Feature in Homepage Best Sellers</span>
              </label>

              <div className="pt-3 border-t border-[#EFEAE0] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2.5 text-xs font-medium border border-[#DCD5C7] text-[#44403C] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-6 py-2.5 text-xs font-semibold bg-[#0B0B0D] text-[#C6A254] hover:bg-[#1E1E24] disabled:opacity-60 cursor-pointer"
                >
                  {savingProduct
                    ? 'Saving...'
                    : editingProduct
                      ? 'Save Changes'
                      : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
