from typing import Any, Callable, Dict, List

from backend.app.services.tool_service import (
    risk_tool_service,
)


class AgentToolRegistry:
    """
    Central registry of tools available to the
    Fraud Risk Decision Agent.
    """

    def __init__(self):
        self.tools: Dict[
            str,
            Callable[..., Dict[str, Any]]
        ] = {
            "get_customer_profile":
                risk_tool_service.get_customer_profile,

            "get_transaction_history":
                risk_tool_service.get_transaction_history,

            "run_fraud_model":
                risk_tool_service.run_fraud_model,

            "evaluate_fraud_rules":
                risk_tool_service.evaluate_fraud_rules,

            "get_risk_signals":
                risk_tool_service.get_risk_signals,
        }

    def list_tools(self) -> List[str]:
        """
        Returns names of all registered tools.
        """

        return list(
            self.tools.keys()
        )

    def execute(
        self,
        tool_name: str,
        **kwargs: Any,
    ) -> Dict[str, Any]:

        if tool_name not in self.tools:
            raise ValueError(
                f"Unknown agent tool: {tool_name}"
            )

        tool = self.tools[tool_name]

        return tool(
            **kwargs
        )


agent_tool_registry = AgentToolRegistry()