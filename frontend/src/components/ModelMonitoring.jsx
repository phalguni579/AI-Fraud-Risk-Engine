import { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Gauge,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import {
  getMonitoringHealth,
  getModelPerformance,
  getRiskDistribution,
} from "../services/api";

function Metric({ label, value, icon: Icon, status }) {
  return (
    <div className="glass-card" style={{ padding: "17px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="kpi-label">{label}</span>

        <div className="kpi-icon">
          <Icon />
        </div>
      </div>

      <div
        style={{
          marginTop: "14px",
          color: "#f4f7fb",
          fontSize: "23px",
          fontWeight: 780,
        }}
      >
        {value}
      </div>

      {status && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            marginTop: "7px",
            color:
              status === "healthy"
                ? "#54d8a6"
                : "#ff7180",
            fontSize: "8px",
            fontWeight: 750,
            textTransform: "uppercase",
          }}
        >
          {status === "healthy" ? (
            <CheckCircle2 size={10} />
          ) : (
            <AlertTriangle size={10} />
          )}

          {status}
        </div>
      )}
    </div>
  );
}

export default function ModelMonitoring() {
  const [health, setHealth] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMonitoring() {
    setLoading(true);

    try {
      const [
        healthResponse,
        performanceResponse,
        distributionResponse,
      ] = await Promise.allSettled([
        getMonitoringHealth(),
        getModelPerformance(),
        getRiskDistribution(),
      ]);

      if (healthResponse.status === "fulfilled") {
        setHealth(healthResponse.value);
      }

      if (performanceResponse.status === "fulfilled") {
        setPerformance(performanceResponse.value);
      }

      if (distributionResponse.status === "fulfilled") {
        setDistribution(distributionResponse.value);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonitoring();
  }, []);

  // ============================================
  // MODEL PERFORMANCE
  // ============================================

  const metrics = performance?.metrics || {};

  const precision = Number(
    metrics.precision ?? 0
  );

  const recall = Number(
    metrics.recall ?? 0
  );

  const f1 = Number(
    metrics.f1 ??
      metrics.f1_score ??
      0
  );

  const rocAuc = Number(
    metrics.roc_auc ??
      metrics.rocAUC ??
      0
  );

  // ============================================
  // MODEL HEALTH
  // ============================================

  const statistics =
    health?.statistics || {};

  const totalPredictions = Number(
    statistics.total_predictions ?? 0
  );

  const averageFraudProbability = Number(
    statistics.average_fraud_probability ?? 0
  );

  const highRiskRate = Number(
    statistics.high_risk_rate ?? 0
  );

  const healthStatus =
    health?.status || "waiting_for_predictions";

  // ============================================
  // RISK DISTRIBUTION
  // Backend returns COUNTS, not percentages.
  // ============================================

  const distributionData =
    distribution?.distribution ||
    distribution?.risk_distribution ||
    distribution ||
    {};

  const lowCount = Number(
    distributionData.low ??
      distributionData.LOW ??
      0
  );

  const mediumCount = Number(
    distributionData.medium ??
      distributionData.MEDIUM ??
      0
  );

  const highCount = Number(
    distributionData.high ??
      distributionData.HIGH ??
      0
  );

  const totalRisk =
    lowCount +
    mediumCount +
    highCount;

  const low =
    totalRisk > 0
      ? (lowCount / totalRisk) * 100
      : 0;

  const medium =
    totalRisk > 0
      ? (mediumCount / totalRisk) * 100
      : 0;

  const high =
    totalRisk > 0
      ? (highCount / totalRisk) * 100
      : 0;

  // ============================================
  // DRIFT
  // ============================================

  const drift = Number(
    health?.drift ??
      performance?.drift ??
      0
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* Header */}

      <div className="dashboard-intro">
        <div className="intro-title">
          <h2>Model Monitoring</h2>

          <p>
            Monitor fraud model performance, drift
            and risk distribution.
          </p>
        </div>

        <button
          className="insight-action"
          onClick={loadMonitoring}
          disabled={loading}
        >
          <RefreshCw
            className={
              loading
                ? "spin-animation"
                : ""
            }
          />

          {loading
            ? "Refreshing..."
            : "Refresh monitoring"}
        </button>
      </div>

      {/* Metrics */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "13px",
        }}
      >
        <Metric
          label="Precision"
          value={`${(
            precision * 100
          ).toFixed(1)}%`}
          icon={TargetIcon}
          status="healthy"
        />

        <Metric
          label="Recall"
          value={`${(
            recall * 100
          ).toFixed(1)}%`}
          icon={TrendingUp}
          status="healthy"
        />

        <Metric
          label="F1 Score"
          value={`${(
            f1 * 100
          ).toFixed(1)}%`}
          icon={Gauge}
          status="healthy"
        />

        <Metric
          label="ROC-AUC"
          value={`${(
            rocAuc * 100
          ).toFixed(1)}%`}
          icon={Activity}
          status="healthy"
        />
      </div>

      {/* Monitoring grid */}

      <div
        className="dashboard-grid"
        style={{
          gridTemplateColumns:
            "minmax(0, 1.2fr) minmax(300px, 0.8fr)",
        }}
      >
        {/* Model health */}

        <div
          className="glass-card"
          style={{ padding: "20px" }}
        >
          <div className="card-title">
            Production model health
          </div>

          <div className="card-subtitle">
            Current operational state of the
            fraud model
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "22px",
              padding: "16px",
              border:
                "1px solid rgba(54,211,153,0.13)",
              borderRadius: "12px",
              background:
                "rgba(54,211,153,0.035)",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                display: "grid",
                placeItems: "center",
                borderRadius: "10px",
                background:
                  "rgba(54,211,153,0.09)",
                color: "#54d8a6",
              }}
            >
              <ShieldCheck size={19} />
            </div>

            <div>
              <div
                style={{
                  color: "#e4eaf2",
                  fontSize: "12px",
                  fontWeight: 750,
                }}
              >
                {healthStatus === "healthy"
                  ? "Model operating normally"
                  : "Waiting for predictions"}
              </div>

              <div
                style={{
                  marginTop: "4px",
                  color: "#68758a",
                  fontSize: "9px",
                }}
              >
                {healthStatus === "healthy"
                  ? "No critical health signal detected."
                  : "Run a transaction to populate monitoring data."}
              </div>
            </div>

            <span
              className="badge badge-success"
              style={{ marginLeft: "auto" }}
            >
              {healthStatus === "healthy"
                ? "Healthy"
                : "Waiting"}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            <SmallStat
              icon={Database}
              label="Predictions processed"
              value={totalPredictions.toLocaleString()}
            />

            <SmallStat
              icon={Activity}
              label="Average fraud probability"
              value={`${(
                averageFraudProbability * 100
              ).toFixed(1)}%`}
            />
          </div>
        </div>

        {/* Risk distribution */}

        <div
          className="glass-card"
          style={{ padding: "20px" }}
        >
          <div className="card-title">
            Risk distribution
          </div>

          <div className="card-subtitle">
            Model decision portfolio
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              marginTop: "22px",
            }}
          >
            <DistributionBar
              label={`Low risk (${lowCount})`}
              value={low}
              className="risk-bar-low"
            />

            <DistributionBar
              label={`Medium risk (${mediumCount})`}
              value={medium}
              className="risk-bar-medium"
            />

            <DistributionBar
              label={`High risk (${highCount})`}
              value={high}
              className="risk-bar-high"
            />
          </div>
        </div>
      </div>

      {/* Model health checks */}

      <div
        className="glass-card"
        style={{ padding: "20px" }}
      >
        <div className="card-title">
          Monitoring checks
        </div>

        <div className="card-subtitle">
          Automated controls used by the decision
          engine
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "10px",
            marginTop: "18px",
          }}
        >
          <HealthCheck
            title="Prediction pipeline"
            description="Model inference available"
          />

          <HealthCheck
            title="Risk distribution"
            description="Decision distribution monitored"
          />

          <HealthCheck
            title="Drift monitoring"
            description={
              highRiskRate > 0.1
                ? "Elevated high-risk rate detected"
                : "Prediction behaviour monitored"
            }
          />
        </div>
      </div>
    </div>
  );
}

function SmallStat({
  icon: Icon,
  label,
  value,
  warning = false,
}) {
  return (
    <div
      style={{
        padding: "13px",
        border:
          "1px solid rgba(255,255,255,0.045)",
        borderRadius: "10px",
        background:
          "rgba(255,255,255,0.018)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          color: "#68758a",
          fontSize: "8px",
        }}
      >
        <Icon size={11} />

        {label}
      </div>

      <div
        style={{
          marginTop: "8px",
          color: warning
            ? "#ff7180"
            : "#e8edf4",
          fontSize: "17px",
          fontWeight: 780,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DistributionBar({
  label,
  value,
  className,
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "7px",
        }}
      >
        <span
          style={{
            color: "#8793a7",
            fontSize: "9px",
          }}
        >
          {label}
        </span>

        <strong
          style={{
            color: "#e6ebf2",
            fontSize: "9px",
          }}
        >
          {value.toFixed(1)}%
        </strong>
      </div>

      <div
        style={{
          height: "6px",
          overflow: "hidden",
          borderRadius: "99px",
          background:
            "rgba(255,255,255,0.05)",
        }}
      >
        <span
          className={className}
          style={{
            display: "block",
            width: `${Math.min(
              value,
              100
            )}%`,
            height: "100%",
            borderRadius: "inherit",
          }}
        />
      </div>
    </div>
  );
}

function HealthCheck({
  title,
  description,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "13px",
        border:
          "1px solid rgba(255,255,255,0.045)",
        borderRadius: "10px",
        background:
          "rgba(255,255,255,0.018)",
      }}
    >
      <CheckCircle2
        size={15}
        color="#54d8a6"
      />

      <div>
        <div
          style={{
            color: "#dfe5ed",
            fontSize: "9px",
            fontWeight: 700,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "3px",
            color: "#626f83",
            fontSize: "8px",
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

function TargetIcon(props) {
  return <TrendingUp {...props} />;
}