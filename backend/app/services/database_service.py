from pathlib import Path
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = DATA_DIR / "fraud_risk.db"

DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


# ============================================================
# TRANSACTION TABLE
# ============================================================

class TransactionRecord(Base):
    __tablename__ = "transactions"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    transaction_id = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    customer_id = Column(
        String,
        nullable=False,
        index=True,
    )

    transaction_data = Column(
        Text,
        nullable=False,
    )

    prediction = Column(
        Text,
        nullable=True,
    )

    risk = Column(
        Text,
        nullable=True,
    )

    explanation = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
    )


# ============================================================
# AUDIT TABLE
# ============================================================

class AuditRecord(Base):
    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    transaction_id = Column(
        String,
        nullable=False,
        index=True,
    )

    customer_id = Column(
        String,
        nullable=True,
    )

    event_type = Column(
        String,
        nullable=False,
    )

    event_data = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
    )


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)


# ============================================================
# DATABASE SESSION
# ============================================================

def get_database():
    """
    Return a real SQLAlchemy session.

    This is intentionally NOT a generator because the
    repository layer directly uses:

        db = get_database()

        db.query(...)

    The caller is responsible for closing the session.
    """

    return SessionLocal()


# ============================================================
# DATABASE SERVICE
# ============================================================

class DatabaseService:

    def __init__(self):
        initialize_database()

    # --------------------------------------------------------
    # SAVE TRANSACTION
    # --------------------------------------------------------

    def save_transaction(
        self,
        transaction_id: str,
        customer_id: str,
        transaction_data: Dict[str, Any],
        prediction: Dict[str, Any] | None = None,
        risk: Dict[str, Any] | None = None,
        explanation: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:

        import json

        db = SessionLocal()

        try:

            record = TransactionRecord(
                transaction_id=transaction_id,
                customer_id=customer_id,

                transaction_data=json.dumps(
                    transaction_data,
                    default=str,
                ),

                prediction=json.dumps(
                    prediction or {},
                    default=str,
                ),

                risk=json.dumps(
                    risk or {},
                    default=str,
                ),

                explanation=json.dumps(
                    explanation or {},
                    default=str,
                ),
            )

            db.add(record)

            db.commit()

            db.refresh(record)

            return {
                "id": record.id,
                "transaction_id": record.transaction_id,
                "customer_id": record.customer_id,
                "created_at": (
                    record.created_at.isoformat()
                    if record.created_at
                    else None
                ),
            }

        except Exception:

            db.rollback()

            raise

        finally:

            db.close()

    # --------------------------------------------------------
    # SAVE AUDIT EVENT
    # --------------------------------------------------------

    def save_audit_event(
        self,
        transaction_id: str,
        event_type: str,
        event_data: Dict[str, Any] | None = None,
        customer_id: str | None = None,
    ) -> Dict[str, Any]:

        import json

        db = SessionLocal()

        try:

            record = AuditRecord(
                transaction_id=transaction_id,
                customer_id=customer_id,
                event_type=event_type,

                event_data=json.dumps(
                    event_data or {},
                    default=str,
                ),
            )

            db.add(record)

            db.commit()

            db.refresh(record)

            return {
                "id": record.id,
                "transaction_id": record.transaction_id,
                "customer_id": record.customer_id,
                "event_type": record.event_type,
                "created_at": (
                    record.created_at.isoformat()
                    if record.created_at
                    else None
                ),
            }

        except Exception:

            db.rollback()

            raise

        finally:

            db.close()

    # --------------------------------------------------------
    # GET RECENT TRANSACTIONS
    # --------------------------------------------------------

    def get_recent_transactions(
        self,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:

        import json

        db = SessionLocal()

        try:

            records = (
                db.query(TransactionRecord)
                .order_by(
                    TransactionRecord.created_at.desc()
                )
                .limit(limit)
                .all()
            )

            results = []

            for record in records:

                try:
                    transaction_data = json.loads(
                        record.transaction_data
                    )
                except Exception:
                    transaction_data = {}

                try:
                    prediction = json.loads(
                        record.prediction or "{}"
                    )
                except Exception:
                    prediction = {}

                try:
                    risk = json.loads(
                        record.risk or "{}"
                    )
                except Exception:
                    risk = {}

                try:
                    explanation = json.loads(
                        record.explanation or "{}"
                    )
                except Exception:
                    explanation = {}

                results.append(
                    {
                        "transaction_id": record.transaction_id,

                        "customer_id": record.customer_id,

                        "transaction": transaction_data,

                        "prediction": prediction,

                        "risk": risk,

                        "explanation": explanation,

                        "created_at": (
                            record.created_at.isoformat()
                            if record.created_at
                            else None
                        ),
                    }
                )

            return results

        finally:

            db.close()


# ============================================================
# GLOBAL DATABASE SERVICE
# ============================================================

database_service = DatabaseService()