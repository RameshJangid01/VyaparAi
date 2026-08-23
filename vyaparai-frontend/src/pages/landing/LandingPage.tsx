import { useState } from 'react'
import { Button, Drawer } from 'antd'
import {
  ArrowRightOutlined,
  ThunderboltOutlined,
  MenuOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  GiftOutlined,
  MedicineBoxOutlined,
  ToolOutlined,
  TagsOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  BulbOutlined,
  FileTextOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  TeamOutlined,
  ShopOutlined,
  BarChartOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import { APP_TAGLINE } from '../../constants'

// --------------------------------------------------------------------------
// Static content — kept as data so the JSX below stays about layout, not copy.
// --------------------------------------------------------------------------

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#industries', label: 'Industries' },
]

const OLD_WAY_PAINS = [
  {
    icon: <ClockCircleOutlined />,
    title: 'Guesswork Ordering',
    body: 'You stock what "felt right" last year, not what the data says is coming — so you run out during the rush and sit on dead stock after.',
  },
  {
    icon: <FileTextOutlined />,
    title: 'Ledgers & Loose Bills',
    body: "Sales, purchases, and dues live across notebooks, WhatsApp chats, and memory. Nobody can tell you today's real profit in one glance.",
  },
  {
    icon: <GiftOutlined />,
    title: 'Festivals Catch You Off Guard',
    body: 'Diwali, Navratri, Eid — demand spikes are predictable, but without a system tracking it, you find out too late to restock in time.',
  },
]

const SOLUTION_POINTS = [
  {
    icon: <DashboardOutlined />,
    title: 'One Screen, Whole Store',
    body: 'Billing, inventory, purchases, customers, and suppliers — replacing five different diaries with one live dashboard.',
  },
  {
    icon: <RobotOutlined />,
    title: 'AI That Explains Itself',
    body: 'VyaparAI reads your real sales and stock data, then tells you in plain language what to reorder and why — never invented numbers.',
  },
  {
    icon: <FireOutlined />,
    title: 'Festival Demand, Ahead of Time',
    body: 'Every major Indian festival is mapped to the categories it affects, so you get a restock nudge weeks before the rush, not during it.',
  },
]

const STATS = [
  { value: '5', label: 'Modules Replaced', sub: 'Billing, stock, purchases, customers & reports — one login' },
  { value: '2×', label: 'Faster Billing', sub: 'GST-ready invoices generated in seconds, not minutes' },
  { value: '100%', label: 'Real Data, No Guessing', sub: 'Every AI insight is traced back to your own sales & stock' },
  { value: '24/7', label: 'Always Watching Stock', sub: 'Low-stock and festival alerts, even while you sleep' },
]

const RUN_STORE_FEATURES = [
  { icon: <ShoppingCartOutlined />, title: 'Fast, GST-Ready Billing', body: 'Create invoices in seconds with automatic tax calculation and instant PDF sharing.' },
  { icon: <AppstoreOutlined />, title: 'Product Catalog', body: 'Track every SKU with category, pricing, and purchase cost in one organized place.' },
  { icon: <DatabaseOutlined />, title: 'Live Inventory Tracking', body: 'Stock levels update automatically with every sale and purchase — no manual counting.' },
  { icon: <ShopOutlined />, title: 'Purchases & Suppliers', body: 'Log incoming stock, track supplier dues, and keep your restocking history in one thread.' },
  { icon: <TeamOutlined />, title: 'Customer Ledger', body: 'See purchase history and outstanding dues for every customer, without flipping through pages.' },
  { icon: <BarChartOutlined />, title: 'Reports That Make Sense', body: 'Profit, revenue, and top-seller reports built from your actual transactions, not estimates.' },
]

const GROW_AI_FEATURES = [
  { icon: <RobotOutlined />, title: 'VyaparAI Insights', body: 'Plain-language recommendations on what to restock, price, or promote — generated from your live data.' },
  { icon: <GiftOutlined />, title: 'Festival Demand Calendar', body: 'Upcoming festivals mapped to your product categories with an expected demand multiplier.' },
  { icon: <LineChartOutlined />, title: 'Demand Forecasting', body: 'Deterministic, explainable forecasts for what sells more before a season hits — not a black box.' },
  { icon: <SafetyCertificateOutlined />, title: 'Low-Stock Alerts', body: 'Get flagged before you run out, factoring in upcoming festival demand — not just current stock.' },
]

const WHY_CHOOSE = [
  { icon: <ClockCircleOutlined />, title: 'Save Hours Every Week', body: 'No more manual ledgers or cross-checking notebooks — one system does the counting for you.' },
  { icon: <RiseOutlined />, title: 'Never Miss a Festival Rush', body: 'Know what to stock up on, and when, before Diwali or Navratri demand actually hits.' },
  { icon: <BulbOutlined />, title: 'Decisions Backed by Data', body: 'Every AI suggestion is grounded in your real sales and stock — you always see the "why".' },
  { icon: <SafetyCertificateOutlined />, title: 'Built for Indian Retail', body: 'GST-ready billing and a festival calendar tuned to how Indian shopping seasons actually move.' },
  { icon: <TeamOutlined />, title: 'Your Whole Business, One Login', body: 'Owner, staff, billing counter, and reports — no juggling between apps or spreadsheets.' },
]

const STEPS = [
  { title: 'Create Your Business Account', body: 'Sign up with your shop details in under two minutes — no paperwork, no waiting.' },
  { title: 'Add Products & Suppliers', body: 'Bring in your catalog and starting stock, or add products as you bill them.' },
  { title: 'Bill, Track & Let AI Guide You', body: 'Sell as usual — VyaparAI quietly tracks patterns and tells you what to do next.' },
]

const INDUSTRIES = [
  { icon: <ShopOutlined />, title: 'Kirana & Grocery Stores' },
  { icon: <TagsOutlined />, title: 'Apparel & Footwear' },
  { icon: <MedicineBoxOutlined />, title: 'Pharmacies' },
  { icon: <ToolOutlined />, title: 'Hardware & Electricals' },
  { icon: <AppstoreOutlined />, title: 'Electronics & Mobiles' },
  { icon: <GiftOutlined />, title: 'Gift & Festival Shops' },
]

const FESTIVAL_RADAR = [
  { name: 'Ganesh Chaturthi', date: '2 Sep', demand: 50, categories: ['Groceries', 'Dairy', 'Snacks'] },
  { name: 'Navratri & Dussehra', date: '14 Sep', demand: 60, categories: ['Groceries', 'Beverages'] },
  { name: 'Diwali', date: '4 Oct', demand: 100, categories: ['Snacks', 'Dairy', 'Beverages'] },
]

// --------------------------------------------------------------------------
// Small presentational pieces
// --------------------------------------------------------------------------

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-brand-blue/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-brand-blue">
      {children}
    </span>
  )
}

/**
 * The hero's signature element. Mirrors the real "Upcoming Festivals" cards
 * on the actual product Dashboard — this is VyaparAI's real differentiator,
 * so the marketing page shows the real thing instead of a generic mockup.
 */
function FestivalRadarCard() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-green" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Live Festival Demand Radar
          </span>
        </div>
        <GiftOutlined className="text-orange-400" />
      </div>

      <div className="space-y-3">
        {FESTIVAL_RADAR.map((f) => (
          <div key={f.name} className="rounded-xl border border-orange-100 bg-orange-50/60 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-navy">{f.name}</span>
              <span className="text-xs font-medium text-gray-500">{f.date}</span>
            </div>
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-brand-blue"
                style={{ width: `${Math.min(f.demand, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {f.categories.map((c) => (
                  <span key={c} className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                    {c}
                  </span>
                ))}
              </div>
              <span className="text-xs font-bold text-brand-green">+{f.demand}% demand</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// Page
// --------------------------------------------------------------------------

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activeFeatureTab, setActiveFeatureTab] = useState<'store' | 'ai'>('store')

  const activeFeatures = activeFeatureTab === 'store' ? RUN_STORE_FEATURES : GROW_AI_FEATURES

  return (
    <div className="font-sans text-brand-navy">
      {/* ---------------------------------------------------------------- */}
      {/* Navbar                                                          */}
      {/* ---------------------------------------------------------------- */}
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white/90 px-6 py-4 backdrop-blur md:px-12">
        <div className="flex items-center gap-2">
          <Logo height={36} />
          <span className="text-lg font-semibold text-brand-navy">VyaparAI</span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-medium text-brand-navy md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-brand-blue">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login">
            <Button>Login</Button>
          </Link>
          <Link to="/signup">
            <Button type="primary" className="bg-brand-blue">
              Get Started
            </Button>
          </Link>
        </div>

        <button
          aria-label="Open menu"
          className="text-xl text-brand-navy md:hidden"
          onClick={() => setMobileNavOpen(true)}
        >
          <MenuOutlined />
        </button>
      </nav>

      <Drawer
        placement="right"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        closeIcon={<CloseOutlined />}
        width={260}
      >
        <div className="flex flex-col gap-5 text-base font-medium text-brand-navy">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMobileNavOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-3">
            <Link to="/login" onClick={() => setMobileNavOpen(false)}>
              <Button block>Login</Button>
            </Link>
            <Link to="/signup" onClick={() => setMobileNavOpen(false)}>
              <Button block type="primary" className="bg-brand-blue">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </Drawer>

      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-2 lg:px-12">
        <div className="flex flex-col items-start text-left">
          <SectionEyebrow>AI Retail Copilot for Indian Shopkeepers</SectionEyebrow>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-brand-navy md:text-5xl lg:text-6xl">
            Manage Today.{' '}
            <span className="bg-gradient-to-r from-brand-blue to-brand-teal bg-clip-text text-transparent">
              Predict Tomorrow.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-gray-500">
            {APP_TAGLINE === 'Manage Today. Predict Tomorrow.'
              ? 'Smart billing, inventory, and purchase management with AI that tells you what to restock before the festival rush hits — not after.'
              : APP_TAGLINE}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/signup">
              <Button type="primary" size="large" className="bg-brand-blue" icon={<ArrowRightOutlined />}>
                Start Free
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="large" icon={<ThunderboltOutlined />}>
                See How It Works
              </Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400">No credit card required. Set up your store in minutes.</p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <FestivalRadarCard />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Old way / problem                                                */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-slate-50 px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <SectionEyebrow>The Old Problem</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold text-brand-navy md:text-4xl">
              Still running your store on memory and notebooks?
            </h2>
            <p className="mt-4 text-gray-500">
              Manual billing and gut-feel restocking cost you more than time — they cost you sales you never
              see coming and stock you never needed.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {OLD_WAY_PAINS.map((pain) => (
              <div key={pain.title} className="rounded-2xl border-0 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-lg text-red-500">
                  {pain.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-brand-navy">{pain.title}</h3>
                <p className="text-sm text-gray-500">{pain.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Smart solution                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <SectionEyebrow>The Smart Solution</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold text-brand-navy md:text-4xl">
              One system that runs the counter and thinks ahead
            </h2>
            <p className="mt-4 text-gray-500">
              VyaparAI connects your billing, stock, and purchases, then layers deterministic forecasting and
              festival intelligence on top — so recommendations are explainable, never invented.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {SOLUTION_POINTS.map((point) => (
              <div key={point.title} className="rounded-2xl border-0 bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/10 text-lg text-brand-blue">
                  {point.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-brand-navy">{point.title}</h3>
                <p className="text-sm text-gray-500">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Stats bar                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-brand-navy px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <div className="text-3xl font-bold text-white md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm font-semibold text-brand-teal">{stat.label}</div>
              <div className="mt-1 text-xs text-white/50">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Feature tabs                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section id="features" className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <SectionEyebrow>Everything In One Place</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold text-brand-navy md:text-4xl">
              Built for the counter. Sharpened by AI.
            </h2>
          </div>

          <div className="mb-8 inline-flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setActiveFeatureTab('store')}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${activeFeatureTab === 'store' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500'
                }`}
            >
              Run Your Store
            </button>
            <button
              onClick={() => setActiveFeatureTab('ai')}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${activeFeatureTab === 'ai' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500'
                }`}
            >
              Grow With AI
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border-0 bg-white p-5 shadow-sm ring-1 ring-gray-100"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-teal/10 text-base text-brand-teal">
                  {feature.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-brand-navy">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Why choose us                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-slate-50 px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <SectionEyebrow>Why Retailers Choose VyaparAI</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold text-brand-navy md:text-4xl">
              Real benefits for your daily operations
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className="rounded-2xl border-0 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green/10 text-base text-brand-green">
                  {item.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-brand-navy">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 3 steps                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section id="how-it-works" className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <SectionEyebrow>Get Started in 3 Steps</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold text-brand-navy md:text-4xl">
              From sign-up to your first AI insight
            </h2>
            <p className="mt-4 text-gray-500">
              No installation, no training required — if you can bill a customer, you can run VyaparAI.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border-0 bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-base font-semibold text-brand-navy">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-gray-400">
            That's it. No downloads, no complicated setup — just your store, running smarter.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Industries                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section id="industries" className="bg-slate-50 px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <SectionEyebrow>Industries</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-bold text-brand-navy md:text-4xl">
              Built for every retail counter
            </h2>
            <p className="mt-4 text-gray-500">
              From the neighbourhood kirana to the festival gift shop — any store that stocks, sells, and
              restocks can run on VyaparAI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
            {INDUSTRIES.map((industry) => (
              <div
                key={industry.title}
                className="flex flex-col items-center gap-3 rounded-2xl border-0 bg-white p-5 text-center shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/10 text-lg text-brand-blue">
                  {industry.icon}
                </div>
                <span className="text-xs font-semibold text-brand-navy">{industry.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-brand-navy to-[#132a6b] px-8 py-14 text-center text-white md:px-16">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to stop guessing what to stock?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Start free today and get your first AI-backed restock recommendation before your next festival
            rush.
          </p>

          <div className="mx-auto mt-8 flex max-w-md flex-col items-center justify-center gap-3 text-sm text-white/80 sm:flex-row sm:gap-6">
            <span className="flex items-center gap-2">
              <CheckCircleOutlined className="text-brand-green" /> Set up in under 10 minutes
            </span>
            <span className="flex items-center gap-2">
              <CheckCircleOutlined className="text-brand-green" /> No credit card required
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/signup">
              <Button type="primary" size="large" className="bg-brand-blue" icon={<ArrowRightOutlined />}>
                Start Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="large" ghost>
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Footer                                                           */}
      {/* ---------------------------------------------------------------- */}
      <footer className="border-t border-gray-100 px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-sm text-gray-500 md:flex-row">
          <div className="flex items-center gap-2">
            <Logo height={26} />
            <span className="font-semibold text-brand-navy">VyaparAI</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-brand-blue">
                {link.label}
              </a>
            ))}
            <Link to="/login" className="hover:text-brand-blue">
              Login
            </Link>
            <Link to="/signup" className="hover:text-brand-blue">
              Sign Up
            </Link>
          </div>

          <span className="text-xs text-gray-400">
            © {new Date().getFullYear()} VyaparAI. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  )
}