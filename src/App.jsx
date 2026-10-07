import { useState } from "react";

function App() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const openForm = () => {
    setSubmitted(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSubmitted(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("SUBMIT BUTTON CLICKED");

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/free-analysis",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      console.log("Backend response:", data);

      if (!response.ok || !data.success) {
        alert(data.message || "Something went wrong.");
        return;
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Connection error:", error);
      alert("Could not connect to Bizora AI server.");
    }
  };

  // =========================================================
  // LOGIN / REGISTER
  // =========================================================

  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    setAuthLoading(true);
    setAuthError("");

    const formData = new FormData(e.currentTarget);

    const endpoint =
      authMode === "login"
        ? "/api/auth/login"
        : "/api/auth/register";

    try {
      const response = await fetch(
        `http://127.0.0.1:8000${endpoint}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAuthError(
          data.detail ||
            data.message ||
            "Something went wrong."
        );

        return;
      }

      // Save JWT token
      localStorage.setItem(
        "bizora_token",
        data.access_token
      );

      // Save user information
      localStorage.setItem(
        "bizora_user",
        JSON.stringify(data.user)
      );

      console.log("Authentication successful:", data);

      // Redirect to dashboard
      window.location.href = "/admin";
    } catch (error) {
      console.error(
        "Authentication error:",
        error
      );

      setAuthError(
        "Could not connect to Bizora AI server."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // =========================================================
  // OPEN LOGIN
  // =========================================================

  const openLogin = () => {
    setAuthMode("login");
    setAuthError("");
    setShowAuth(true);
  };

  // =========================================================
  // OPEN REGISTER
  // =========================================================

  const openRegister = () => {
    setAuthMode("register");
    setAuthError("");
    setShowAuth(true);
  };

  // =========================================================
  // CLOSE AUTH
  // =========================================================

  const closeAuth = () => {
    setShowAuth(false);
    setAuthError("");
    setAuthLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="border-b border-slate-800/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">

          {/* Logo */}

          <a
            href="#"
            className="text-2xl font-bold tracking-tight"
          >
            Bizora
            <span className="text-blue-500">
              AI
            </span>
          </a>

          {/* Navigation */}

          <div className="hidden items-center gap-8 md:flex">

            <a
              href="#features"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              How It Works
            </a>

            <a
              href="#pricing"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Pricing
            </a>

          </div>

          {/* CTA */}

          <div className="flex items-center gap-3">

            <button
              onClick={openLogin}
              className="rounded-xl border border-slate-700 px-5 py-2.5 font-semibold transition hover:bg-slate-900"
            >
              Login
            </button>

            <button
              onClick={openForm}
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold transition hover:bg-blue-500"
            >
              Get Started
            </button>

          </div>

        </div>
      </nav>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="relative overflow-hidden">

        {/* Background glow */}

        <div className="pointer-events-none absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 text-center lg:px-8">

          {/* Badge */}

          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">

            <span>✨</span>

            AI-powered business intelligence

          </div>

          {/* Heading */}

          <h1 className="mx-auto max-w-5xl text-5xl font-bold tracking-tight md:text-7xl">

            Run Your Business

            <span className="block text-blue-500">
              Smarter With AI.
            </span>

          </h1>

          {/* Description */}

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">

            Bizora AI turns your sales, customer and inventory data
            into clear insights and smarter business decisions.

          </p>

          {/* Buttons */}

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">

            <button
              onClick={openForm}
              className="rounded-xl bg-blue-600 px-7 py-3.5 font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Get Free Business Analysis →
            </button>

            <a
              href="#dashboard"
              className="rounded-xl border border-slate-700 px-7 py-3.5 font-semibold transition hover:bg-slate-900"
            >
              View Live Demo
            </a>

          </div>

          <p className="mt-5 text-sm text-slate-500">
            No credit card required • Free analysis
          </p>

        </div>
      </section>

      {/* =================================================
          DASHBOARD
      ================================================= */}

      <section
        id="dashboard"
        className="mx-auto max-w-6xl px-6 pb-24 lg:px-8"
      >

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl">

          {/* Dashboard header */}

          <div className="flex flex-col justify-between gap-3 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center">

            <div>

              <p className="text-sm text-slate-400">
                Business Overview
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Good morning 👋
              </h2>

            </div>

            <div className="text-sm text-slate-400">
              Last 30 days
            </div>

          </div>

          {/* Stats */}

          <div className="grid grid-cols-2 gap-4 p-6 lg:grid-cols-4">

            <Stat
              title="Revenue"
              value="₹4.82L"
              change="+12.4%"
            />

            <Stat
              title="Orders"
              value="1,284"
              change="+8.2%"
            />

            <Stat
              title="Customers"
              value="892"
              change="+14.6%"
            />

            <Stat
              title="Pending"
              value="₹86K"
              change="12 invoices"
              negative
            />

          </div>

          {/* Chart */}

          <div className="px-6 pb-6">

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">

              <div className="mb-8 flex items-start justify-between">

                <div>

                  <p className="text-sm text-slate-400">
                    Revenue Overview
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    ₹4,82,640
                  </p>

                </div>

                <span className="text-sm font-medium text-green-400">
                  ↑ 12.4%
                </span>

              </div>

              {/* Chart */}

              <div className="flex h-44 items-end gap-2 sm:gap-3">

                {[
                  35,
                  48,
                  42,
                  65,
                  54,
                  72,
                  64,
                  86,
                  73,
                  95,
                  82,
                  100,
                ].map((height, index) => (

                  <div
                    key={index}
                    className="flex-1 rounded-t-md bg-blue-600/70 transition hover:bg-blue-500"
                    style={{
                      height: `${height}%`,
                    }}
                  />

                ))}

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =================================================
          FEATURES
      ================================================= */}

      <section
        id="features"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
      >

        <div className="mx-auto max-w-2xl text-center">

          <p className="font-medium text-blue-500">
            POWERFUL INSIGHTS
          </p>

          <h2 className="mt-3 text-4xl font-bold tracking-tight">
            Understand your business better
          </h2>

          <p className="mt-5 text-slate-400">
            Stop guessing. Let AI discover the patterns hidden
            inside your business data.
          </p>

        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">

          <Feature
            icon="📊"
            title="Sales Analytics"
            description="Understand revenue trends, best-selling products and sales performance."
          />

          <Feature
            icon="👥"
            title="Customer Insights"
            description="Discover your most valuable customers and understand their buying behavior."
          />

          <Feature
            icon="🤖"
            title="AI Business Assistant"
            description="Ask questions about your business data and get instant answers."
          />

        </div>

      </section>

      {/* =================================================
          HOW IT WORKS
      ================================================= */}

      <section
        id="how-it-works"
        className="border-y border-slate-800 bg-slate-900/30"
      >

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">

          <div className="text-center">

            <p className="font-medium text-blue-500">
              HOW IT WORKS
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              From raw data to smart decisions
            </h2>

          </div>

          <div className="mt-16 grid gap-10 md:grid-cols-3">

            <Step
              number="01"
              title="Connect Your Data"
              description="Upload your sales or business data in Excel or CSV format."
            />

            <Step
              number="02"
              title="Let AI Analyze"
              description="Bizora AI finds trends, patterns and opportunities automatically."
            />

            <Step
              number="03"
              title="Take Action"
              description="Use clear insights to make faster and smarter business decisions."
            />

          </div>

        </div>
      </section>

      {/* =================================================
          PRICING
      ================================================= */}

      <section
        id="pricing"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
      >

        <div className="text-center">

          <p className="font-medium text-blue-500">
            SIMPLE PRICING
          </p>

          <h2 className="mt-3 text-4xl font-bold">
            Start small. Grow with Bizora.
          </h2>

        </div>

        <div className="mx-auto mt-14 max-w-md">

          <div className="rounded-2xl border border-blue-500/40 bg-slate-900 p-8 shadow-xl">

            <p className="text-sm font-medium text-blue-400">
              BUSINESS
            </p>

            <h3 className="mt-3 text-3xl font-bold">

              ₹2,999

              <span className="text-base font-normal text-slate-500">
                /month
              </span>

            </h3>

            <p className="mt-3 text-slate-400">
              Everything you need to understand and grow your business.
            </p>

            <div className="mt-7 space-y-4 text-sm text-slate-300">

              <p>✓ Sales analytics</p>
              <p>✓ Customer insights</p>
              <p>✓ AI business assistant</p>
              <p>✓ Revenue forecasting</p>
              <p>✓ Business reports</p>

            </div>

            <button
              onClick={openForm}
              className="mt-8 w-full rounded-xl bg-blue-600 py-3.5 font-semibold transition hover:bg-blue-500"
            >
              Start Free Analysis
            </button>

          </div>
        </div>

      </section>

      {/* =================================================
          FINAL CTA
      ================================================= */}

      <section className="mx-auto max-w-5xl px-6 py-28 text-center">

        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
          Ready to understand your business better?
        </h2>

        <p className="mt-5 text-lg text-slate-400">
          Get your first business analysis completely free.
        </p>

        <button
          onClick={openForm}
          className="mt-8 rounded-xl bg-blue-600 px-8 py-4 font-semibold transition hover:bg-blue-500"
        >
          Get Free Business Analysis →
        </button>

      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t border-slate-800">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 py-8 sm:flex-row lg:px-8">

          <div className="font-semibold">
            Bizora
            <span className="text-blue-500">
              AI
            </span>
          </div>

          <p className="text-sm text-slate-500">
            © 2026 Bizora AI. All rights reserved.
          </p>

        </div>

      </footer>

      {/* =================================================
          AUTH MODAL
      ================================================= */}

      {showAuth && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">

            {/* Header */}

            <div className="mb-7 flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-blue-500">
                  BIZORA AI
                </p>

                <h2 className="mt-2 text-2xl font-bold">

                  {authMode === "login"
                    ? "Welcome Back"
                    : "Create Your Account"}

                </h2>

                <p className="mt-2 text-sm text-slate-400">

                  {authMode === "login"
                    ? "Login to access your business dashboard."
                    : "Create your Bizora AI business account."}

                </p>

              </div>

              <button
                onClick={closeAuth}
                className="text-xl text-slate-400 transition hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>

            </div>

            {/* Error */}

            {authError && (

              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">

                {authError}

              </div>

            )}

            {/* Auth Form */}

            <form
              onSubmit={handleAuthSubmit}
              className="space-y-4"
            >

              {/* REGISTER FIELDS */}

              {authMode === "register" && (

                <>

                  {/* Shop Name */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Shop / Business Name
                    </label>

                    <input
                      name="shop_name"
                      required
                      type="text"
                      placeholder="e.g. Sharma Fashion"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />

                  </div>

                  {/* Owner Name */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Owner Name
                    </label>

                    <input
                      name="owner_name"
                      required
                      type="text"
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />

                  </div>

                  {/* Phone */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Phone Number
                    </label>

                    <input
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />

                  </div>

                </>

              )}

              {/* EMAIL */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email Address
                </label>

                <input
                  name="email"
                  required
                  type="email"
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />

              </div>

              {/* PASSWORD */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>

                <input
                  name="password"
                  required
                  minLength={6}
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />

              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={authLoading}
                className="mt-3 w-full rounded-xl bg-blue-600 py-3.5 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                  ? "Login to Bizora AI →"
                  : "Create Account →"}

              </button>

            </form>

            {/* SWITCH LOGIN / REGISTER */}

            <div className="mt-6 border-t border-slate-800 pt-5 text-center">

              {authMode === "login" ? (

                <p className="text-sm text-slate-400">

                  Don't have an account?{" "}

                  <button
                    type="button"
                    onClick={openRegister}
                    className="font-semibold text-blue-500 hover:text-blue-400"
                  >
                    Create Account
                  </button>

                </p>

              ) : (

                <p className="text-sm text-slate-400">

                  Already have an account?{" "}

                  <button
                    type="button"
                    onClick={openLogin}
                    className="font-semibold text-blue-500 hover:text-blue-400"
                  >
                    Login
                  </button>

                </p>

              )}

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          FREE ANALYSIS MODAL
      ================================================= */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">

            {!submitted ? (

              <>

                {/* Modal Header */}

                <div className="mb-7 flex items-start justify-between">

                  <div>

                    <h2 className="text-2xl font-bold">
                      Get Your Free Analysis
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-slate-400">

                      Tell us about your business and upload your
                      sales data. We'll show you what your data can reveal.

                    </p>

                  </div>

                  <button
                    onClick={closeForm}
                    className="ml-4 text-xl text-slate-400 transition hover:text-white"
                    aria-label="Close"
                  >
                    ✕
                  </button>

                </div>

                {/* Form */}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >

                  {/* Business Name */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Business Name
                    </label>

                    <input
                      name="business_name"
                      required
                      type="text"
                      placeholder="e.g. Sharma Fashion"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />

                  </div>

                  {/* Business Type */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Business Type
                    </label>

                    <select
                      name="business_type"
                      required
                      defaultValue=""
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-300 outline-none focus:border-blue-500"
                    >

                      <option value="" disabled>
                        Select business type
                      </option>

                      <option value="Retail Store">
                        Retail Store
                      </option>

                      <option value="Wholesale Business">
                        Wholesale Business
                      </option>

                      <option value="Restaurant">
                        Restaurant
                      </option>

                      <option value="Gym / Fitness">
                        Gym / Fitness
                      </option>

                      <option value="Service Business">
                        Service Business
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>

                  {/* Owner Name */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Your Name
                    </label>

                    <input
                      name="owner_name"
                      required
                      type="text"
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />

                  </div>

                  {/* WhatsApp */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      WhatsApp Number
                    </label>

                    <input
                      name="whatsapp"
                      required
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />

                  </div>

                  {/* Email */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Email Address
                    </label>

                    <input
                      name="email"
                      required
                      type="email"
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />

                  </div>

                  {/* Sales File */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Sales Data
                    </label>

                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4">

                      <input
                        name="sales_file"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-blue-500"
                      />

                      <p className="mt-2 text-xs text-slate-600">
                        Supported formats: CSV, XLSX, XLS
                      </p>

                    </div>

                  </div>

                  {/* Submit */}

                  <button
                    type="submit"
                    className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 font-semibold transition hover:bg-blue-500"
                  >
                    Get My Free Analysis →
                  </button>

                  <p className="text-center text-xs text-slate-600">
                    Your business data is kept private.
                  </p>

                </form>

              </>

            ) : (

              /* ================= SUCCESS ================= */

              <div className="py-10 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-3xl">
                  ✓
                </div>

                <h2 className="mt-6 text-2xl font-bold">
                  Request Received!
                </h2>

                <p className="mx-auto mt-3 max-w-sm leading-relaxed text-slate-400">

                  Thanks! We'll review your business information
                  and get back to you with your free analysis.

                </p>

                <button
                  onClick={closeForm}
                  className="mt-7 rounded-xl border border-slate-700 px-6 py-3 transition hover:bg-slate-800"
                >
                  Close
                </button>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

/* =================================================
                   COMPONENTS
================================================= */

function Stat({
  title,
  value,
  change,
  negative = false
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

      <p
        className={`mt-2 text-sm ${
          negative
            ? "text-orange-400"
            : "text-green-400"
        }`}
      >
        {change}
      </p>

    </div>
  );
}

function Feature({
  icon,
  title,
  description
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-7 transition hover:-translate-y-1 hover:border-blue-600/50">

      <div className="text-3xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 leading-relaxed text-slate-400">
        {description}
      </p>

    </div>
  );
}

function Step({
  number,
  title,
  description
}) {
  return (
    <div className="text-center">

      <div className="text-sm font-bold text-blue-500">
        {number}
      </div>

      <h3 className="mt-3 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 leading-relaxed text-slate-400">
        {description}
      </p>

    </div>
  );
}

export default App;