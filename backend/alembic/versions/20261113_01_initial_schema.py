"""Create current career platform schema.

Revision ID: 20261113_01
"""
from alembic import op
import sqlalchemy as sa

revision = "20261113_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())
    if "users" not in existing:
        from backend.core.models import Base
        Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    # The initial migration is intentionally non-destructive.
    pass
