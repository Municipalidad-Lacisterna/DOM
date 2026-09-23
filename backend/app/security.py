"""
Seguridad — DOM en Línea Municipal
Hashing de contraseñas (PBKDF2, stdlib) y tokens JWT (HS256, PyJWT).
"""

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

SECRET_KEY = os.getenv("SECRET_KEY", "dom-secret-dev-change-me")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HORAS = 8
_ITERACIONES = 200_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt), _ITERACIONES
    ).hex()
    return f"pbkdf2${_ITERACIONES}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iteraciones, salt, digest = stored.split("$", 3)
        calc = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt), int(iteraciones)
        ).hex()
        return secrets.compare_digest(calc, digest)
    except (ValueError, TypeError):
        return False


def create_token(funcionario_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HORAS)
    payload = {"sub": str(funcionario_id), "exp": exp}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decodifica y valida un JWT; lanza jwt.PyJWTError si es inválido o expiró."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])