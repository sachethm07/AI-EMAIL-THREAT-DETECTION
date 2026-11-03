from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class Register(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=8, max_length=72)
    role: Literal["viewer", "analyst"] = "analyst"


class Login(BaseModel):
    email: EmailStr
    password: str = Field(max_length=72)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class RoleUpdate(BaseModel):
    role: Literal["viewer", "analyst", "admin"]


class AnalyzeRequest(BaseModel):
    raw_email: str = Field(min_length=20, max_length=5_000_000)


class IocIn(BaseModel):
    type: Literal["ip", "domain", "url", "email", "hash"]
    value: str = Field(min_length=1, max_length=2000)
    severity: Literal["low", "medium", "high"] = "high"
    source: str = Field(default="manual", max_length=80)
