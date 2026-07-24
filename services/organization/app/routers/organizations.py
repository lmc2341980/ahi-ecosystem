from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .database import get_db
from .repository import OrganizationRepository
from .schemas import (
    CreateOrganizationInput,
    InviteMemberInput,
    Organization,
    OrganizationMember,
    OrganizationRole,
    PaginatedResponse,
    UpdateMemberRoleInput,
    UpdateOrganizationInput,
)

router = APIRouter(prefix="/api/v1/organizations", tags=["organizations"])


def _get_repo(db: Session = Depends(get_db)) -> OrganizationRepository:
    return OrganizationRepository(db)


@router.get("", response_model=PaginatedResponse)
def list_organizations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    repo: OrganizationRepository = Depends(_get_repo),
) -> dict:
    items, total = repo.list_organizations(page=page, page_size=page_size)
    return {"data": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{org_id}", response_model=Organization)
def get_organization(org_id: UUID, repo: OrganizationRepository = Depends(_get_repo)) -> Organization:
    org = repo.get_organization(org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org


@router.post("", response_model=Organization, status_code=status.HTTP_201_CREATED)
def create_organization(
    input_data: CreateOrganizationInput,
    repo: OrganizationRepository = Depends(_get_repo),
) -> Organization:
    try:
        return repo.create_organization(input_data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization with this slug already exists",
        )


@router.patch("/{org_id}", response_model=Organization)
def update_organization(
    org_id: UUID,
    input_data: UpdateOrganizationInput,
    repo: OrganizationRepository = Depends(_get_repo),
) -> Organization:
    org = repo.update_organization(org_id, input_data)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(
    org_id: UUID, repo: OrganizationRepository = Depends(_get_repo)
) -> None:
    if not repo.delete_organization(org_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")


@router.get("/{org_id}/members", response_model=PaginatedResponse)
def list_members(
    org_id: UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    repo: OrganizationRepository = Depends(_get_repo),
) -> dict:
    items, total = repo.list_members(org_id, page=page, page_size=page_size)
    return {"data": items, "total": total, "page": page, "page_size": page_size}


@router.post("/{org_id}/members", response_model=OrganizationMember, status_code=status.HTTP_201_CREATED)
def invite_member(
    org_id: UUID,
    input_data: InviteMemberInput,
    repo: OrganizationRepository = Depends(_get_repo),
) -> OrganizationMember:
    if repo.get_organization(org_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return repo.add_member(org_id, input_data)


@router.patch("/{org_id}/members/{member_id}", response_model=OrganizationMember)
def update_member_role(
    org_id: UUID,
    member_id: UUID,
    input_data: UpdateMemberRoleInput,
    repo: OrganizationRepository = Depends(_get_repo),
) -> OrganizationMember:
    member = repo.update_member_role(org_id, member_id, input_data.role)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return member


@router.delete("/{org_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    org_id: UUID,
    member_id: UUID,
    repo: OrganizationRepository = Depends(_get_repo),
) -> None:
    if not repo.remove_member(org_id, member_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
