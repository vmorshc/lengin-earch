import sqlalchemy as sa

metadata = sa.MetaData()


class GeographyPoint(sa.types.UserDefinedType):
    """Represents extensions.geography(POINT, 4326)."""

    cache_ok = True

    def get_col_spec(self, **kw: object) -> str:
        return "geography(POINT, 4326)"


PlacesTable = sa.Table(
    "places",
    metadata,
    sa.Column("id", sa.BigInteger, sa.Identity(), primary_key=True),
    sa.Column("description", sa.String(length=200), nullable=False),
    sa.Column("location", GeographyPoint(), nullable=False),
    sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    ),
    sa.Column(
        "updated_at",
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    ),
)
