"""add daily tracker and access overrides

Revision ID: 5e6f7a8b9c0d
Revises: 1001736c2ef5
Create Date: 2026-08-18 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5e6f7a8b9c0d'
down_revision = '1001736c2ef5'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add tracker_access_status to users
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tracker_access_status', sa.String(length=20), server_default='ACTIVE', nullable=False))

    # 2. Create daily_trackers table
    op.create_table('daily_trackers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='draft', nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'date', name='uq_tracker_user_date')
    )

    # 3. Add tracker_id to daily_updates
    with op.batch_alter_table('daily_updates', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tracker_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_daily_updates_tracker_id', 'daily_trackers', ['tracker_id'], ['id'], ondelete='CASCADE')

    # 4. Create tracker_access_overrides table
    op.create_table('tracker_access_overrides',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('intern_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('enabled_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('effective_from', sa.Date(), nullable=False),
        sa.Column('effective_until', sa.Date(), nullable=True),
        sa.Column('target_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['enabled_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['intern_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Create session_concepts table
    op.create_table('session_concepts',
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('concept_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['concept_id'], ['training_concepts.id'], ),
        sa.ForeignKeyConstraint(['session_id'], ['training_sessions.id'], ),
        sa.PrimaryKeyConstraint('session_id', 'concept_id')
    )


def downgrade():
    op.drop_table('session_concepts')
    op.drop_table('tracker_access_overrides')
    with op.batch_alter_table('daily_updates', schema=None) as batch_op:
        batch_op.drop_constraint('fk_daily_updates_tracker_id', type_='foreignkey')
        batch_op.drop_column('tracker_id')
    op.drop_table('daily_trackers')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('tracker_access_status')
