import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

/* ============================================================
   ADMIN DASHBOARD
============================================================ */

function Admin() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");

  /* ============================================================
     GET JWT TOKEN
  ============================================================ */

  const getToken = () => {
    return localStorage.getItem("bizora_token");
  };

  /* ============================================================
     FETCH LEADS
  ============================================================ */

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please login to access the dashboard.");
      }

      const response = await fetch(`${API_BASE}/api/leads`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("bizora_token");
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch leads.");
      }

      const data = await response.json();

      setLeads(data.leads || []);
    } catch (err) {
      console.error("Fetch leads error:", err);

      setLeads([]);

      setError(
        err.message || "Could not load leads."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     ANALYZE LEAD
  ============================================================ */

  const analyzeLead = async (leadId) => {
    try {
      setAnalyzingId(leadId);
      setAnalysis(null);
      setAnalysisError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Please login to analyze this business."
        );
      }

      const response = await fetch(
        `${API_BASE}/api/analyze/${leadId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log("Analysis Response:", data);

      if (response.status === 401) {
        localStorage.removeItem("bizora_token");

        throw new Error(
          "Session expired. Please login again."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Analysis failed."
        );
      }

      setAnalysis(data);
    } catch (err) {
      console.error("Analysis error:", err);

      setAnalysisError(
        err.message ||
          "Could not analyze this business."
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  /* ============================================================
     CLOSE ANALYSIS
  ============================================================ */

  const closeAnalysis = () => {
    setAnalysis(null);
    setAnalysisError("");
  };

  /* ============================================================
     LOAD DATA
  ============================================================ */

  useEffect(() => {
    fetchLeads();
  }, []);

  const uploadedFiles = leads.filter(
    (lead) => lead.file_name
  ).length;

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold shadow-lg shadow-blue-600/20">
              B
            </div>

            <div>
              <div className="text-xl font-bold">
                Bizora
                <span className="text-blue-500">
                  AI
                </span>
              </div>

              <p className="hidden text-[11px] text-slate-500 sm:block">
                Business Intelligence
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={fetchLeads}
              className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm transition hover:bg-slate-800 md:px-4"
            >
              ↻{" "}
              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            <a
              href="/"
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500 md:px-4"
            >
              Website
            </a>

          </div>

        </div>
      </header>

      {/* MAIN */}

      <main className="mx-auto max-w-7xl px-4 py-7 md:px-6 md:py-10">

        {/* INTRO */}

        <div className="mb-8">

          <div className="mb-3 flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />

            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              System Online
            </span>

          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">
            Analyze business datasets, discover insights
            and make data-driven decisions with Bizora AI.
          </p>

        </div>

        {/* DASHBOARD CARDS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <DashboardCard
            title="Total Leads"
            value={leads.length}
            icon="👥"
            description="Businesses registered"
          />

          <DashboardCard
            title="Files Uploaded"
            value={uploadedFiles}
            icon="📁"
            description="Datasets available"
          />

          <DashboardCard
            title="Analysis Ready"
            value={uploadedFiles}
            icon="⚡"
            description="Businesses ready for AI analysis"
          />

        </div>

        {/* LEADS */}

        <section className="mt-10">

          <div className="mb-5 flex items-end justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                Lead Management
              </p>

              <h2 className="mt-1 text-xl font-bold md:text-2xl">
                Business Leads
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Analyze uploaded business datasets.
              </p>

            </div>

            <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
              {leads.length} Leads
            </span>

          </div>

          {loading && <LoadingBox />}

          {!loading && error && (
            <ErrorBox
              message={error}
              onRetry={fetchLeads}
            />
          )}

          {!loading &&
            !error &&
            leads.length === 0 && (
              <EmptyBox />
            )}

          {/* DESKTOP */}

          {!loading &&
            !error &&
            leads.length > 0 && (
              <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 md:block">

                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="border-b border-slate-800 bg-slate-900/80">

                      <tr>

                        <th className="px-5 py-4 text-left text-[11px] uppercase tracking-wider text-slate-500">
                          Business
                        </th>

                        <th className="px-5 py-4 text-left text-[11px] uppercase tracking-wider text-slate-500">
                          Owner
                        </th>

                        <th className="px-5 py-4 text-left text-[11px] uppercase tracking-wider text-slate-500">
                          Type
                        </th>

                        <th className="px-5 py-4 text-left text-[11px] uppercase tracking-wider text-slate-500">
                          Dataset
                        </th>

                        <th className="px-5 py-4 text-right text-[11px] uppercase tracking-wider text-slate-500">
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {leads.map((lead) => (

                        <tr
                          key={lead.id}
                          className="border-b border-slate-800/60 transition hover:bg-slate-800/20"
                        >

                          <td className="px-5 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 font-semibold text-blue-400">
                                {String(
                                  lead.business_name || "B"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <p className="font-semibold">
                                  {lead.business_name}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  #{lead.id} •{" "}
                                  {formatDate(
                                    lead.created_at
                                  )}
                                </p>

                              </div>

                            </div>

                          </td>

                          <td className="px-5 py-5 text-sm">
                            {lead.owner_name}
                          </td>

                          <td className="px-5 py-5">

                            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                              {lead.business_type}
                            </span>

                          </td>

                          <td className="px-5 py-5">

                            {lead.file_name ? (
                              <div>

                                <p className="text-sm text-emerald-400">
                                  ✓ {lead.file_name}
                                </p>

                                <p className="mt-1 text-xs text-slate-600">
                                  Dataset available
                                </p>

                              </div>
                            ) : (
                              <span className="text-sm text-slate-600">
                                No dataset
                              </span>
                            )}

                          </td>

                          <td className="px-5 py-5 text-right">

                            {lead.file_name && (
                              <button
                                onClick={() =>
                                  analyzeLead(lead.id)
                                }
                                disabled={
                                  analyzingId === lead.id
                                }
                                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {analyzingId === lead.id
                                  ? "Analyzing..."
                                  : "Analyze →"}
                              </button>
                            )}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

          {/* MOBILE */}

          {!loading &&
            !error &&
            leads.length > 0 && (
              <div className="space-y-3 md:hidden">

                {leads.map((lead) => (

                  <div
                    key={lead.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 font-semibold text-blue-400">
                          {String(
                            lead.business_name || "B"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>

                          <p className="font-semibold">
                            {lead.business_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            #{lead.id} •{" "}
                            {formatDate(
                              lead.created_at
                            )}
                          </p>

                        </div>

                      </div>

                      <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] text-blue-400">
                        {lead.business_type}
                      </span>

                    </div>

                    <div className="mt-5 space-y-2 text-sm">

                      <p className="text-slate-400">
                        👤 {lead.owner_name}
                      </p>

                      <p className="text-slate-500">
                        📱 {lead.whatsapp}
                      </p>

                      <p className="text-slate-500">
                        ✉️ {lead.email}
                      </p>

                      <p className="text-slate-500">
                        📁{" "}
                        {lead.file_name ||
                          "No dataset uploaded"}
                      </p>

                    </div>

                    {lead.file_name && (
                      <button
                        onClick={() =>
                          analyzeLead(lead.id)
                        }
                        disabled={
                          analyzingId === lead.id
                        }
                        className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                      >
                        {analyzingId === lead.id
                          ? "Analyzing Dataset..."
                          : "Analyze Business →"}
                      </button>
                    )}

                  </div>

                ))}

              </div>
            )}

        </section>

      </main>

      {analysisError && (
        <ErrorModal
          message={analysisError}
          onClose={closeAnalysis}
        />
      )}

      {analysis && (
        <AnalysisModal
          analysis={analysis}
          onClose={closeAnalysis}
        />
      )}

    </div>
  );
}

/* ============================================================
   ANALYSIS MODAL
============================================================ */

function AnalysisModal({ analysis, onClose }) {
  const metrics = analysis.metrics || {};
  const growth = analysis.growth || {};
  const quality = analysis.data_quality || {};
  const pricing = analysis.pricing_intelligence || {};
  const brand = analysis.brand_intelligence || {};
  const rating = analysis.rating_intelligence || {};
  const detected = analysis.detected_columns || {};

  const categories =
    analysis.top_categories || [];

  const products =
    analysis.top_products || [];

  const customer =
    analysis.customer_intelligence || {};

  const topCustomers =
    customer.top_customers || [];

  const monthlySales =
    analysis.monthly_sales || [];

  const insights =
    analysis.insights || [];

  const recommendations =
    analysis.recommendations || [];

  const datasetType =
    getDatasetType(analysis);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-3 backdrop-blur-sm md:p-6">

      <div className="mx-auto max-w-7xl">

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#020617] shadow-2xl">

          {/* HEADER */}

          <div className="sticky top-0 z-20 border-b border-slate-800 bg-[#020617]/95 px-5 py-5 backdrop-blur-xl md:px-7">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                  Bizora AI Analysis
                </p>

                <h2 className="mt-1 text-xl font-bold md:text-2xl">
                  Business Intelligence Report
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  AI-powered analysis of your uploaded dataset
                </p>

              </div>

              <button
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>

            </div>

          </div>

          {/* CONTENT */}

          <div className="space-y-8 p-5 md:p-7">

            {/* DATASET CLASSIFICATION */}

            <section>

              <SectionTitle
                eyebrow="DATASET"
                title="Dataset Classification"
                subtitle="Automatically detected dataset characteristics"
              />

              <div className="grid gap-4 md:grid-cols-3">

                <InfoBlock
                  label="Dataset Type"
                  value={datasetType}
                />

                <InfoBlock
                  label="Rows"
                  value={formatNumber(
                    quality.rows
                  )}
                />

                <InfoBlock
                  label="Columns"
                  value={formatNumber(
                    quality.columns
                  )}
                />

              </div>

            </section>

            {/* SALES */}

            <section>

              <SectionTitle
                eyebrow="SALES"
                title="Sales Intelligence"
                subtitle="Core business performance metrics"
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <MetricCard
                  title="Total Revenue"
                  value={formatCurrency(
                    metrics.total_revenue
                  )}
                  icon="💰"
                />

                <MetricCard
                  title={
                    datasetType ===
                    "Product / Catalog Dataset"
                      ? "Dataset Rows"
                      : "Total Orders"
                  }
                  value={formatNumber(
                    datasetType ===
                    "Product / Catalog Dataset"
                      ? quality.rows
                      : metrics.total_orders
                  )}
                  icon="🧾"
                />

                <MetricCard
                  title="Customers"
                  value={
                    metrics.total_customers != null
                      ? formatNumber(
                          metrics.total_customers
                        )
                      : "N/A"
                  }
                  icon="👥"
                />

                <MetricCard
                  title="Avg Order Value"
                  value={
                    metrics.average_order_value != null
                      ? formatCurrency(
                          metrics.average_order_value
                        )
                      : "N/A"
                  }
                  icon="📊"
                />

              </div>

            </section>

            {/* CUSTOMER ANALYTICS */}

            {customer.available && (
              <section>

                <SectionTitle
                  eyebrow="CUSTOMERS"
                  title="👥 Customer Analytics"
                  subtitle="Understand customer value, retention and purchasing behavior"
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <MetricCard
                    title="Total Customers"
                    value={formatNumber(
                      customer.total_customers
                    )}
                    icon="👥"
                  />

                  <MetricCard
                    title="Repeat Customers"
                    value={formatNumber(
                      customer.repeat_customers
                    )}
                    icon="🔁"
                  />

                  <MetricCard
                    title="Repeat Customer Rate"
                    value={
                      customer.repeat_customer_rate != null
                        ? `${Number(
                            customer.repeat_customer_rate
                          ).toFixed(2)}%`
                        : "N/A"
                    }
                    icon="📈"
                  />

                  <MetricCard
                    title="Avg Customer Revenue"
                    value={formatCurrency(
                      customer.average_customer_revenue
                    )}
                    icon="💰"
                  />

                </div>

                {topCustomers.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-7">

                    <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                      <div>

                        <p className="text-sm font-semibold text-slate-200">
                          🏆 Top Customers
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Customers ranked by revenue contribution
                        </p>

                      </div>

                      <span className="w-fit rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-400">
                        Top{" "}
                        {Math.min(
                          topCustomers.length,
                          10
                        )}
                      </span>

                    </div>

                    <div className="overflow-x-auto">

                      <table className="w-full min-w-175">

                        <thead>

                          <tr className="border-b border-slate-800">

                            <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-slate-500">
                              Rank
                            </th>

                            <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-slate-500">
                              Customer
                            </th>

                            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-slate-500">
                              Revenue
                            </th>

                            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-slate-500">
                              Orders
                            </th>

                            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-slate-500">
                              Quantity
                            </th>

                            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-slate-500">
                              Contribution
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {topCustomers.map(
                            (item, index) => (

                              <tr
                                key={`${item.customer}-${index}`}
                                className="border-b border-slate-800/60 transition hover:bg-slate-800/20"
                              >

                                <td className="px-4 py-4">

                                  <span
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                                      index === 0
                                        ? "bg-yellow-500/10 text-yellow-400"
                                        : index === 1
                                        ? "bg-slate-500/10 text-slate-300"
                                        : index === 2
                                        ? "bg-orange-500/10 text-orange-400"
                                        : "bg-blue-500/10 text-blue-400"
                                    }`}
                                  >
                                    {index + 1}
                                  </span>

                                </td>

                                <td className="px-4 py-4">

                                  <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-semibold text-blue-400">
                                      {String(
                                        item.customer || "C"
                                      )
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>

                                    <p className="max-w-45 truncate text-sm font-medium text-slate-200">
                                      {item.customer ||
                                        "Unknown Customer"}
                                    </p>

                                  </div>

                                </td>

                                <td className="px-4 py-4 text-right">

                                  <span className="font-semibold text-emerald-400">
                                    {formatCurrency(
                                      item.revenue
                                    )}
                                  </span>

                                </td>

                                <td className="px-4 py-4 text-right">

                                  <span className="text-sm text-slate-300">
                                    {formatNumber(
                                      item.orders
                                    )}
                                  </span>

                                </td>

                                <td className="px-4 py-4 text-right">

                                  <span className="text-sm text-slate-300">
                                    {formatNumber(
                                      item.quantity
                                    )}
                                  </span>

                                </td>

                                <td className="px-4 py-4 text-right">

                                  <span className="rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-400">
                                    {Number(
                                      item.contribution_percent ||
                                        0
                                    ).toFixed(2)}
                                    %
                                  </span>

                                </td>

                              </tr>

                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>
                )}

              </section>
            )}

            {/* GROWTH */}

            {growth &&
              Object.keys(growth).length > 0 && (

                <section>

                  <SectionTitle
                    eyebrow="GROWTH"
                    title="Growth Intelligence"
                    subtitle="Revenue movement over time"
                  />

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <MetricCard
                      title="Growth"
                      value={
                        growth.percentage != null
                          ? `${Number(
                              growth.percentage
                            ).toFixed(2)}%`
                          : "N/A"
                      }
                      icon={
                        Number(
                          growth.percentage || 0
                        ) >= 0
                          ? "📈"
                          : "📉"
                      }
                    />

                    <InfoBlock
                      label="Best Month"
                      value={formatMonthValue(
                        growth.best_month
                      )}
                    />

                    <InfoBlock
                      label="Worst Month"
                      value={formatMonthValue(
                        growth.worst_month
                      )}
                    />

                    <InfoBlock
                      label="Revenue Source"
                      value={
                        metrics.revenue_source ||
                        "N/A"
                      }
                    />

                  </div>

                </section>
              )}

            {/* MONTHLY SALES */}

            {monthlySales.length > 0 && (
              <section>

                <SectionTitle
                  eyebrow="MONTHLY"
                  title="Monthly Revenue"
                  subtitle="Revenue trend across months"
                />

                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-7">

                  <div className="flex h-80 min-w-175 items-end gap-4 border-b border-slate-800 px-4 pb-2">

                    {monthlySales.map(
                      (item, index) => {

                        const values =
                          monthlySales.map(
                            (x) =>
                              Number(
                                x.revenue || 0
                              )
                          );

                        const maxValue =
                          Math.max(
                            ...values,
                            1
                          );

                        const barHeight =
                          Math.max(
                            8,
                            (Number(
                              item.revenue || 0
                            ) /
                              maxValue) *
                              250
                          );

                        return (
                          <div
                            key={`${item.month}-${index}`}
                            className="group flex h-full flex-1 flex-col items-center justify-end"
                          >

                            <div className="mb-2 text-[10px] text-slate-500 opacity-0 transition group-hover:opacity-100">
                              {formatCurrency(
                                item.revenue
                              )}
                            </div>

                            <div
                              style={{
                                height: `${barHeight}px`,
                                width: "100%",
                                minWidth: "35px",
                                maxWidth: "70px",
                                background:
                                  "linear-gradient(to top, #2563eb, #3b82f6, #22d3ee)",
                                borderRadius:
                                  "10px 10px 0 0",
                                boxShadow:
                                  "0 0 20px rgba(59,130,246,0.18)",
                              }}
                              className="transition-all duration-300 group-hover:scale-[1.03]"
                            />

                            <p className="mt-3 max-w-20 truncate text-[10px] text-slate-500">
                              {formatMonthValue(
                                item.month
                              )}
                            </p>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

              </section>
            )}

            {/* PRODUCTS */}

            <section>

              <SectionTitle
                eyebrow="PRODUCTS"
                title="Product Intelligence"
                subtitle="Identify your strongest and weakest products"
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <MetricCard
                  title="Dataset Rows"
                  value={formatNumber(
                    quality.rows
                  )}
                  icon="📋"
                />

                <MetricCard
                  title="Unique Products"
                  value={
                    products.length > 0
                      ? formatNumber(
                          products.length
                        )
                      : "N/A"
                  }
                  icon="🛍️"
                />

                <MetricCard
                  title="Total Quantity"
                  value={
                    metrics.total_quantity != null
                      ? formatNumber(
                          metrics.total_quantity
                        )
                      : "N/A"
                  }
                  icon="📦"
                />

                <MetricCard
                  title="AOV"
                  value={
                    metrics.average_order_value != null
                      ? formatCurrency(
                          metrics.average_order_value
                        )
                      : "N/A"
                  }
                  icon="💳"
                />

              </div>

              {products.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-175">

                      <thead className="border-b border-slate-800">

                        <tr>

                          <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                            Rank
                          </th>

                          <th className="px-5 py-4 text-left text-[10px] uppercase tracking-wider text-slate-500">
                            Product
                          </th>

                          <th className="px-5 py-4 text-right text-[10px] uppercase tracking-wider text-slate-500">
                            Revenue
                          </th>

                          <th className="px-5 py-4 text-right text-[10px] uppercase tracking-wider text-slate-500">
                            Quantity
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {products
                          .slice(0, 10)
                          .map(
                            (item, index) => (

                              <tr
                                key={`${item.product}-${index}`}
                                className="border-b border-slate-800/60 hover:bg-slate-800/20"
                              >

                                <td className="px-5 py-4 text-sm text-slate-500">
                                  {index + 1}
                                </td>

                                <td className="px-5 py-4">

                                  <p className="font-medium text-slate-200">
                                    {item.product ||
                                      "Unknown Product"}
                                  </p>

                                </td>

                                <td className="px-5 py-4 text-right font-semibold text-emerald-400">
                                  {formatCurrency(
                                    item.revenue
                                  )}
                                </td>

                                <td className="px-5 py-4 text-right text-slate-300">
                                  {formatNumber(
                                    item.quantity
                                  )}
                                </td>

                              </tr>

                            )
                          )}

                      </tbody>

                    </table>

                  </div>

                </div>
              )}

            </section>

            {/* CATEGORY */}

            {categories.length > 0 && (
              <section>

                <SectionTitle
                  eyebrow="CATEGORIES"
                  title="Category Intelligence"
                  subtitle="Compare category performance"
                />

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                  {categories
                    .slice(0, 6)
                    .map((item, index) => (

                      <div
                        key={`${item.category}-${index}`}
                        className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
                      >

                        <div className="flex items-center justify-between">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                              {index + 1}
                            </div>

                            <div>

                              <p className="font-semibold text-slate-200">
                                {item.category}
                              </p>

                              <p className="text-xs text-slate-500">
                                Category
                              </p>

                            </div>

                          </div>

                          <span className="text-sm font-semibold text-emerald-400">
                            {formatCurrency(
                              item.revenue
                            )}
                          </span>

                        </div>

                      </div>

                    ))}

                </div>

              </section>
            )}

            {/* BRAND + RATING */}

            <section>

              <SectionTitle
                eyebrow="QUALITY"
                title="Brand & Rating Intelligence"
                subtitle="Additional product quality insights"
              />

              <div className="grid gap-5 lg:grid-cols-2">

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">

                  <h3 className="font-semibold">
                    🏷️ Brand Intelligence
                  </h3>

                  {Array.isArray(brand) &&
                  brand.length > 0 ? (

                    <div className="mt-4 space-y-3">

                      {brand
                        .slice(0, 5)
                        .map((item, index) => (

                          <div
                            key={`${item.brand}-${index}`}
                            className="flex items-center justify-between rounded-xl bg-slate-800/40 p-3"
                          >

                            <span className="text-sm text-slate-300">
                              {item.brand}
                            </span>

                            <span className="text-sm font-semibold text-blue-400">
                              {formatCurrency(
                                item.revenue
                              )}
                            </span>

                          </div>

                        ))}

                    </div>

                  ) : (

                    <p className="mt-4 text-sm text-slate-500">
                      Brand information not available.
                    </p>

                  )}

                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">

                  <h3 className="font-semibold">
                    ⭐ Rating Intelligence
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">

                    <SmallMetric
                      label="Highest"
                      value={
                        rating.highest_rating ??
                        "N/A"
                      }
                    />

                    <SmallMetric
                      label="Lowest"
                      value={
                        rating.lowest_rating ??
                        "N/A"
                      }
                    />

                  </div>

                </div>

              </div>

            </section>

            {/* PRICING */}

            <section>

              <SectionTitle
                eyebrow="PRICING"
                title="Pricing Intelligence"
                subtitle="Understand your product pricing"
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <SmallMetric
                  label="Average Price"
                  value={formatCurrency(
                    pricing.average_price
                  )}
                />

                <SmallMetric
                  label="Minimum Price"
                  value={formatCurrency(
                    pricing.minimum_price
                  )}
                />

                <SmallMetric
                  label="Maximum Price"
                  value={formatCurrency(
                    pricing.maximum_price
                  )}
                />

                <SmallMetric
                  label="Price Range"
                  value={formatCurrency(
                    pricing.price_range
                  )}
                />

              </div>

            </section>

            {/* DATASET HEALTH */}

            <section>

              <SectionTitle
                eyebrow="HEALTH"
                title="Dataset Health"
                subtitle="Data quality and detected structure"
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <MetricCard
                  title="Rows"
                  value={formatNumber(
                    quality.rows
                  )}
                  icon="📋"
                />

                <MetricCard
                  title="Columns"
                  value={formatNumber(
                    quality.columns
                  )}
                  icon="↔️"
                />

                <MetricCard
                  title="Missing Values"
                  value={
                    quality.missing_values != null
                      ? formatNumber(
                          quality.missing_values
                        )
                      : "N/A"
                  }
                  icon="⚠️"
                />

                <MetricCard
                  title="Duplicate Rows"
                  value={
                    quality.duplicate_rows != null
                      ? formatNumber(
                          quality.duplicate_rows
                        )
                      : "N/A"
                  }
                  icon="♻️"
                />

              </div>

            </section>

            {/* AI INSIGHTS */}

            {insights.length > 0 && (
              <section>

                <SectionTitle
                  eyebrow="AI"
                  title="AI Insights"
                  subtitle="Key findings generated from your business data"
                />

                <div className="grid gap-4 md:grid-cols-2">

                  {insights.map(
                    (insight, index) => (

                      <div
                        key={index}
                        className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5"
                      >

                        <div className="flex gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                            💡
                          </div>

                          <p className="text-sm leading-6 text-slate-300">

                            {typeof insight === "string"
                              ? insight
                              : insight.text ||
                                insight.message ||
                                JSON.stringify(
                                  insight
                                )}

                          </p>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </section>
            )}

            {/* RECOMMENDATIONS */}

            {recommendations.length > 0 && (
              <section>

                <SectionTitle
                  eyebrow="ACTION"
                  title="Recommendations"
                  subtitle="Practical actions based on your dataset"
                />

                <div className="space-y-3">

                  {recommendations.map(
                    (recommendation, index) => (

                      <div
                        key={index}
                        className="flex gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"
                      >

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                          {index + 1}
                        </div>

                        <p className="text-sm leading-6 text-slate-300">

                          {typeof recommendation ===
                          "string"
                            ? recommendation
                            : recommendation.text ||
                              recommendation.message ||
                              JSON.stringify(
                                recommendation
                              )}

                        </p>

                      </div>

                    )
                  )}

                </div>

              </section>
            )}

            {/* DETECTED COLUMNS */}

            <section>

              <SectionTitle
                eyebrow="STRUCTURE"
                title="Detected Fields"
                subtitle="Columns automatically identified by Bizora AI"
              />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                {Object.entries(detected).map(
                  ([key, value]) => (

                    <div
                      key={key}
                      className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                    >

                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        {key.replace(
                          /_/g,
                          " "
                        )}
                      </p>

                      <p className="mt-2 text-sm font-medium text-slate-200">
                        {value || "Not detected"}
                      </p>

                    </div>

                  )
                )}

              </div>

            </section>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}) {
  return (
    <div className="mb-5">

      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
        {eyebrow}
      </p>

      <h3 className="mt-1 text-xl font-bold md:text-2xl">
        {title}
      </h3>

      {subtitle && (
        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
        </p>
      )}

    </div>
  );
}

function DashboardCard({
  title,
  value,
  icon,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-slate-700">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {formatNumber(value)}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {description}
          </p>

        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-wider text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold text-slate-100">
            {value}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
          {icon}
        </div>

      </div>

    </div>
  );
}

function SmallMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-800/40 p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold">
        {value}
      </p>

    </div>
  );
}

function InfoBlock({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">

      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-200">
        {value || "N/A"}
      </p>

    </div>
  );
}

function LoadingBox() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center">

      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

      <p className="mt-4 text-sm text-slate-500">
        Loading leads...
      </p>

    </div>
  );
}

function EmptyBox() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center">

      <div className="text-3xl">
        📂
      </div>

      <p className="mt-3 font-semibold">
        No leads found
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Business leads will appear here after submission.
      </p>

    </div>
  );
}

function ErrorBox({
  message,
  onRetry,
}) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">

      <p className="font-semibold text-red-400">
        Something went wrong
      </p>

      <p className="mt-1 text-sm text-slate-400">
        {message}
      </p>

      <button
        onClick={onRetry}
        className="mt-4 rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
      >
        Try Again
      </button>

    </div>
  );
}

function ErrorModal({
  message,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">

      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#020617] p-6 shadow-2xl">

        <div className="flex items-start justify-between">

          <div>

            <p className="text-lg font-bold text-red-400">
              Analysis Failed
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {message}
            </p>

          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white"
          >
            ✕
          </button>

        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold hover:bg-slate-700"
        >
          Close
        </button>

      </div>

    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "N/A";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

function formatMonthValue(value) {
  if (!value) {
    return "N/A";
  }

  /* Backend can return:
     { month: "2026-05", revenue: 45250 }
  */

  if (typeof value === "object") {
    const month = value.month;

    if (!month) {
      return "N/A";
    }

    const formattedMonth =
      formatMonthValue(month);

    if (
      value.revenue !== undefined &&
      value.revenue !== null
    ) {
      return `${formattedMonth} • ${formatCurrency(
        value.revenue
      )}`;
    }

    return formattedMonth;
  }

  const text = String(value);

  if (/^\d{4}-\d{2}$/.test(text)) {
    const [year, month] =
      text.split("-");

    const date = new Date(
      Number(year),
      Number(month) - 1,
      1
    );

    return date.toLocaleDateString(
      "en-IN",
      {
        month: "short",
        year: "numeric",
      }
    );
  }

  return text;
}

function getDatasetType(analysis) {
  if (analysis.dataset_type) {
    return analysis.dataset_type;
  }

  if (analysis.classification) {
    return analysis.classification;
  }

  const metrics =
    analysis.metrics || {};

  if (
    metrics.revenue_source ||
    metrics.total_revenue
  ) {
    return "Sales Dataset";
  }

  return "Business Dataset";
}

export default Admin;