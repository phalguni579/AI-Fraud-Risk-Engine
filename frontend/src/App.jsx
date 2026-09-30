import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  Gauge,
  LayoutDashboard,
  Menu,
  Radar,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
  Zap,
  UserRound,
} from "lucide-react";

import {
  getHealth,
  getMonitoringHealth,
  getModelPerformance,
  getRiskDistribution,
  getAuditLogs,
} from "./services/api";

import TransactionInvestigator from "./components/TransactionInvestigator";
import CustomerDashboard from "./components/CustomerDashboard";
import ModelMonitoring from "./components/ModelMonitoring";

import "./styles/app.css";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Customer Dashboard", icon: UserRound },
  { label: "Transactions", icon: CircleDollarSign },
  { label: "Risk Intelligence", icon: Radar },
  { label: "AI Agent", icon: Bot },
  { label: "Model Monitoring", icon: Activity },
];

const defaultStats = {
  transactions: 12842,
  highRisk: 184,
  blocked: 67,
  avgRisk: 31.8,
};

const defaultRiskDistribution = {
  low: 72.4,
  medium: 21.8,
  high: 5.8,
};

const defaultPerformance = {
  precision: 38.53,
  recall: 45.43,
  f1: 41.70,
  prAuc: 96.1,
  drift: 0.04,
};

function toPercentage(value, fallback = 0) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return numeric >= 0 && numeric <= 1
    ? numeric * 100
    : numeric;
}

function normalizeRiskDistribution(distributionData) {
  const low = Number(distributionData?.low ?? distributionData?.LOW ?? 0);
  const medium = Number(distributionData?.medium ?? distributionData?.MEDIUM ?? 0);
  const high = Number(distributionData?.high ?? distributionData?.HIGH ?? 0);

  const values = [low, medium, high].map((value) =>
    Number.isFinite(value) && value >= 0 ? value : 0
  );

  const total = values.reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return { low: 0, medium: 0, high: 0 };
  }

  // Some monitoring responses return percentages; others return counts.
  // If the values do not already form a percentage distribution, convert
  // the counts into percentages using their combined total.
  const normalized = Math.abs(total - 100) <= 0.5
    ? values
    : total <= 1.0001
      ? values.map((value) => value * 100)
      : values.map((value) => (value / total) * 100);

  return {
    low: Number(normalized[0].toFixed(1)),
    medium: Number(normalized[1].toFixed(1)),
    high: Number(normalized[2].toFixed(1)),
  };
}

function extractRecords(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const candidates = [
    response.records,
    response.audit_logs,
    response.items,
    response.logs,
    response.events,
    response.results,
    response.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

const alerts = [
  {
    level: "high",
    title: "High-risk transaction blocked",
    meta: "TXN-94821 · ₹18,500",
    time: "2 min ago",
  },
  {
    level: "medium",
    title: "Unusual device detected",
    meta: "TXN-94818 · Customer C-1042",
    time: "7 min ago",
  },
  {
    level: "medium",
    title: "Velocity rule triggered",
    meta: "TXN-94811 · 6 transactions / hour",
    time: "14 min ago",
  },
  {
    level: "low",
    title: "Model monitoring check completed",
    meta: "Fraud model · healthy",
    time: "21 min ago",
  },
];

function MetricCard({
  label,
  value,
  change,
  period,
  icon: Icon,
  negative = false,
}) {
  return (
    <div className="glass-card kpi-card">
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>

        <div className="kpi-icon">
          <Icon />
        </div>
      </div>

      <div className="kpi-value">{value}</div>

      <div className="kpi-footer">
        <span className={`kpi-change ${negative ? "negative" : ""}`}>
          {negative ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
          {change}
        </span>

        <span className="kpi-period">{period}</span>
      </div>
    </div>
  );
}

function RiskLegend({ name, value, type }) {
  const widths = {
    low: value,
    medium: value * 2.7,
    high: value * 10,
  };

  return (
    <div>
      <div className="legend-item">
        <div className="legend-left">
          <span className={`legend-dot risk-${type}`} />
          <span className="legend-name">{name}</span>
        </div>

        <span className="legend-value">{value}%</span>
      </div>

      <div className="legend-bar">
        <span
          className={`risk-bar-${type}`}
          style={{
            width: `${Math.min(widths[type], 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

function Signal({ icon: Icon, name, value }) {
  return (
    <div className="signal-row">
      <div className="signal-left">
        <div className="signal-icon">
          <Icon />
        </div>

        <span className="signal-name">{name}</span>
      </div>

      <span className="signal-value">{value}</span>
    </div>
  );
}

function PerformanceMetric({ label, value }) {
  const numericValue = Number(value) || 0;

  return (
    <div className="performance-item">
      <div className="performance-label">{label}</div>

      <div className="performance-value">{numericValue.toFixed(1)}%</div>

      <div className="performance-progress">
        <span style={{ width: `${Math.min(numericValue, 100)}%` }} />
      </div>
    </div>
  );
}

function AlertRow({ level, title, meta, time }) {
  const Icon =
    level === "high"
      ? XCircle
      : level === "medium"
        ? AlertTriangle
        : CheckCircle2;

  return (
    <div className="alert-row">
      <div className={`alert-icon ${level}`}>
        <Icon />
      </div>

      <div className="alert-content">
        <div className="alert-title">{title}</div>
        <div className="alert-meta">{meta}</div>
      </div>

      <span className="alert-time">{time}</span>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Overview");

  const [stats, setStats] = useState(defaultStats);

  const [riskDistribution, setRiskDistribution] = useState(
    defaultRiskDistribution
  );

  const [performance, setPerformance] = useState(defaultPerformance);

  const [backendStatus, setBackendStatus] = useState("checking");
  const [refreshing, setRefreshing] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState(alerts);

  async function loadDashboardData() {
    setRefreshing(true);

    try {
      const [
        health,
        monitoring,
        distribution,
        modelPerformance,
        auditLogs,
      ] = await Promise.allSettled([
        getHealth(),
        getMonitoringHealth(),
        getRiskDistribution(),
        getModelPerformance(),
        getAuditLogs(),
      ]);

      if (health.status === "fulfilled") {
        setBackendStatus("online");
      } else {
        setBackendStatus("offline");
      }

      if (monitoring.status === "fulfilled") {
        const data = monitoring.value;

        if (data?.total_predictions !== undefined) {
          setStats((current) => ({
            ...current,
            transactions: Number(data.total_predictions) || 0,
          }));
        }
      }

      if (distribution.status === "fulfilled") {
        const data = distribution.value;

        const distributionData =
          data?.distribution ||
          data?.risk_distribution ||
          data;

        if (distributionData) {
          setRiskDistribution(
            normalizeRiskDistribution(distributionData)
          );
        }
      }

      if (modelPerformance.status === "fulfilled") {
        const data = modelPerformance.value;
        const metrics = data?.metrics || data;

        if (metrics) {
          setPerformance((current) => ({
            precision: toPercentage(
              metrics.precision ?? current.precision,
              current.precision
            ),

            recall: toPercentage(
              metrics.recall ?? current.recall,
              current.recall
            ),

            f1: toPercentage(
              metrics.f1 ??
                metrics.f1_score ??
                current.f1,
              current.f1
            ),

            prAuc: toPercentage(
              metrics.pr_auc ??
                metrics.prAUC ??
                metrics.prauc ??
                current.prAuc,
              current.prAuc
            ),

            drift: Number(
              metrics.drift ?? current.drift
            ),
          }));
        }
      }

      /*
       * Audit data powers the operational dashboard.
       * The backend can return a list directly or wrap it in
       * records/audit_logs/items.
       */
      if (auditLogs.status === "fulfilled") {
        const response = auditLogs.value;

        const records = extractRecords(response);

        const normalized = records
          .map((item, index) => {
            const result =
              item?.decision_result ||
              item?.result ||
              item?.data ||
              item;

            const transaction =
              result?.transaction ||
              item?.transaction ||
              {};

            const prediction =
              result?.prediction ||
              item?.prediction ||
              {};

            const risk =
              result?.risk ||
              item?.risk ||
              {};

            const decision = String(
              result?.final_decision ||
                result?.decision ||
                risk?.decision ||
                prediction?.decision ||
                item?.final_decision ||
                item?.decision ||
                "UNKNOWN"
            ).toUpperCase();

            const probability = Number(
              prediction?.fraud_probability ??
                result?.fraud_probability ??
                item?.fraud_probability ??
                0
            );

            const riskLevel = String(
              risk?.risk_level ||
                result?.risk_level ||
                (probability >= 0.7
                  ? "HIGH"
                  : probability >= 0.3
                    ? "MEDIUM"
                    : "LOW")
            ).toUpperCase();

            return {
              id:
                result?.transaction_id ||
                item?.transaction_id ||
                item?.id ||
                `TXN-${index + 1}`,

              amount: Number(
                transaction?.amount ??
                  item?.amount ??
                  0
              ),

              probability,
              riskLevel,
              decision,

              timestamp:
                item?.created_at ||
                item?.timestamp ||
                result?.timestamp ||
                result?.audit?.timestamp ||
                null,

              customer:
                result?.customer_id ||
                item?.customer_id ||
                transaction?.customer_id ||
                "CUST-UNKNOWN",
            };
          })
          .filter((item) => item.id);

        if (normalized.length > 0) {
          const highRiskCount = normalized.filter(
            (item) =>
              item.riskLevel === "HIGH" ||
              item.probability >= 0.7
          ).length;

          const blockedCount = normalized.filter(
            (item) => item.decision === "BLOCK"
          ).length;

          const averageRisk =
            normalized.reduce(
              (sum, item) => sum + item.probability,
              0
            ) / normalized.length;

          setStats((current) => ({
            ...current,
            transactions:
              current.transactions ||
              normalized.length,
            highRisk: highRiskCount,
            blocked: blockedCount,
            avgRisk: Number(
              (averageRisk * 100).toFixed(1)
            ),
          }));

          const generatedAlerts = normalized
            .slice()
            .sort((a, b) => {
              const aTime = a.timestamp
                ? new Date(a.timestamp).getTime()
                : 0;

              const bTime = b.timestamp
                ? new Date(b.timestamp).getTime()
                : 0;

              return bTime - aTime;
            })
            .slice(0, 5)
            .map((item) => {
              const level =
                item.decision === "BLOCK" ||
                item.riskLevel === "HIGH"
                  ? "high"
                  : item.decision === "REVIEW" ||
                      item.riskLevel === "MEDIUM"
                    ? "medium"
                    : "low";

              const title =
                item.decision === "BLOCK"
                  ? "High-risk transaction blocked"
                  : item.decision === "REVIEW"
                    ? "Transaction sent for review"
                    : "Low-risk transaction approved";

              const meta = `TXN-${String(item.id).slice(0, 8)} · ${
                item.amount > 0
                  ? `₹${item.amount.toLocaleString("en-IN")}`
                  : item.customer
              }`;

              let time = "Recent";

              if (item.timestamp) {
                const date = new Date(item.timestamp);

                if (!Number.isNaN(date.getTime())) {
                  time = date.toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }
              }

              return {
                level,
                title,
                meta,
                time,
              };
            });

          if (generatedAlerts.length > 0) {
            setLiveAlerts(generatedAlerts);
          }
        }
      }
    } catch (error) {
      console.error("Dashboard refresh failed:", error);
      setBackendStatus("offline");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  function renderPage() {
    if (activePage === "Customer Dashboard") {
      return <CustomerDashboard />;
    }

    if (activePage === "Transactions") {
      return <TransactionInvestigator />;
    }

    if (activePage === "Model Monitoring") {
      return <ModelMonitoring />;
    }

    if (activePage === "Risk Intelligence") {
      return <RiskIntelligence />;
    }

    if (activePage === "AI Agent") {
      return <AIAgentPage />;
    }

    return (
      <>
        <div className="dashboard-intro">
          <div className="intro-title">
            <h2>Fraud & Risk Command Center</h2>

            <p>
              Real-time fraud intelligence, explainable decisions and
              agentic risk investigation.
            </p>
          </div>

          <div
            className="live-indicator"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <span className="status-dot" />
            Decision engine active
          </div>
        </div>

        <div className="kpi-grid">
          <MetricCard
            label="Transactions analyzed"
            value={stats.transactions.toLocaleString()}
            change="Live"
            period="from model monitor"
            icon={Database}
          />

          <MetricCard
            label="High-risk transactions"
            value={stats.highRisk}
            change="Active"
            period="risk queue"
            icon={ShieldAlert}
            negative
          />

          <MetricCard
            label="Transactions blocked"
            value={stats.blocked}
            change="Tracked"
            period="decision engine"
            icon={XCircle}
          />

          <MetricCard
            label="Average risk score"
            value={`${stats.avgRisk}%`}
            change="Live"
            period="current portfolio"
            icon={Gauge}
          />
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-column">
            <div className="glass-card risk-overview">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    Risk distribution
                  </div>

                  <div className="card-subtitle">
                    Current transaction portfolio
                  </div>
                </div>

                <button className="card-action">
                  View analytics
                </button>
              </div>

              <div className="risk-content">
                <div className="risk-chart">
                  <div className="risk-ring">
                    <div className="risk-ring-center">
                      <div className="risk-ring-value">
                        {stats.avgRisk}%
                      </div>

                      <div className="risk-ring-label">
                        Avg risk
                      </div>
                    </div>
                  </div>
                </div>

                <div className="risk-legend">
                  <RiskLegend
                    name="Low risk"
                    value={riskDistribution.low}
                    type="low"
                  />

                  <RiskLegend
                    name="Medium risk"
                    value={riskDistribution.medium}
                    type="medium"
                  />

                  <RiskLegend
                    name="High risk"
                    value={riskDistribution.high}
                    type="high"
                  />
                </div>
              </div>
            </div>

            <div className="glass-card performance-card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    Fraud model performance
                  </div>

                  <div className="card-subtitle">
                    Production model health indicators
                  </div>
                </div>

                <span className="badge badge-success">
                  <CheckCircle2 size={9} />
                  Healthy
                </span>
              </div>

              <div className="performance-grid">
                <PerformanceMetric
                  label="Precision"
                  value={performance.precision}
                />

                <PerformanceMetric
                  label="Recall"
                  value={performance.recall}
                />

                <PerformanceMetric
                  label="F1 Score"
                  value={performance.f1}
                />

                <PerformanceMetric
                  label="PR-AUC"
                  value={performance.prAuc}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "15px 18px 0",
                }}
              >
                <Activity size={12} color="#7c5cff" />

                <span
                  style={{
                    color: "#69768a",
                    fontSize: "9px",
                  }}
                >
                  Current model drift
                </span>

                <strong
                  style={{
                    marginLeft: "auto",
                    color:
                      performance.drift > 0.1
                        ? "#ff7180"
                        : "#54d8a6",
                    fontSize: "10px",
                  }}
                >
                  {performance.drift}
                </strong>
              </div>
            </div>
          </div>

          <div className="dashboard-column">
            <div className="glass-card ai-decision-card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    Latest AI decision
                  </div>

                  <div className="card-subtitle">
                    Agentic transaction investigation
                  </div>
                </div>

                <Sparkles size={15} color="#9d8cff" />
              </div>

              <div className="ai-decision-body">
                <div
                  className="decision-banner"
                  style={{
                    border:
                      "1px solid rgba(124,92,255,0.12)",
                    background:
                      "linear-gradient(135deg, rgba(124,92,255,0.07), rgba(54,211,153,0.025))",
                  }}
                >
                  <div>
                    <div className="decision-label">
                      Latest policy outcome
                    </div>

                    <div className="decision-status">
                      REVIEW
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        color: "#68758a",
                        fontSize: "8px",
                      }}
                    >
                      Combined ML + rules + policy decision
                    </div>
                  </div>

                  <div className="risk-score">
                    <div className="risk-score-value">
                      68.4%
                    </div>

                    <div className="risk-score-label">
                      Fraud probability
                    </div>
                  </div>
                </div>

                <div className="signal-list">
                  <Signal
                    icon={ShieldAlert}
                    name="New device"
                    value="Detected"
                  />

                  <Signal
                    icon={Zap}
                    name="Unusual location"
                    value="120 km"
                  />

                  <Signal
                    icon={Clock3}
                    name="Transaction time"
                    value="02:14 AM"
                  />

                  <Signal
                    icon={Activity}
                    name="Velocity signal"
                    value="4 / hour"
                  />
                </div>
              </div>
            </div>

            <div className="glass-card alerts-card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    Recent risk alerts
                  </div>

                  <div className="card-subtitle">
                    Latest signals requiring attention
                  </div>
                </div>

                <button className="card-action">
                  View all
                </button>
              </div>

              <div className="alert-list">
                {liveAlerts.map((alert, index) => (
                  <AlertRow
                    key={index}
                    level={alert.level}
                    title={alert.title}
                    meta={alert.meta}
                    time={alert.time}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              display: "grid",
              placeItems: "center",
              borderRadius: "8px",
              background: "rgba(124,92,255,0.08)",
            }}
          >
            <BrainCircuit size={15} color="#9d8cff" />
          </div>

          <div>
            <div
              style={{
                color: "#dfe5ed",
                fontSize: "10px",
                fontWeight: 750,
              }}
            >
              Decision intelligence online
            </div>

            <div
              style={{
                marginTop: "3px",
                color: "#69768a",
                fontSize: "8px",
              }}
            >
              ML scoring · business rules · explainability · agentic investigation
            </div>
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#54d8a6",
              fontSize: "8px",
              fontWeight: 750,
            }}
          >
            <CheckCircle2 size={11} />
            All systems operational
          </div>
        </div>

        <div className="insight-banner">
          <div className="insight-icon">
            <BrainCircuit />
          </div>

          <div className="insight-content">
            <div className="insight-title">
              AI investigation engine is ready
            </div>

            <div className="insight-text">
              The agent can combine model predictions, fraud
              rules, customer context and transaction history to
              produce an explainable risk decision.
            </div>
          </div>

          <button
            className="insight-action"
            onClick={() => setActivePage("Transactions")}
          >
            Investigate transaction
            <ChevronRight />
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={21} />
          </div>

          <div className="brand-text">
            <div className="brand-title">
              Risk Intelligence
            </div>

            <div className="brand-subtitle">
              AI Decision Engine
            </div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">Workspace</div>

          <div className="nav-list">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  className={`nav-item ${
                    activePage === item.label ? "active" : ""
                  }`}
                  onClick={() => setActivePage(item.label)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="system-status">
            <div className="system-status-top">
              <span className="system-status-label">
                System status
              </span>

              <span className="status-online">
                <span className="status-dot" />

                {backendStatus === "online"
                  ? "Online"
                  : backendStatus === "checking"
                    ? "Checking"
                    : "Offline"}
              </span>
            </div>

            <div className="system-status-bar">
              <span />
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="page-heading">
            <Menu size={17} className="mobile-menu-icon" />

            <h1>{activePage}</h1>

            <span>Live</span>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" title="Search">
              <Search />
            </button>

            <button
              className="icon-button"
              title="Refresh dashboard"
              onClick={loadDashboardData}
            >
              <RefreshCw
                className={
                  refreshing ? "spin-animation" : ""
                }
              />
            </button>

            <button
              className="icon-button"
              title="Notifications"
            >
              <Bell />
            </button>

            <div className="user-profile">
              <div className="avatar">PR</div>

              <div className="user-info">
                <span className="user-name">
                  Risk Analyst
                </span>

                <span className="user-role">
                  Decision Science
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          {renderPage()}
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   RISK INTELLIGENCE PAGE
   ========================================================= */

function RiskIntelligence() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div className="dashboard-intro">
        <div className="intro-title">
          <h2>Risk Intelligence</h2>

          <p>
            Understand why transactions are being classified as
            risky.
          </p>
        </div>
      </div>

      <div
        className="dashboard-grid"
        style={{
          gridTemplateColumns:
            "minmax(0, 1.2fr) minmax(300px, 0.8fr)",
        }}
      >
        <div className="glass-card" style={{ padding: "20px" }}>
          <div className="card-title">
            Risk signal analysis
          </div>

          <div className="card-subtitle">
            Primary features contributing to fraud risk
          </div>

          <RiskSignal
            name="New device"
            value="High"
            width={82}
          />

          <RiskSignal
            name="Merchant risk"
            value="High"
            width={74}
          />

          <RiskSignal
            name="Transaction velocity"
            value="Medium"
            width={61}
          />

          <RiskSignal
            name="Distance from home"
            value="Medium"
            width={48}
          />

          <RiskSignal
            name="Failed attempts"
            value="Medium"
            width={42}
          />
        </div>

        <div className="glass-card" style={{ padding: "20px" }}>
          <div className="card-title">
            Decision policy
          </div>

          <div className="card-subtitle">
            Current risk thresholds
          </div>

          <PolicyRow
            label="Approve"
            threshold="< 30%"
            type="success"
          />

          <PolicyRow
            label="Review"
            threshold="30% – 70%"
            type="warning"
          />

          <PolicyRow
            label="Block"
            threshold="> 70%"
            type="danger"
          />
        </div>
      </div>
    </div>
  );
}

function RiskSignal({ name, value, width }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "7px",
        }}
      >
        <span
          style={{
            color: "#8a95a8",
            fontSize: "9px",
          }}
        >
          {name}
        </span>

        <span
          style={{
            color: "#dfe5ed",
            fontSize: "9px",
            fontWeight: 700,
          }}
        >
          {value}
        </span>
      </div>

      <div
        style={{
          height: "5px",
          overflow: "hidden",
          borderRadius: "99px",
          background: "rgba(255,255,255,0.05)",
        }}
      >
        <span
          style={{
            display: "block",
            width: `${width}%`,
            height: "100%",
            borderRadius: "inherit",
            background:
              "linear-gradient(90deg, #7c5cff, #36d399)",
          }}
        />
      </div>
    </div>
  );
}

function PolicyRow({ label, threshold, type }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "14px",
        padding: "12px",
        border:
          "1px solid rgba(255,255,255,0.045)",
        borderRadius: "9px",
        background: "rgba(255,255,255,0.018)",
      }}
    >
      <span className={`badge badge-${type}`}>
        {label}
      </span>

      <span
        style={{
          color: "#8994a7",
          fontSize: "9px",
        }}
      >
        {threshold}
      </span>
    </div>
  );
}

/* =========================================================
   AI AGENT PAGE
   ========================================================= */

function AIAgentPage() {
  const steps = [
    {
      number: "01",
      step: "Transaction context loaded",
      tool: "context_loader",
      detail: "Transaction amount, device, location and velocity signals collected.",
    },
    {
      number: "02",
      step: "Customer profile retrieved",
      tool: "get_customer_profile",
      detail: "Customer identity and available account context checked.",
    },
    {
      number: "03",
      step: "Fraud model executed",
      tool: "run_fraud_model",
      detail: "XGBoost model generated a fraud probability and model decision.",
    },
    {
      number: "04",
      step: "Fraud rules evaluated",
      tool: "evaluate_fraud_rules",
      detail: "Business rules checked amount, device, velocity and international signals.",
    },
    {
      number: "05",
      step: "Risk signals aggregated",
      tool: "get_risk_signals",
      detail: "Independent risk indicators were combined into an investigation context.",
    },
    {
      number: "06",
      step: "Decision policy applied",
      tool: "risk_policy",
      detail: "Configured thresholds converted the evidence into a final action.",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div className="dashboard-intro">
        <div className="intro-title">
          <h2>AI Agent</h2>

          <p>
            Agentic investigation workflow and decision trace.
          </p>
        </div>

        <div className="live-indicator">
          Agent ready
        </div>
      </div>

      <div
        className="glass-card"
        style={{ padding: "20px" }}
      >
        <div
          className="card-header"
          style={{ padding: 0 }}
        >
          <div>
            <div className="card-title">
              Agent decision trace
            </div>

            <div className="card-subtitle">
              Explainable sequence of tools used to reach a risk decision
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#54d8a6",
              fontSize: "9px",
              fontWeight: 750,
            }}
          >
            <CheckCircle2 size={11} />
            6 steps completed
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "20px",
          }}
        >
          {steps.map((item, index) => (
            <div
              key={item.number}
              style={{
                display: "grid",
                gridTemplateColumns: "34px 1fr auto",
                gap: "12px",
                position: "relative",
                paddingBottom:
                  index === steps.length - 1
                    ? "0"
                    : "10px",
              }}
            >
              {index !== steps.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "31px",
                    bottom: "0",
                    width: "1px",
                    background:
                      "linear-gradient(180deg, rgba(124,92,255,0.35), rgba(255,255,255,0.04))",
                  }}
                />
              )}

              <div
                style={{
                  width: "32px",
                  height: "32px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "9px",
                  background:
                    "linear-gradient(135deg, rgba(124,92,255,0.16), rgba(124,92,255,0.05))",
                  border:
                    "1px solid rgba(124,92,255,0.18)",
                  color: "#a18fff",
                  fontSize: "8px",
                  fontWeight: 850,
                  zIndex: 1,
                }}
              >
                {item.number}
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  border:
                    "1px solid rgba(255,255,255,0.045)",
                  borderRadius: "10px",
                  background:
                    "rgba(255,255,255,0.018)",
                  marginBottom:
                    index === steps.length - 1
                      ? "0"
                      : "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      color: "#e4eaf1",
                      fontSize: "10px",
                      fontWeight: 750,
                    }}
                  >
                    {item.step}
                  </div>

                  <span
                    style={{
                      padding: "3px 6px",
                      borderRadius: "5px",
                      background:
                        "rgba(124,92,255,0.07)",
                      color: "#8f80df",
                      fontSize: "7px",
                      fontWeight: 700,
                    }}
                  >
                    {item.tool}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    color: "#69768a",
                    fontSize: "8px",
                    lineHeight: 1.55,
                  }}
                >
                  {item.detail}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "9px",
                }}
              >
                <CheckCircle2
                  size={13}
                  color="#54d8a6"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="dashboard-grid"
        style={{
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(300px, 0.7fr)",
        }}
      >
        <div
          className="glass-card"
          style={{ padding: "20px" }}
        >
          <div className="card-title">
            Investigation architecture
          </div>

          <div className="card-subtitle">
            Multi-layer reasoning pipeline
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "9px",
              marginTop: "18px",
            }}
          >
            {[
              {
                title: "ML Layer",
                value: "Fraud probability",
                icon: BrainCircuit,
              },
              {
                title: "Rule Layer",
                value: "Business controls",
                icon: ShieldAlert,
              },
              {
                title: "Policy Layer",
                value: "Final decision",
                icon: ShieldCheck,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  style={{
                    padding: "13px",
                    border:
                      "1px solid rgba(255,255,255,0.045)",
                    borderRadius: "10px",
                    background:
                      "rgba(255,255,255,0.018)",
                  }}
                >
                  <Icon
                    size={14}
                    color="#9d8cff"
                  />

                  <div
                    style={{
                      marginTop: "9px",
                      color: "#dfe5ed",
                      fontSize: "9px",
                      fontWeight: 750,
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      color: "#69768a",
                      fontSize: "8px",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="glass-card"
          style={{ padding: "20px" }}
        >
          <div className="card-title">
            Agent status
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "18px",
              padding: "14px",
              border:
                "1px solid rgba(54,211,153,0.12)",
              borderRadius: "11px",
              background:
                "rgba(54,211,153,0.035)",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                display: "grid",
                placeItems: "center",
                borderRadius: "9px",
                background:
                  "rgba(54,211,153,0.08)",
              }}
            >
              <Bot
                size={18}
                color="#54d8a6"
              />
            </div>

            <div>
              <div
                style={{
                  color: "#e4eaf1",
                  fontSize: "10px",
                  fontWeight: 750,
                }}
              >
                Investigation agent online
              </div>

              <div
                style={{
                  marginTop: "4px",
                  color: "#657186",
                  fontSize: "8px",
                }}
              >
                Deterministic investigation tools ready.
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 11px",
              border:
                "1px solid rgba(255,255,255,0.04)",
              borderRadius: "8px",
              background:
                "rgba(255,255,255,0.015)",
            }}
          >
            <span
              style={{
                color: "#69768a",
                fontSize: "8px",
              }}
            >
              Tools available
            </span>

            <strong
              style={{
                color: "#dfe5ed",
                fontSize: "9px",
              }}
            >
              6
            </strong>
          </div>

          <div
            style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 11px",
              border:
                "1px solid rgba(255,255,255,0.04)",
              borderRadius: "8px",
              background:
                "rgba(255,255,255,0.015)",
            }}
          >
            <span
              style={{
                color: "#69768a",
                fontSize: "8px",
              }}
            >
              Explainability
            </span>

            <strong
              style={{
                color: "#54d8a6",
                fontSize: "9px",
              }}
            >
              Enabled
            </strong>
          </div>

          <div
            style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 11px",
              border:
                "1px solid rgba(255,255,255,0.04)",
              borderRadius: "8px",
              background:
                "rgba(255,255,255,0.015)",
            }}
          >
            <span
              style={{
                color: "#69768a",
                fontSize: "8px",
              }}
            >
              Decision audit
            </span>

            <strong
              style={{
                color: "#54d8a6",
                fontSize: "9px",
              }}
            >
              Enabled
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;