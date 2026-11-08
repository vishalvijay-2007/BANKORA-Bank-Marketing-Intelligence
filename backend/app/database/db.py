from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'backend', 'bankora.db')}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PredictionRecord(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    customer_summary = Column(String, nullable=False)
    input_json = Column(String, nullable=False)
    prediction = Column(String, nullable=False)
    label = Column(String, nullable=False)
    probability = Column(Float, nullable=False)
    confidence_tier = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    model_mode = Column(String, default="pre_call")
    recommended_action = Column(String, nullable=False)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class UserRecord(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)
    is_active = Column(Integer, default=1, nullable=False)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class RefreshTokenRecord(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    token_hash = Column(String, index=True, nullable=False)
    expires_at = Column(String, nullable=False)
    revoked = Column(Integer, default=0, nullable=False)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class PasswordResetRecord(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    token_hash = Column(String, index=True, nullable=False)
    expires_at = Column(String, nullable=False)
    used = Column(Integer, default=0, nullable=False)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

