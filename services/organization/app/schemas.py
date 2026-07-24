from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OrganizationRole(str, Enum):
    owner = "owner"
    admin = "admin"
    member = "member"
    viewer = "viewer"


class OrganizationStatus(str, Enum):
    active = "active"
    suspended = "suspended"
    archived = "archived"


class OrganizationBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    slug: str
    description: str | None = None
    status: OrganizationStatus = OrganizationStatus.active


class Organization(OrganizationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


class CreateOrganizationInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)


class UpdateOrganizationInput(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    status: OrganizationStatus | None = None


class OrganizationMember(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    user_id: UUID
    email: str
    role: OrganizationRole
    created_at: datetime
    updated_at: datetime


class InviteMemberInput(BaseModel):
    user_id: UUID
    email: EmailStr
    role: OrganizationRole = OrganizationRole.member


class UpdateMemberRoleInput(BaseModel):
    role: OrganizationRole


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    data: list
    total: int
    page: int
    page_size: int
