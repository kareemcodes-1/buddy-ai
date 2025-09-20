from bson import ObjectId
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGO_URI)

db = client["ai_assistant"] 


class PyObjectId(ObjectId):
    """Custom ObjectId type that works with Pydantic v2."""

    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        source_type,                # the annotated type (PyObjectId)
        handler: GetCoreSchemaHandler,
    ):
        # Tell Pydantic how to validate & serialize this type
        return core_schema.no_info_wrap_validator_function(
            cls._validate,
            core_schema.str_schema(),
            serialization=core_schema.plain_serializer_function_ser_schema(str),
        )

    @classmethod
    def _validate(cls, v):
        """Convert incoming value → ObjectId (or raise)."""
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

