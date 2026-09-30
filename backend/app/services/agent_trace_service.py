from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class AgentTraceService:
    """
    Records the sequence of actions performed during
    a fraud-risk investigation.

    This trace can later be displayed in the frontend
    as an Agent Decision Trace.
    """

    def __init__(self):
        self.traces: Dict[
            str,
            List[Dict[str, Any]]
        ] = {}

    def start_trace(
        self,
        transaction_id: str,
    ) -> None:

        self.traces[transaction_id] = []

    def record_step(
        self,
        transaction_id: str,
        step: str,
        tool: str,
        status: str = "completed",
        details: Optional[
            Dict[str, Any]
        ] = None,
    ) -> Dict[str, Any]:

        event = {
            "timestamp": datetime.now(
                timezone.utc
            ).isoformat(),
            "step": step,
            "tool": tool,
            "status": status,
            "details": details or {},
        }

        if transaction_id not in self.traces:
            self.traces[transaction_id] = []

        self.traces[
            transaction_id
        ].append(event)

        return event

    def get_trace(
        self,
        transaction_id: str,
    ) -> List[Dict[str, Any]]:

        return self.traces.get(
            transaction_id,
            [],
        )

    def get_trace_summary(
        self,
        transaction_id: str,
    ) -> Dict[str, Any]:

        steps = self.get_trace(
            transaction_id
        )

        completed_steps = sum(
            1
            for step in steps
            if step.get("status") == "completed"
        )

        failed_steps = sum(
            1
            for step in steps
            if step.get("status") == "failed"
        )

        return {
            "transaction_id": transaction_id,
            "total_steps": len(steps),
            "completed_steps": completed_steps,
            "failed_steps": failed_steps,
            "steps": steps,
        }

    def clear_trace(
        self,
        transaction_id: str,
    ) -> None:

        self.traces.pop(
            transaction_id,
            None,
        )


agent_trace_service = AgentTraceService()