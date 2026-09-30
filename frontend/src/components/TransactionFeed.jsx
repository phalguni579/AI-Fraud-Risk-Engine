import { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import {
  getCustomerTransactions,
  getAuditLogs,
} from "../services/api";

const DEFAULT_CUSTOMER_ID = "C-1042";

export default function TransactionFeed() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadTransactions() {
    setLoading(true);

    try {
      let records = [];

      /*
       * Primary source:
       * Persisted customer transactions.
       */
      try {
        const response =
          await getCustomerTransactions(
            DEFAULT_CUSTOMER_ID
          );

        records = Array.isArray(response)
          ? response
          : response?.transactions ||
            response?.records ||
            response?.items ||
            [];
      } catch (transactionError) {
        console.warn(
          "Customer transaction endpoint failed. Trying audit logs.",
          transactionError
        );
      }

      /*
       * Fallback:
       * Audit records.
       */
      if (records.length === 0) {
        try {
          const response =
            await getAuditLogs();

          records = Array.isArray(response)
            ? response
            : response?.records ||
              response?.audit_logs ||
              response?.items ||
              [];
        } catch (auditError) {
          console.warn(
            "Audit fallback failed.",
            auditError
          );
        }
      }

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
            item;

          const prediction =
            result?.prediction ||
            item?.prediction ||
            {};

          const risk =
            result?.risk ||
            item?.risk ||
            {};

          const rules =
            result?.rules ||
            item?.rules ||
            {};

          const probability = Number(
            prediction?.fraud_probability ??
              result?.fraud_probability ??
              item?.fraud_probability ??
              item?.probability ??
              0
          );

          const decision =
            result?.final_decision ||
            result?.decision ||
            risk?.decision ||
            item?.final_decision ||
            item?.decision ||
            prediction?.decision ||
            "UNKNOWN";

          const riskLevel =
            risk?.risk_level ||
            result?.risk_level ||
            item?.risk_level ||
            (
              probability >= 0.70
                ? "HIGH"
                : probability >= 0.30
                ? "MEDIUM"
                : "LOW"
            );

          const transactionId =
            result?.transaction_id ||
            item?.transaction_id ||
            transaction?.transaction_id ||
            item?.id ||
            `TXN-${index + 1}`;

          const customerId =
            result?.customer_id ||
            item?.customer_id ||
            transaction?.customer_id ||
            DEFAULT_CUSTOMER_ID;

          const amount = Number(
            transaction?.amount ??
              item?.amount ??
              0
          );

          const time =
            item?.created_at ||
            item?.timestamp ||
            result?.timestamp ||
            transaction?.created_at ||
            null;

          return {
            id: transactionId,
            customer: customerId,
            amount,
            probability,
            riskLevel,
            decision: String(
              decision
            ).toUpperCase(),
            time,
            rulesTriggered:
              rules?.rules_triggered?.length ||
              item?.rules_triggered?.length ||
              0,
          };
        })
        .filter(
          (item) =>
            item.id &&
            item.id !== "TXN-undefined"
        )
        .reverse();

      setTransactions(normalized);
    } catch (error) {
      console.error(
        "Transaction feed failed:",
        error
      );

      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  function formatAmount(amount) {
    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;
  }

  function formatTime(value) {
    if (!value) {
      return "Just now";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getRiskClass(level) {
    return String(level)
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  function getDecisionIcon(decision) {
    const normalized =
      String(decision).toUpperCase();

    if (normalized === "BLOCK") {
      return <ShieldAlert size={14} />;
    }

    if (normalized === "REVIEW") {
      return <AlertTriangle size={14} />;
    }

    return <CheckCircle2 size={14} />;
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: "20px",
        marginTop: "14px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div className="card-title">
            Live Transaction Feed
          </div>

          <div className="card-subtitle">
            Recent transactions processed by the
            fraud decision engine
          </div>
        </div>

        <button
          className="insight-action"
          onClick={loadTransactions}
          disabled={loading}
        >
          <RefreshCw
            className={
              loading
                ? "spin-animation"
                : ""
            }
            size={14}
          />

          Refresh
        </button>
      </div>

      {/* LOADING */}

      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "45px 20px",
            color: "#748096",
            fontSize: "11px",
          }}
        >
          Loading transactions...
        </div>
      )}

      {/* EMPTY */}

      {!loading &&
        transactions.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "45px 20px",
              color: "#748096",
            }}
          >
            <Activity size={22} />

            <div
              style={{
                color: "#dce3ec",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              No transactions yet
            </div>

            <div
              style={{
                fontSize: "9px",
              }}
            >
              Run a Risk Decision to create a
              transaction record.
            </div>
          </div>
        )}

      {/* TABLE */}

      {!loading &&
        transactions.length > 0 && (
          <div
            style={{
              overflowX: "auto",
              marginTop: "18px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "820px",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Transaction",
                    "Customer",
                    "Amount",
                    "Risk",
                    "Fraud Probability",
                    "Decision",
                    "Rules",
                    "Time",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        color: "#69758a",
                        fontSize: "8px",
                        fontWeight: 750,
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.06em",
                        borderBottom:
                          "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {transactions.map(
                  (transaction) => {
                    const riskClass =
                      getRiskClass(
                        transaction.riskLevel
                      );

                    return (
                      <tr
                        key={
                          transaction.id
                        }
                        style={{
                          transition:
                            "background 0.2s ease",
                        }}
                      >
                        {/* TRANSACTION */}

                        <td
                          style={{
                            padding:
                              "14px 12px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                          }}
                        >
                          <div
                            style={{
                              color: "#e7ecf4",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            {
                              transaction.id
                            }
                          </div>
                        </td>

                        {/* CUSTOMER */}

                        <td
                          style={{
                            padding:
                              "14px 12px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                          }}
                        >
                          <span
                            style={{
                              color: "#9aa6b8",
                              fontSize: "10px",
                            }}
                          >
                            {
                              transaction.customer
                            }
                          </span>
                        </td>

                        {/* AMOUNT */}

                        <td
                          style={{
                            padding:
                              "14px 12px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                          }}
                        >
                          <span
                            style={{
                              color: "#e8edf5",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            {formatAmount(
                              transaction.amount
                            )}
                          </span>
                        </td>

                        {/* RISK */}

                        <td
                          style={{
                            padding:
                              "14px 12px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                          }}
                        >
                          <span
                            className={`badge badge-${riskClass}`}
                          >
                            {
                              transaction.riskLevel
                            }
                          </span>
                        </td>

                        {/* PROBABILITY */}

                        <td
                          style={{
                            padding:
                              "14px 12px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                          }}
                        >
                          <span
                            style={{
                              color: "#cfd7e3",
                              fontSize: "10px",
                              fontWeight: 650,
                            }}
                          >
                            {(
                              transaction.probability *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </td>

                        {/* DECISION */}

                        <td
                          style={{
                            padding:
                              "14px 12px",
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
                              gap: "6px",
                              color:
                                transaction.decision ===
                                "BLOCK"
                                  ? "#ff7180"
                                  : transaction.decision ===
                                    "REVIEW"
                                  ? "#f2c46d"
                                  : "#54d8a6",
                              fontSize: "9px",
                              fontWeight: 750,
                            }}
                          >
                            {getDecisionIcon(
                              transaction.decision
                            )}

                            {
                              transaction.decision
                            }
                          </div>
                        </td>

                        {/* RULES */}

                        <td
                          style={{
                            padding:
                              "14px 12px",
                            borderBottom:
                              "1px solid rgba(255,255,255,0.035)",
                          }}
                        >
                          <span
                            style={{
                              color: "#9d8cff",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            {
                              transaction.rulesTriggered
                            }
                          </span>
                        </td>

                        {/* TIME */}

                        <td
                          style={{
                            padding:
                              "14px 12px",
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
                              color: "#778397",
                              fontSize: "9px",
                            }}
                          >
                            <Clock3
                              size={11}
                            />

                            {formatTime(
                              transaction.time
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}