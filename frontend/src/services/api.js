const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


/* =========================================================
   GENERIC API REQUEST
   ========================================================= */

async function request(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    }
  );

  if (!response.ok) {
    let errorMessage =
      `API request failed: ${response.status}`;

    try {
      const errorData =
        await response.json();

      if (errorData?.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(
                errorData.detail
              );
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(errorMessage);
  }

  return response.json();
}


/* =========================================================
   TRANSACTION PAYLOAD BUILDER
   ========================================================= */

function buildTransactionPayload(
  transaction
) {
  return {
    amount: Number(
      transaction.amount ?? 0
    ),

    hour: Number(
      transaction.hour ?? 0
    ),

    distance_from_home: Number(
      transaction.distance_from_home ?? 0
    ),

    failed_attempts: Number(
      transaction.failed_attempts ?? 0
    ),

    account_age_days: Number(
      transaction.account_age_days ?? 0
    ),

    merchant_risk: Number(
      transaction.merchant_risk ?? 0
    ),

    transactions_24h: Number(
      transaction.transactions_24h ?? 0
    ),

    transactions_1h: Number(
      transaction.transactions_1h ?? 0
    ),

    average_transaction_amount:
      Number(
        transaction.average_transaction_amount ??
          0
      ),

    international_transaction:
      transaction.international_transaction
        ? 1
        : 0,

    new_device:
      transaction.new_device
        ? 1
        : 0,

    device_age_days:
      Number(
        transaction.device_age_days ?? 0
      ),
  };
}


/* =========================================================
   HEALTH
   ========================================================= */

export async function getHealth() {
  return request(
    "/api/v1/health"
  );
}


/* =========================================================
   FRAUD / RISK DECISION
   ========================================================= */

export async function getRiskDecision(
  transaction
) {
  const payload = {
    customer_id:
      transaction.customer_id ||
      "C-1042",

    transaction:
      buildTransactionPayload(
        transaction
      ),
  };

  return request(
    "/api/v1/decision",
    {
      method: "POST",
      body: JSON.stringify(
        payload
      ),
    }
  );
}


/* =========================================================
   AGENT INVESTIGATION
   ========================================================= */

export async function investigateTransaction(
  transaction
) {
  const customerId =
    transaction.customer_id ||
    "C-1042";

  const payload =
    buildTransactionPayload(
      transaction
    );

  const endpoint =
    `/api/v1/agent/investigate?customer_id=${encodeURIComponent(
      customerId
    )}`;

  return request(
    endpoint,
    {
      method: "POST",
      body: JSON.stringify(
        payload
      ),
    }
  );
}


/* =========================================================
   AI AGENT INVESTIGATION
   ========================================================= */

export async function aiInvestigateTransaction(
  transaction
) {
  const customerId =
    transaction.customer_id ||
    "C-1042";

  const payload =
    buildTransactionPayload(
      transaction
    );

  const endpoint =
    `/api/v1/agent/ai-investigate?customer_id=${encodeURIComponent(
      customerId
    )}`;

  return request(
    endpoint,
    {
      method: "POST",
      body: JSON.stringify(
        payload
      ),
    }
  );
}


/* =========================================================
   CUSTOMERS
   ========================================================= */

export async function createCustomer(
  customer
) {
  return request(
    "/api/v1/customers",
    {
      method: "POST",
      body: JSON.stringify(
        customer
      ),
    }
  );
}


export async function getCustomer(
  customerId
) {
  return request(
    `/api/v1/customers/${encodeURIComponent(
      customerId
    )}`
  );
}


/* =========================================================
   CUSTOMER TRANSACTIONS
   ========================================================= */

export async function createCustomerTransaction(
  customerId,
  transaction
) {
  return request(
    `/api/v1/customers/${encodeURIComponent(
      customerId
    )}/transactions`,
    {
      method: "POST",
      body: JSON.stringify(
        transaction
      ),
    }
  );
}


export async function getCustomerTransactions(
  customerId
) {
  return request(
    `/api/v1/customers/${encodeURIComponent(
      customerId
    )}/transactions`
  );
}


/* =========================================================
   MONITORING
   ========================================================= */

export async function getMonitoringHealth() {
  return request(
    "/api/v1/monitoring/health"
  );
}


export async function getRiskDistribution() {
  return request(
    "/api/v1/monitoring/distribution"
  );
}


export async function checkModelDrift() {
  return request(
    "/api/v1/monitoring/drift",
    {
      method: "POST",
    }
  );
}


export async function getModelPerformance() {
  return request(
    "/api/v1/monitoring/performance"
  );
}


/* =========================================================
   AUDIT
   ========================================================= */

export async function getAuditLogs() {
  return request(
    "/api/v1/audit"
  );
}


/* =========================================================
   AGENT TRACE
   ========================================================= */

export async function getAgentTrace(
  transactionId
) {
  return request(
    `/api/v1/agent/trace/${encodeURIComponent(
      transactionId
    )}`
  );
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

const api = {
  getHealth,
  getRiskDecision,
  investigateTransaction,
  aiInvestigateTransaction,
  createCustomer,
  getCustomer,
  createCustomerTransaction,
  getCustomerTransactions,
  getMonitoringHealth,
  getRiskDistribution,
  checkModelDrift,
  getModelPerformance,
  getAuditLogs,
  getAgentTrace,
};

export default api;