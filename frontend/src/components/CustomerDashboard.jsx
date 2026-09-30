import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Globe,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  getRiskDecision,
  getCustomerTransactions,
} from "../services/api";

const CUSTOMER_ID = "C-1042";

const INITIAL_TRANSACTION = {
  customer_id: CUSTOMER_ID,
  amount: 17000,
  hour: new Date().getHours(),
  distance_from_home: 5,
  failed_attempts: 0,
  account_age_days: 365,
  merchant_risk: 0.8,
  transactions_24h: 4,
  transactions_1h: 1,
  average_transaction_amount: 2500,
  international_transaction: 1,
  new_device: 1,
  device_age_days: 1,
};

function normalizeDecision(value) {
  return String(value || "UNKNOWN").toUpperCase();
}

function getDecisionClass(decision) {
  const normalized = normalizeDecision(decision);

  if (normalized === "BLOCK") {
    return "danger";
  }

  if (normalized === "REVIEW") {
    return "warning";
  }

  if (
    normalized === "APPROVE" ||
    normalized === "APPROVED"
  ) {
    return "success";
  }

  return "neutral";
}

function getRiskLevel(probability, risk) {
  if (risk?.risk_level) {
    return String(risk.risk_level).toUpperCase();
  }

  const value = Number(probability || 0);

  if (value >= 0.7) {
    return "HIGH";
  }

  if (value >= 0.3) {
    return "MEDIUM";
  }

  return "LOW";
}

function DecisionBadge({ decision }) {
  const normalized = normalizeDecision(decision);
  const type = getDecisionClass(normalized);

  return (
    <span className={`customer-decision-badge ${type}`}>
      {normalized === "BLOCK" ? (
        <XCircle size={12} />
      ) : normalized === "REVIEW" ? (
        <AlertTriangle size={12} />
      ) : normalized === "APPROVE" ? (
        <CheckCircle2 size={12} />
      ) : (
        <Activity size={12} />
      )}

      {normalized}
    </span>
  );
}

function RiskBadge({ level }) {
  const normalized = String(level || "UNKNOWN").toUpperCase();

  const type =
    normalized === "HIGH"
      ? "danger"
      : normalized === "MEDIUM"
        ? "warning"
        : normalized === "LOW"
          ? "success"
          : "neutral";

  return (
    <span className={`customer-risk-badge ${type}`}>
      {normalized}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "17px",
        minHeight: "108px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            color: "#758196",
            fontSize: "9px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {label}
        </div>

        <div
          style={{
            width: "30px",
            height: "30px",
            display: "grid",
            placeItems: "center",
            borderRadius: "9px",
            background: "rgba(124,92,255,0.09)",
            color: "#9d8cff",
          }}
        >
          <Icon size={15} />
        </div>
      </div>

      <div
        style={{
          marginTop: "13px",
          color: "#edf1f7",
          fontSize: "20px",
          fontWeight: 800,
        }}
      >
        {value}
      </div>

      {subtitle && (
        <div
          style={{
            marginTop: "4px",
            color: "#68758a",
            fontSize: "8px",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

function TransactionDetail({
  transaction,
  onClose,
}) {
  if (!transaction) {
    return null;
  }

  const probability = Number(
    transaction.probability || 0
  );

  return (
    <div
      className="glass-card"
      style={{
        marginTop: "14px",
        padding: "18px",
        border:
          "1px solid rgba(124,92,255,0.16)",
        background:
          "linear-gradient(145deg, rgba(124,92,255,0.055), rgba(255,255,255,0.015))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              color: "#edf1f7",
              fontSize: "13px",
              fontWeight: 800,
            }}
          >
            Transaction Details
          </div>

          <div
            style={{
              marginTop: "4px",
              color: "#6f7c91",
              fontSize: "8px",
            }}
          >
            {transaction.id}
          </div>
        </div>

        <button
          className="insight-action"
          onClick={onClose}
          style={{
            padding: "7px 10px",
          }}
        >
          Close
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(145px, 1fr))",
          gap: "9px",
          marginTop: "16px",
        }}
      >
        <MetricCard
          icon={CreditCard}
          label="Amount"
          value={`₹${Number(
            transaction.amount || 0
          ).toLocaleString("en-IN")}`}
        />

        <MetricCard
          icon={Activity}
          label="Fraud Probability"
          value={`${(
            probability * 100
          ).toFixed(2)}%`}
        />

        <MetricCard
          icon={ShieldAlert}
          label="Risk"
          value={
            <RiskBadge
              level={transaction.riskLevel}
            />
          }
        />

        <MetricCard
          icon={ShieldCheck}
          label="Decision"
          value={
            <DecisionBadge
              decision={transaction.decision}
            />
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "9px",
          marginTop: "12px",
        }}
      >
        <div className="customer-detail-box">
          <span>Transaction ID</span>
          <strong>{transaction.id}</strong>
        </div>

        <div className="customer-detail-box">
          <span>Customer ID</span>
          <strong>
            {transaction.customer}
          </strong>
        </div>

        <div className="customer-detail-box">
          <span>Transaction Type</span>
          <strong>
            {transaction.international
              ? "International"
              : "Domestic"}
          </strong>
        </div>

        <div className="customer-detail-box">
          <span>Device</span>
          <strong>
            {transaction.newDevice
              ? "New device"
              : "Known device"}
          </strong>
        </div>
      </div>

      {transaction.rules?.length > 0 && (
        <div
          style={{
            marginTop: "13px",
            padding: "13px",
            borderRadius: "10px",
            background:
              "rgba(255,255,255,0.018)",
            border:
              "1px solid rgba(255,255,255,0.045)",
          }}
        >
          <div
            style={{
              color: "#a18fff",
              fontSize: "9px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Risk Rules Triggered
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "9px",
            }}
          >
            {transaction.rules.map(
              (rule, index) => (
                <div
                  key={`${rule.id || rule.name || "rule"}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "7px",
                    color: "#9ba7b9",
                    fontSize: "9px",
                    lineHeight: 1.5,
                  }}
                >
                  <AlertTriangle
                    size={11}
                    style={{
                      marginTop: "2px",
                      color: "#f2c46d",
                      flexShrink: 0,
                    }}
                  />

                  <span>
                    {rule.name ||
                      rule.reason ||
                      String(rule)}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerDashboard() {
  const [transaction, setTransaction] =
    useState(INITIAL_TRANSACTION);

  const [result, setResult] = useState(null);

  const [transactions, setTransactions] =
    useState([]);

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [historyLoading, setHistoryLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [expanded, setExpanded] =
    useState(false);

  async function loadTransactionHistory() {
    setHistoryLoading(true);

    try {
      const response =
        await getCustomerTransactions(
          CUSTOMER_ID
        );

      const records = Array.isArray(response)
        ? response
        : response?.transactions ||
          response?.records ||
          response?.items ||
          [];

      const normalized = records
        .map((item, index) => {
          const prediction =
            item?.prediction || {};

          const risk =
            item?.risk || {};

          const rawTransaction =
            item?.transaction ||
            item?.transaction_data ||
            {};

          const probability = Number(
            prediction?.fraud_probability ??
              item?.fraud_probability ??
              0
          );

          /*
           * IMPORTANT:
           * The backend history service stores the final
           * decision directly as item.decision.
           *
           * We now check item.decision BEFORE falling back
           * to older response structures.
           */

          const decision =
            item?.decision ||
            item?.final_decision ||
            item?.policy_result?.final_decision ||
            risk?.decision ||
            prediction?.decision ||
            "UNKNOWN";

          return {
            id:
              item?.transaction_id ||
              item?.id ||
              `TXN-${index + 1}`,

            customer:
              item?.customer_id ||
              CUSTOMER_ID,

            amount: Number(
              rawTransaction?.amount ??
                item?.amount ??
                0
            ),

            probability,

            riskLevel:
              getRiskLevel(
                probability,
                risk
              ),

            decision:
              normalizeDecision(decision),

            time:
              item?.created_at ||
              item?.recorded_at ||
              item?.timestamp ||
              null,

            international:
              Boolean(
                rawTransaction
                  ?.international_transaction ??
                  item?.international_transaction
              ),

            newDevice: Boolean(
              rawTransaction?.new_device ??
                item?.new_device
            ),

            rules:
              item?.rules?.rules_triggered ||
              item?.rules_triggered ||
              [],
          };
        })
        .filter(
          (item) => item.id
        );

      setTransactions(normalized);
    } catch (historyError) {
      console.error(
        "Customer transaction history failed:",
        historyError
      );

      setTransactions([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadTransactionHistory();
  }, []);

  function updateField(
    field,
    value
  ) {
    setTransaction((current) => ({
      ...current,
      [field]: Number(value),
    }));
  }

  function toggleField(field) {
    setTransaction((current) => ({
      ...current,
      [field]: current[field] ? 0 : 1,
    }));
  }

  async function handlePayment() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response =
        await getRiskDecision({
          ...transaction,
          customer_id:
            CUSTOMER_ID,
        });

      setResult(response);

      await loadTransactionHistory();
    } catch (paymentError) {
      console.error(
        "Payment risk decision failed:",
        paymentError
      );

      setError(
        paymentError?.message ||
          "Unable to process the payment."
      );
    } finally {
      setLoading(false);
    }
  }

  const resultPrediction =
    result?.prediction || {};

  const resultRisk =
    result?.risk || {};

  const resultPolicy =
    result?.policy_result || {};

  const finalDecision = normalizeDecision(
    resultPolicy?.final_decision ||
      result?.final_decision ||
      resultRisk?.decision ||
      resultPrediction?.decision ||
      "REVIEW"
  );

  const fraudProbability = Number(
    resultPrediction?.fraud_probability || 0
  );

  const resultRiskLevel =
    resultRisk?.risk_level ||
    getRiskLevel(
      fraudProbability,
      resultRisk
    );

  const totalTransactions =
    transactions.length;

  const blockedTransactions =
    transactions.filter(
      (item) =>
        item.decision === "BLOCK"
    ).length;

  const reviewTransactions =
    transactions.filter(
      (item) =>
        item.decision === "REVIEW"
    ).length;

  const totalSpend = useMemo(
    () =>
      transactions.reduce(
        (total, item) =>
          total +
          Number(item.amount || 0),
        0
      ),
    [transactions]
  );

  function formatTime(value) {
    if (!value) {
      return "Just now";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* =====================================================
          CUSTOMER HEADER
          ===================================================== */}

      <div
        className="glass-card"
        style={{
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "18px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "13px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              display: "grid",
              placeItems: "center",
              borderRadius: "15px",
              background:
                "linear-gradient(135deg, rgba(124,92,255,0.2), rgba(124,92,255,0.07))",
              border:
                "1px solid rgba(124,92,255,0.2)",
              color: "#a594ff",
            }}
          >
            <UserRound size={23} />
          </div>

          <div>
            <div
              style={{
                color: "#f0f3f8",
                fontSize: "21px",
                fontWeight: 800,
              }}
            >
              Welcome back, Customer
            </div>

            <div
              style={{
                marginTop: "5px",
                color: "#758196",
                fontSize: "10px",
              }}
            >
              Customer ID: {CUSTOMER_ID}
            </div>
          </div>
        </div>

        <div
          style={{
            minWidth: "190px",
            padding: "13px 16px",
            borderRadius: "12px",
            background:
              "rgba(255,255,255,0.025)",
            border:
              "1px solid rgba(255,255,255,0.055)",
          }}
        >
          <div
            style={{
              color: "#788499",
              fontSize: "9px",
              fontWeight: 700,
            }}
          >
            Available Balance
          </div>

          <div
            style={{
              marginTop: "3px",
              color: "#edf1f7",
              fontSize: "24px",
              fontWeight: 850,
            }}
          >
            ₹84,500
          </div>
        </div>
      </div>

      {/* =====================================================
          CUSTOMER METRICS
          ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "10px",
        }}
      >
        <MetricCard
          icon={Activity}
          label="Transactions"
          value={totalTransactions}
          subtitle="Processed through risk engine"
        />

        <MetricCard
          icon={Wallet}
          label="Total Activity"
          value={`₹${totalSpend.toLocaleString(
            "en-IN"
          )}`}
          subtitle="Transaction volume"
        />

        <MetricCard
          icon={ShieldAlert}
          label="Blocked"
          value={blockedTransactions}
          subtitle="High-risk transactions"
        />

        <MetricCard
          icon={AlertTriangle}
          label="Under Review"
          value={reviewTransactions}
          subtitle="Additional verification"
        />
      </div>

      {/* =====================================================
          PAYMENT + RESULT
          ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.15fr) minmax(0, 0.85fr)",
          gap: "14px",
        }}
      >
        {/* PAYMENT */}

        <div
          className="glass-card"
          style={{
            padding: "20px",
          }}
        >
          <div className="card-header" style={{ padding: 0 }}>
            <div>
              <div className="card-title">
                Make a Payment
              </div>

              <div className="card-subtitle">
                Your payment will be automatically
                checked by the AI fraud-risk engine.
              </div>
            </div>

            <CreditCard
              size={17}
              color="#9d8cff"
            />
          </div>

          <div
            style={{
              marginTop: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                color: "#8a95a7",
                fontSize: "9px",
                fontWeight: 700,
                marginBottom: "7px",
              }}
            >
              Payment Amount
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: "48px",
                padding: "0 13px",
                borderRadius: "10px",
                background:
                  "rgba(255,255,255,0.025)",
                border:
                  "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                style={{
                  color: "#8b96a9",
                  fontSize: "14px",
                }}
              >
                ₹
              </span>

              <input
                type="number"
                value={transaction.amount}
                onChange={(event) =>
                  updateField(
                    "amount",
                    event.target.value
                  )
                }
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "#edf1f7",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "13px",
            }}
          >
            <label
              style={{
                display: "block",
                color: "#8a95a7",
                fontSize: "9px",
                fontWeight: 700,
                marginBottom: "7px",
              }}
            >
              Merchant
            </label>

            <div
              style={{
                position: "relative",
              }}
            >
              <select
                value={
                  transaction.merchant_name ||
                  "International Store"
                }
                onChange={(event) =>
                  setTransaction(
                    (current) => ({
                      ...current,
                      merchant_name:
                        event.target.value,
                    })
                  )
                }
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 35px 0 13px",
                  borderRadius: "10px",
                  border:
                    "1px solid rgba(255,255,255,0.06)",
                  background:
                    "#1b1e27",
                  color: "#e4e9f1",
                  outline: "none",
                  fontSize: "11px",
                  appearance: "none",
                }}
              >
                <option>
                  International Store
                </option>
                <option>
                  Online Marketplace
                </option>
                <option>
                  Local Grocery
                </option>
                <option>
                  Travel Booking
                </option>
                <option>
                  Electronics Store
                </option>
              </select>

              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "17px",
                  pointerEvents: "none",
                  color: "#738095",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "9px",
              marginTop: "13px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                toggleField(
                  "international_transaction"
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px",
                borderRadius: "10px",
                border:
                  transaction.international_transaction
                    ? "1px solid rgba(124,92,255,0.25)"
                    : "1px solid rgba(255,255,255,0.055)",
                background:
                  transaction.international_transaction
                    ? "rgba(124,92,255,0.08)"
                    : "rgba(255,255,255,0.018)",
                color: "#d7deea",
                fontSize: "9px",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Globe size={14} />

              International payment
            </button>

            <button
              type="button"
              onClick={() =>
                toggleField("new_device")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px",
                borderRadius: "10px",
                border:
                  transaction.new_device
                    ? "1px solid rgba(124,92,255,0.25)"
                    : "1px solid rgba(255,255,255,0.055)",
                background:
                  transaction.new_device
                    ? "rgba(124,92,255,0.08)"
                    : "rgba(255,255,255,0.018)",
                color: "#d7deea",
                fontSize: "9px",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Smartphone size={14} />

              New device
            </button>
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                marginTop: "12px",
                padding: "10px",
                borderRadius: "9px",
                border:
                  "1px solid rgba(255,92,112,0.16)",
                background:
                  "rgba(255,92,112,0.045)",
                color: "#ff7180",
                fontSize: "9px",
                lineHeight: 1.5,
              }}
            >
              <AlertTriangle size={13} />
              {error}
            </div>
          )}

          <button
            className="insight-action"
            onClick={handlePayment}
            disabled={loading}
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "14px",
              minHeight: "45px",
            }}
          >
            {loading ? (
              <Loader2 className="spin-animation" />
            ) : (
              <ShieldCheck size={15} />
            )}

            {loading
              ? "Analyzing Transaction..."
              : "Pay Securely"}
          </button>
        </div>

        {/* RESULT */}

        <div
          className="glass-card"
          style={{
            padding: "20px",
          }}
        >
          <div className="card-header" style={{ padding: 0 }}>
            <div>
              <div className="card-title">
                Transaction Result
              </div>

              <div className="card-subtitle">
                Real-time decision from the risk engine
              </div>
            </div>

            {result && (
              <RiskBadge
                level={resultRiskLevel}
              />
            )}
          </div>

          {!result ? (
            <div
              style={{
                minHeight: "255px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#68758a",
                gap: "9px",
              }}
            >
              <ShieldCheck
                size={29}
                color="#7664d9"
              />

              <div
                style={{
                  color: "#dce3ed",
                  fontSize: "11px",
                  fontWeight: 750,
                }}
              >
                Ready for secure payment
              </div>

              <div
                style={{
                  maxWidth: "240px",
                  fontSize: "8px",
                  lineHeight: 1.6,
                }}
              >
                Submit a payment and the fraud
                decision engine will evaluate it
                using ML, business rules and risk
                policy.
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  marginTop: "16px",
                  padding: "19px",
                  borderRadius: "13px",
                  textAlign: "center",
                  background:
                    finalDecision === "BLOCK"
                      ? "rgba(255,92,112,0.045)"
                      : finalDecision === "REVIEW"
                        ? "rgba(242,196,109,0.045)"
                        : "rgba(84,216,166,0.045)",
                  border:
                    finalDecision === "BLOCK"
                      ? "1px solid rgba(255,92,112,0.14)"
                      : finalDecision === "REVIEW"
                        ? "1px solid rgba(242,196,109,0.14)"
                        : "1px solid rgba(84,216,166,0.14)",
                }}
              >
                <div
                  style={{
                    color: "#7d889a",
                    fontSize: "8px",
                    fontWeight: 750,
                  }}
                >
                  FINAL DECISION
                </div>

                <div
                  style={{
                    marginTop: "7px",
                    color:
                      finalDecision === "BLOCK"
                        ? "#ff7180"
                        : finalDecision === "REVIEW"
                          ? "#f2c46d"
                          : "#54d8a6",
                    fontSize: "28px",
                    fontWeight: 850,
                  }}
                >
                  {finalDecision}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "9px",
                  marginTop: "12px",
                }}
              >
                <div className="customer-result-box">
                  <span>
                    Model Decision
                  </span>

                  <strong>
                    {normalizeDecision(
                      resultPrediction?.decision
                    )}
                  </strong>
                </div>

                <div className="customer-result-box">
                  <span>
                    Fraud Probability
                  </span>

                  <strong>
                    {(
                      fraudProbability * 100
                    ).toFixed(2)}
                    %
                  </strong>
                </div>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  padding: "11px 12px",
                  borderRadius: "9px",
                  background:
                    finalDecision === "BLOCK"
                      ? "rgba(255,92,112,0.055)"
                      : finalDecision === "REVIEW"
                        ? "rgba(242,196,109,0.055)"
                        : "rgba(84,216,166,0.055)",
                  color:
                    finalDecision === "BLOCK"
                      ? "#d98a94"
                      : finalDecision === "REVIEW"
                        ? "#d4b77b"
                        : "#78cba9",
                  fontSize: "9px",
                  lineHeight: 1.55,
                }}
              >
                {finalDecision === "BLOCK"
                  ? "This payment was blocked because the transaction was classified as high risk."
                  : finalDecision === "REVIEW"
                    ? "This payment has been held for additional risk review."
                    : "This payment has been approved by the risk decision engine."}
              </div>

              <div
                style={{
                  marginTop: "12px",
                  color: "#657187",
                  fontSize: "8px",
                }}
              >
                Transaction ID:{" "}
                <span
                  style={{
                    color: "#a1abbb",
                  }}
                >
                  {result.transaction_id}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =====================================================
          TRANSACTION HISTORY
          ===================================================== */}

      <div
        className="glass-card"
        style={{
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div>
            <div className="card-title">
              Transaction History
            </div>

            <div className="card-subtitle">
              Your latest payment activity
            </div>
          </div>

          <button
            className="insight-action"
            onClick={
              loadTransactionHistory
            }
            disabled={historyLoading}
            style={{
              padding: "8px 11px",
            }}
          >
            <RefreshCw
              size={13}
              className={
                historyLoading
                  ? "spin-animation"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {historyLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "45px",
              color: "#748096",
              fontSize: "10px",
            }}
          >
            <Loader2
              size={17}
              className="spin-animation"
            />
          </div>
        ) : transactions.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "9px",
              padding: "45px 20px",
              color: "#748096",
            }}
          >
            <Wallet size={24} />

            <div
              style={{
                color: "#dce3ec",
                fontSize: "11px",
                fontWeight: 750,
              }}
            >
              No transactions yet
            </div>

            <div
              style={{
                fontSize: "8px",
              }}
            >
              Your processed payments will
              appear here.
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                overflowX: "auto",
                marginTop: "17px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "760px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Transaction",
                      "Amount",
                      "Risk",
                      "Decision",
                      "Time",
                      "",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding:
                            "9px 10px",
                          textAlign: "left",
                          color: "#69758a",
                          fontSize: "8px",
                          fontWeight: 750,
                          textTransform:
                            "uppercase",
                          letterSpacing:
                            "0.06em",
                          borderBottom:
                            "1px solid rgba(255,255,255,0.055)",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {transactions
                    .slice(
                      0,
                      expanded
                        ? transactions.length
                        : 5
                    )
                    .map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setSelectedTransaction(
                            item
                          )
                        }
                      >
                        <td
                          style={{
                            padding:
                              "13px 10px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                          }}
                        >
                          <div
                            style={{
                              color:
                                "#e6ebf3",
                              fontSize: "9px",
                              fontWeight: 750,
                            }}
                          >
                            {item.id}
                          </div>

                          <div
                            style={{
                              marginTop: "4px",
                              color:
                                "#68758a",
                              fontSize: "8px",
                            }}
                          >
                            {item.customer}
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "13px 10px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                            color:
                              "#e8edf5",
                            fontSize: "10px",
                            fontWeight: 750,
                          }}
                        >
                          ₹
                          {Number(
                            item.amount || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "13px 10px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                          }}
                        >
                          <RiskBadge
                            level={
                              item.riskLevel
                            }
                          />
                        </td>

                        <td
                          style={{
                            padding:
                              "13px 10px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                          }}
                        >
                          <DecisionBadge
                            decision={
                              item.decision
                            }
                          />
                        </td>

                        <td
                          style={{
                            padding:
                              "13px 10px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "5px",
                              color:
                                "#778397",
                              fontSize:
                                "8px",
                            }}
                          >
                            <Clock3
                              size={10}
                            />

                            {formatTime(
                              item.time
                            )}
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "13px 10px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                          }}
                        >
                          <span
                            style={{
                              color:
                                "#9b8cff",
                              fontSize:
                                "8px",
                              fontWeight:
                                700,
                            }}
                          >
                            View
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {transactions.length > 5 && (
              <button
                className="insight-action"
                onClick={() =>
                  setExpanded(
                    (current) =>
                      !current
                  )
                }
                style={{
                  marginTop: "13px",
                  width: "100%",
                  justifyContent:
                    "center",
                }}
              >
                {expanded
                  ? "Show Less"
                  : `View All ${transactions.length} Transactions`}
              </button>
            )}
          </>
        )}

        <TransactionDetail
          transaction={
            selectedTransaction
          }
          onClose={() =>
            setSelectedTransaction(
              null
            )
          }
        />
      </div>

      {/* =====================================================
          CUSTOMER SECURITY FOOTER
          ===================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          padding: "7px",
          color: "#59667b",
          fontSize: "8px",
        }}
      >
        <ShieldCheck size={11} />

        Protected by AI Fraud & Agentic Risk
        Decision Engine
      </div>
    </div>
  );
}