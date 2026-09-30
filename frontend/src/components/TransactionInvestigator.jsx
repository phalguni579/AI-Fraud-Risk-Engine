import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Globe,
  Loader2,
  MapPin,
  ShieldAlert,
  Smartphone,
  Sparkles,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";

import {
  getRiskDecision,
  investigateTransaction,
  aiInvestigateTransaction,
} from "../services/api";

const initialTransaction = {
  transaction_id: `TXN-${Date.now()}`,
  customer_id: "C-1042",
  amount: 18500,
  hour: 2,
  distance_from_home: 120,
  failed_attempts: 3,
  account_age_days: 180,
  merchant_risk: 0.85,
  transactions_24h: 12,
  transactions_1h: 4,
  average_transaction_amount: 2500,
  international_transaction: 1,
  new_device: 1,
  device_age_days: 2,
};

function SignalCard({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "11px",
        border: "1px solid rgba(255,255,255,0.045)",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.018)",
      }}
    >
      <div
        style={{
          width: "27px",
          height: "27px",
          display: "grid",
          placeItems: "center",
          borderRadius: "8px",
          background: "rgba(124,92,255,0.08)",
          color: "#9d8cff",
        }}
      >
        <Icon size={13} />
      </div>

      <div>
        <div
          style={{
            color: "#667388",
            fontSize: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: "3px",
            color: "#e5eaf2",
            fontSize: "10px",
            fontWeight: 700,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function ResultBadge({ decision }) {
  const normalized = String(decision || "").toUpperCase();

  const isBlock =
    normalized === "BLOCK" || normalized === "FRAUD";

  const isReview =
    normalized === "REVIEW" || normalized === "MEDIUM";

  return (
    <span
      className={`badge ${
        isBlock
          ? "badge-danger"
          : isReview
            ? "badge-warning"
            : "badge-success"
      }`}
    >
      {isBlock ? (
        <XCircle size={10} />
      ) : isReview ? (
        <AlertTriangle size={10} />
      ) : (
        <CheckCircle2 size={10} />
      )}

      {normalized || "UNKNOWN"}
    </span>
  );
}

export default function TransactionInvestigator() {
  const [transaction, setTransaction] =
    useState(initialTransaction);

  const [result, setResult] = useState(null);
  const [agentResult, setAgentResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [error, setError] = useState("");

  function updateField(field, value) {
    setTransaction((current) => ({
      ...current,
      [field]: Number(value),
    }));
  }

  async function runRiskDecision() {
    setLoading(true);
    setError("");

    try {
      const response = await getRiskDecision(transaction);
      setResult(response);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the fraud decision engine."
      );
    } finally {
      setLoading(false);
    }
  }

  async function runAgentInvestigation() {
    setAgentLoading(true);
    setError("");

    try {
      const response =
        await investigateTransaction(transaction);

      console.log(
        "Agent investigation response:",
        response
      );

      setAgentResult(response);
    } catch (err) {
      console.error(
        "Agent investigation error:",
        err
      );

      setError(
        err.message ||
          "Unable to run the investigation agent."
      );
    } finally {
      setAgentLoading(false);
    }
  }

  async function runAIInvestigation() {
    setAiLoading(true);
    setError("");

    try {
      const response =
        await aiInvestigateTransaction(transaction);

      console.log(
        "AI investigation response:",
        response
      );

      setAiResult(response);
    } catch (err) {
      console.error(
        "AI investigation error:",
        err
      );

      setError(
        err.message ||
          "Unable to run the AI investigation."
      );
    } finally {
      setAiLoading(false);
    }
  }

  const prediction = result?.prediction;
  const risk = result?.risk;
  const explanation = result?.explanation;
  const rules = result?.rules;

  /*
   * Agent API response structure:
   *
   * model_result
   * policy_result
   * rules_result
   * reasoning
   * risk_signals
   */

  const agentModelResult =
    agentResult?.model_result || {};

  const agentPolicyResult =
    agentResult?.policy_result || {};

  const agentRulesResult =
    agentResult?.rules_result || {};

  const agentFinalDecision =
    agentPolicyResult?.final_decision ||
    agentPolicyResult?.decision ||
    "UNKNOWN";

  const agentModelDecision =
    agentModelResult?.decision ||
    "UNKNOWN";

  const agentRuleDecision =
    agentRulesResult?.decision ||
    "UNKNOWN";

  const agentFraudProbability =
    agentModelResult?.fraud_probability ?? 0;

  const agentReasons =
    Array.isArray(agentResult?.reasoning)
      ? agentResult.reasoning
      : [];

  const agentRulesTriggered =
    Array.isArray(
      agentRulesResult?.rules_triggered
    )
      ? agentRulesResult.rules_triggered
      : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* =====================================================
          TRANSACTION INPUT
          ===================================================== */}

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
              Transaction Investigation
            </div>

            <div className="card-subtitle">
              Submit a transaction to the fraud decision
              engine
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#54d8a6",
              fontSize: "9px",
              fontWeight: 700,
            }}
          >
            <Zap size={12} />
            Real-time analysis
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <InputField
            label="Transaction amount"
            value={transaction.amount}
            prefix="₹"
            onChange={(value) =>
              updateField("amount", value)
            }
          />

          <InputField
            label="Transaction hour"
            value={transaction.hour}
            onChange={(value) =>
              updateField("hour", value)
            }
          />

          <InputField
            label="Distance from home"
            value={transaction.distance_from_home}
            suffix="km"
            onChange={(value) =>
              updateField(
                "distance_from_home",
                value
              )
            }
          />

          <InputField
            label="Failed attempts"
            value={transaction.failed_attempts}
            onChange={(value) =>
              updateField(
                "failed_attempts",
                value
              )
            }
          />

          <InputField
            label="Transactions / 24h"
            value={transaction.transactions_24h}
            onChange={(value) =>
              updateField(
                "transactions_24h",
                value
              )
            }
          />

          <InputField
            label="Transactions / 1h"
            value={transaction.transactions_1h}
            onChange={(value) =>
              updateField(
                "transactions_1h",
                value
              )
            }
          />

          <InputField
            label="Average transaction"
            value={
              transaction.average_transaction_amount
            }
            prefix="₹"
            onChange={(value) =>
              updateField(
                "average_transaction_amount",
                value
              )
            }
          />

          <InputField
            label="Merchant risk"
            value={transaction.merchant_risk}
            step="0.01"
            onChange={(value) =>
              updateField(
                "merchant_risk",
                value
              )
            }
          />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "9px",
            marginTop: "13px",
          }}
        >
          <ToggleField
            label="New device"
            active={Boolean(
              transaction.new_device
            )}
            onClick={() =>
              setTransaction((current) => ({
                ...current,
                new_device:
                  current.new_device ? 0 : 1,
              }))
            }
          />

          <ToggleField
            label="International"
            active={Boolean(
              transaction.international_transaction
            )}
            onClick={() =>
              setTransaction((current) => ({
                ...current,
                international_transaction:
                  current.international_transaction
                    ? 0
                    : 1,
              }))
            }
          />
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "14px",
              padding: "10px 12px",
              borderRadius: "9px",
              border:
                "1px solid rgba(255,92,112,0.16)",
              background:
                "rgba(255,92,112,0.045)",
              color: "#ff7180",
              fontSize: "9px",
            }}
          >
            <AlertTriangle size={13} />
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "9px",
            marginTop: "18px",
          }}
        >
          <button
            className="insight-action"
            onClick={runRiskDecision}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="spin-animation" />
            ) : (
              <ShieldAlert />
            )}

            Run Risk Decision
          </button>

          <button
            className="insight-action"
            onClick={runAgentInvestigation}
            disabled={agentLoading}
          >
            {agentLoading ? (
              <Loader2 className="spin-animation" />
            ) : (
              <Bot />
            )}

            Investigate with Agent
          </button>

          <button
            className="insight-action"
            onClick={runAIInvestigation}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <Loader2 className="spin-animation" />
            ) : (
              <Sparkles />
            )}

            AI Assessment
          </button>
        </div>
      </div>

      {/* =====================================================
          TRANSACTION SIGNALS
          ===================================================== */}

      <div
        className="glass-card"
        style={{ padding: "20px" }}
      >
        <div className="card-title">
          Transaction signals
        </div>

        <div className="card-subtitle">
          Features supplied to the fraud model
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "9px",
            marginTop: "16px",
          }}
        >
          <SignalCard
            icon={CircleDollarIcon}
            label="Amount"
            value={`₹${Number(
              transaction.amount
            ).toLocaleString("en-IN")}`}
          />

          <SignalCard
            icon={Clock3}
            label="Time"
            value={`${String(
              transaction.hour
            ).padStart(2, "0")}:00`}
          />

          <SignalCard
            icon={MapPin}
            label="Distance"
            value={`${transaction.distance_from_home} km`}
          />

          <SignalCard
            icon={Smartphone}
            label="Device"
            value={
              transaction.new_device
                ? "New device"
                : "Known device"
            }
          />

          <SignalCard
            icon={Globe}
            label="Transaction"
            value={
              transaction.international_transaction
                ? "International"
                : "Domestic"
            }
          />

          <SignalCard
            icon={UserRound}
            label="Customer"
            value={transaction.customer_id}
          />
        </div>
      </div>

      {/* =====================================================
          MODEL RESULT
          ===================================================== */}

      {result && (
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
                Model decision
              </div>

              <div className="card-subtitle">
                XGBoost fraud prediction + risk policy
              </div>
            </div>

            <ResultBadge
              decision={
                risk?.decision ||
                prediction?.decision ||
                risk?.risk_level
              }
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              marginTop: "18px",
            }}
          >
            <ResultMetric
              label="Fraud probability"
              value={`${(
                Number(
                  prediction?.fraud_probability ?? 0
                ) * 100
              ).toFixed(2)}%`}
            />

            <ResultMetric
              label="Risk level"
              value={
                risk?.risk_level ||
                prediction?.risk_level ||
                "UNKNOWN"
              }
            />

            <ResultMetric
              label="Model decision"
              value={
                prediction?.decision ||
                risk?.decision ||
                "UNKNOWN"
              }
            />

            <ResultMetric
              label="Transaction ID"
              value={result.transaction_id}
            />
          </div>

          {explanation && (
            <div
              style={{
                marginTop: "16px",
                padding: "15px",
                border:
                  "1px solid rgba(124,92,255,0.12)",
                borderRadius: "11px",
                background:
                  "linear-gradient(135deg, rgba(124,92,255,0.045), rgba(255,255,255,0.012))",
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      color: "#a18fff",
                      fontSize: "10px",
                      fontWeight: 750,
                    }}
                  >
                    <Sparkles size={12} />
                    Explainability
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      color: "#667388",
                      fontSize: "8px",
                    }}
                  >
                    Why the model considers this transaction risky
                  </div>
                </div>

                <span
                  style={{
                    padding: "5px 8px",
                    borderRadius: "7px",
                    background: "rgba(124,92,255,0.08)",
                    color: "#9d8cff",
                    fontSize: "8px",
                    fontWeight: 750,
                  }}
                >
                  XGBoost + SHAP
                </span>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(155px, 1fr))",
                  gap: "8px",
                }}
              >
                {[
                  {
                    label: "Transaction amount",
                    value: `₹${Number(
                      transaction.amount
                    ).toLocaleString("en-IN")}`,
                    reason:
                      Number(transaction.amount) >=
                      Number(
                        transaction.average_transaction_amount
                      ) * 2
                        ? "Significantly above customer average"
                        : "Within expected amount range",
                    risk:
                      Number(transaction.amount) >=
                      Number(
                        transaction.average_transaction_amount
                      ) * 2,
                  },
                  {
                    label: "Device signal",
                    value: transaction.new_device
                      ? "New device"
                      : "Known device",
                    reason: transaction.new_device
                      ? "Device is unfamiliar to the customer"
                      : "Known customer device",
                    risk: Boolean(transaction.new_device),
                  },
                  {
                    label: "Transaction velocity",
                    value: `${transaction.transactions_1h} / hour`,
                    reason:
                      Number(transaction.transactions_1h) >= 5
                        ? "Unusually high short-term activity"
                        : "Short-term activity is within threshold",
                    risk:
                      Number(transaction.transactions_1h) >= 5,
                  },
                  {
                    label: "Failed attempts",
                    value: String(transaction.failed_attempts),
                    reason:
                      Number(transaction.failed_attempts) >= 3
                        ? "Multiple failed attempts detected"
                        : "Limited failed attempts",
                    risk:
                      Number(transaction.failed_attempts) >= 3,
                  },
                  {
                    label: "Location signal",
                    value: `${transaction.distance_from_home} km`,
                    reason:
                      Number(transaction.distance_from_home) >= 100
                        ? "Transaction is far from normal location"
                        : "Location distance is moderate",
                    risk:
                      Number(transaction.distance_from_home) >= 100,
                  },
                  {
                    label: "International",
                    value: transaction.international_transaction
                      ? "International"
                      : "Domestic",
                    reason:
                      transaction.international_transaction
                        ? "Cross-border transaction adds risk context"
                        : "No international signal",
                    risk: Boolean(
                      transaction.international_transaction
                    ),
                  },
                ].map((signal) => (
                  <div
                    key={signal.label}
                    style={{
                      padding: "11px",
                      borderRadius: "9px",
                      border: `1px solid ${
                        signal.risk
                          ? "rgba(255,127,150,0.12)"
                          : "rgba(255,255,255,0.045)"
                      }`,
                      background: signal.risk
                        ? "rgba(255,92,112,0.025)"
                        : "rgba(255,255,255,0.018)",
                    }}
                  >
                    <div
                      style={{
                        color: "#68758a",
                        fontSize: "7px",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {signal.label}
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        color: "#e5eaf2",
                        fontSize: "10px",
                        fontWeight: 750,
                      }}
                    >
                      {signal.value}
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        color: signal.risk
                          ? "#c48b98"
                          : "#758196",
                        fontSize: "8px",
                        lineHeight: 1.45,
                      }}
                    >
                      {signal.reason}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "12px",
                  padding: "11px 12px",
                  borderRadius: "9px",
                  background: "rgba(255,255,255,0.018)",
                  border:
                    "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div className="card-subtitle">
                  Model explanation
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    color: "#8793a7",
                    fontSize: "9px",
                    lineHeight: 1.65,
                  }}
                >
                  {explanation.summary ||
                    explanation.message ||
                    "The model combines transaction amount, device, velocity, location and authentication signals to estimate fraud risk."}
                </div>
              </div>
            </div>
          )}

          {rules && (
            <div
              style={{
                marginTop: "12px",
                color: "#758196",
                fontSize: "9px",
              }}
            >
              Rules triggered:{" "}
              <strong
                style={{ color: "#dce3ed" }}
              >
                {rules.rules_triggered?.length ??
                  rules.triggered_rules?.length ??
                  0}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          AGENT RESULT
          ===================================================== */}

      {agentResult && (
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
                Agent investigation
              </div>

              <div className="card-subtitle">
                Deterministic multi-tool risk
                investigation
              </div>
            </div>

            <Bot
              size={16}
              color="#9d8cff"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              marginTop: "18px",
            }}
          >
            <ResultMetric
              label="Final decision"
              value={agentFinalDecision}
            />

            <ResultMetric
              label="Model decision"
              value={agentModelDecision}
            />

            <ResultMetric
              label="Rule decision"
              value={agentRuleDecision}
            />

            <ResultMetric
              label="Fraud probability"
              value={`${(
                Number(agentFraudProbability) * 100
              ).toFixed(2)}%`}
            />
          </div>

          {Array.isArray(agentReasons) &&
            agentReasons.length > 0 && (
              <div
                style={{ marginTop: "16px" }}
              >
                <div className="card-subtitle">
                  Investigation reasoning
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "7px",
                    marginTop: "9px",
                  }}
                >
                  {agentReasons.map(
                    (reason, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          color: "#8793a7",
                          fontSize: "9px",
                          lineHeight: 1.55,
                        }}
                      >
                        <ArrowRight
                          size={11}
                          color="#7c5cff"
                          style={{
                            marginTop: "2px",
                          }}
                        />

                        {typeof reason ===
                        "string"
                          ? reason
                          : reason?.reason ||
                            reason?.message ||
                            JSON.stringify(
                              reason
                            )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {Array.isArray(
            agentRulesTriggered
          ) &&
            agentRulesTriggered.length > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "12px",
                  borderTop:
                    "1px solid rgba(255,255,255,0.045)",
                }}
              >
                <div className="card-subtitle">
                  Rules triggered
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {agentRulesTriggered.map(
                    (rule, index) => (
                      <div
                        key={
                          rule?.id || index
                        }
                        style={{
                          color: "#8b96a8",
                          fontSize: "9px",
                          lineHeight: 1.5,
                        }}
                      >
                        <strong
                          style={{
                            color: "#dce3ed",
                          }}
                        >
                          {rule?.name ||
                            rule?.id ||
                            `Rule ${
                              index + 1
                            }`}
                        </strong>

                        {rule?.reason
                          ? ` — ${rule.reason}`
                          : ""}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* =====================================================
          AI RESULT
          ===================================================== */}

      {aiResult && (
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
                AI risk assessment
              </div>

              <div className="card-subtitle">
                Decision intelligence from model, rules and risk policy
              </div>
            </div>

            <Sparkles
              size={16}
              color="#9d8cff"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "10px",
              marginTop: "18px",
            }}
          >
            <ResultMetric
              label="Fraud probability"
              value={`${(
                Number(
                  aiResult?.investigation?.model_result
                    ?.fraud_probability ??
                    aiResult?.model_result?.fraud_probability ??
                    0
                ) * 100
              ).toFixed(2)}%`}
            />

            <ResultMetric
              label="Risk level"
              value={
                aiResult?.investigation?.policy_result?.risk_level ||
                aiResult?.investigation?.risk_policy?.risk_level ||
                "HIGH"
              }
            />

            <ResultMetric
              label="Model decision"
              value={
                aiResult?.investigation?.model_result?.decision ||
                aiResult?.model_result?.decision ||
                "FRAUD"
              }
            />

            <ResultMetric
              label="Rules triggered"
              value={
                aiResult?.investigation?.rules_result?.rules_triggered
                  ?.length ||
                aiResult?.investigation?.fraud_rules?.rules_triggered
                  ?.length ||
                0
              }
            />
          </div>

          <div
            style={{
              marginTop: "14px",
              padding: "15px",
              borderRadius: "11px",
              border:
                "1px solid rgba(124,92,255,0.13)",
              background:
                "linear-gradient(135deg, rgba(124,92,255,0.07), rgba(54,211,153,0.025))",
            }}
          >
            <div
              style={{
                color: "#a18fff",
                fontSize: "9px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              AI assessment
            </div>

            <div
              style={{
                marginTop: "9px",
                color: "#aab4c4",
                fontSize: "10px",
                lineHeight: 1.7,
              }}
            >
              {aiResult?.assessment ||
                aiResult?.message ||
                aiResult?.explanation ||
                "AI investigation completed using the fraud model, transaction rules and configured risk policy."}
            </div>
          </div>

          <div
            style={{
              marginTop: "14px",
              padding: "15px",
              borderRadius: "11px",
              background: "rgba(255,255,255,0.018)",
              border:
                "1px solid rgba(255,255,255,0.045)",
            }}
          >
            <div className="card-subtitle">
              Recommended action
            </div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "13px",
                fontWeight: 800,
                color: "#ff7f96",
              }}
            >
              {aiResult?.investigation?.policy_result?.final_decision ||
                aiResult?.investigation?.policy_result?.decision ||
                aiResult?.investigation?.risk_policy?.final_decision ||
                "BLOCK"}
            </div>

            <div
              style={{
                marginTop: "6px",
                color: "#758196",
                fontSize: "9px",
                lineHeight: 1.6,
              }}
            >
              Decision combines the fraud model,
              transaction rules and configured risk policy.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   INPUT COMPONENTS
   ========================================================= */

function InputField({
  label,
  value,
  prefix,
  suffix,
  step = "1",
  onChange,
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <span
        style={{
          color: "#68758a",
          fontSize: "8px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "37px",
          padding: "0 10px",
          border:
            "1px solid rgba(255,255,255,0.055)",
          borderRadius: "8px",
          background:
            "rgba(255,255,255,0.025)",
        }}
      >
        {prefix && (
          <span
            style={{
              color: "#6f7b8f",
              fontSize: "10px",
              marginRight: "5px",
            }}
          >
            {prefix}
          </span>
        )}

        <input
          type="number"
          step={step}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          style={{
            width: "100%",
            border: 0,
            outline: 0,
            background: "transparent",
            color: "#e6ebf2",
            fontSize: "10px",
          }}
        />

        {suffix && (
          <span
            style={{
              color: "#6f7b8f",
              fontSize: "9px",
              marginLeft: "5px",
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function ToggleField({
  label,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "7px 10px",
        border: `1px solid ${
          active
            ? "rgba(124,92,255,0.28)"
            : "rgba(255,255,255,0.055)"
        }`,
        borderRadius: "8px",
        background: active
          ? "rgba(124,92,255,0.09)"
          : "rgba(255,255,255,0.02)",
        color: active
          ? "#a18fff"
          : "#738096",
        cursor: "pointer",
        fontSize: "9px",
        fontWeight: 700,
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: active
            ? "#7c5cff"
            : "#4c5768",
          boxShadow: active
            ? "0 0 8px rgba(124,92,255,0.7)"
            : "none",
        }}
      />

      {label}
    </button>
  );
}

function ResultMetric({
  label,
  value,
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
          color: "#68758a",
          fontSize: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: "7px",
          color: "#edf1f7",
          fontSize: "14px",
          fontWeight: 780,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CircleDollarIcon(props) {
  return (
    <CircleDollarIconInner {...props} />
  );
}

function CircleDollarIconInner({
  size = 13,
  ...props
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 6v12" />
    </svg>
  );
}