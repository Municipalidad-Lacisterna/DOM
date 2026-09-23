from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    rut: str = Field(max_length=20)
    password: str = Field(min_length=1, max_length=128)


class FuncionarioOut(BaseModel):
    id: int
    rut: str
    departamento: str
    rol: str

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str = "funcionario"
    funcionario: FuncionarioOut