from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .db_models import OrganizationMemberORM, OrganizationORM, OrganizationRole, OrganizationStatus
from .schemas import (
    CreateOrganizationInput,
    InviteMemberInput,
    Organization,
    OrganizationMember,
    UpdateMemberRoleInput,
    UpdateOrganizationInput,
)


class OrganizationRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_organizations(self, page: int = 1, page_size: int = 20) -> tuple[list[Organization], int]:
        offset = (page - 1) * page_size
        total = self._db.scalar(select(func.count(OrganizationORM.id))) or 0
        stmt = (
            select(OrganizationORM)
            .order_by(OrganizationORM.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        rows = self._db.execute(stmt).scalars().all()
        return [Organization.model_validate(row) for row in rows], total

    def get_organization(self, org_id: UUID) -> Organization | None:
        row = self._db.get(OrganizationORM, org_id)
        if row is None:
            return None
        return Organization.model_validate(row)

    def create_organization(self, input_data: CreateOrganizationInput) -> Organization:
        row = OrganizationORM(
            name=input_data.name,
            slug=input_data.slug,
            description=input_data.description,
            status=OrganizationStatus.active,
        )
        self._db.add(row)
        try:
            self._db.commit()
        except IntegrityError:
            self._db.rollback()
            raise
        self._db.refresh(row)
        return Organization.model_validate(row)

    def update_organization(
        self, org_id: UUID, input_data: UpdateOrganizationInput
    ) -> Organization | None:
        row = self._db.get(OrganizationORM, org_id)
        if row is None:
            return None
        if input_data.name is not None:
            row.name = input_data.name
        if input_data.description is not None:
            row.description = input_data.description
        if input_data.status is not None:
            row.status = input_data.status
        self._db.commit()
        self._db.refresh(row)
        return Organization.model_validate(row)

    def delete_organization(self, org_id: UUID) -> bool:
        row = self._db.get(OrganizationORM, org_id)
        if row is None:
            return False
        self._db.delete(row)
        self._db.commit()
        return True

    def list_members(
        self, org_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[OrganizationMember], int]:
        offset = (page - 1) * page_size
        total = (
            self._db.scalar(
                select(func.count(OrganizationMemberORM.id)).where(
                    OrganizationMemberORM.organization_id == org_id
                )
            )
            or 0
        )
        stmt = (
            select(OrganizationMemberORM)
            .where(OrganizationMemberORM.organization_id == org_id)
            .order_by(OrganizationMemberORM.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        rows = self._db.execute(stmt).scalars().all()
        return [OrganizationMember.model_validate(row) for row in rows], total

    def add_member(self, org_id: UUID, input_data: InviteMemberInput) -> OrganizationMember:
        row = OrganizationMemberORM(
            organization_id=org_id,
            user_id=input_data.user_id,
            email=input_data.email,
            role=input_data.role,
        )
        self._db.add(row)
        self._db.commit()
        self._db.refresh(row)
        return OrganizationMember.model_validate(row)

    def update_member_role(
        self, org_id: UUID, member_id: UUID, role: OrganizationRole
    ) -> OrganizationMember | None:
        row = self._db.get(OrganizationMemberORM, member_id)
        if row is None or row.organization_id != org_id:
            return None
        row.role = role
        self._db.commit()
        self._db.refresh(row)
        return OrganizationMember.model_validate(row)

    def remove_member(self, org_id: UUID, member_id: UUID) -> bool:
        row = self._db.get(OrganizationMemberORM, member_id)
        if row is None or row.organization_id != org_id:
            return False
        self._db.delete(row)
        self._db.commit()
        return True
