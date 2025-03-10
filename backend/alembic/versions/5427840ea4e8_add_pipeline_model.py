"""add pipeline model

Revision ID: 5427840ea4e8
Revises: 5ff762403b24
Create Date: 2025-02-15 02:23:19.872590

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5427840ea4e8'
down_revision: Union[str, None] = '5ff762403b24'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('pipelines',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('pipeline_id', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('config', sa.JSON(), nullable=False),
    sa.Column('results', sa.JSON(), nullable=True),
    sa.Column('error_message', sa.String(), nullable=True),
    sa.Column('owner_id', sa.Integer(), nullable=False),
    sa.Column('dataset_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('start_time', sa.DateTime(timezone=True), nullable=True),
    sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
    sa.Column('execution_time', sa.Integer(), nullable=True),
    sa.Column('memory_usage', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('pipeline_id')
    )
    op.create_index(op.f('ix_pipelines_id'), 'pipelines', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_pipelines_id'), table_name='pipelines')
    op.drop_table('pipelines')
    # ### end Alembic commands ###
