"""Add salary, certification, resume version, and application fields."""
from alembic import op
import sqlalchemy as sa

revision = "20261113_02"
down_revision = "20261113_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    tables = set(inspector.get_table_names())
    if "jobs" in tables:
        columns = {column["name"] for column in inspector.get_columns("jobs")}
        for name, column in (
            ("salary_min", sa.Integer()),
            ("salary_max", sa.Integer()),
            ("salary_currency", sa.String(10)),
            ("salary_period", sa.String(20)),
            ("preferred_certifications", sa.JSON()),
        ):
            if name not in columns:
                op.add_column("jobs", sa.Column(name, column))


def downgrade() -> None:
    pass
