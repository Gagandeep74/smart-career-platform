"""Add career toolkit, recovery, analytics, and alert tables."""
from alembic import op
import sqlalchemy as sa

from backend.core.models import Base

revision = "20261114_03"
down_revision = "20261113_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "email_verified_at" not in {column["name"] for column in inspector.get_columns("users")}:
        op.add_column("users", sa.Column("email_verified_at", sa.DateTime(), nullable=True))

    tables = [
        Base.metadata.tables[name]
        for name in (
            "resume_improvements", "cover_letters", "interview_sessions", "reminders",
            "portfolios", "portfolio_projects", "linkedin_profiles", "auth_tokens",
            "analytics_events", "job_alerts",
        )
        if name not in inspector.get_table_names()
    ]
    if tables:
        Base.metadata.create_all(bind=bind, tables=tables, checkfirst=True)


def downgrade() -> None:
    pass
