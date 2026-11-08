from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class CustomerPredictionInput(BaseModel):
    age: int = Field(..., ge=18, le=100, description="Customer age in years")
    job: str = Field(..., description="Occupation category")
    marital: str = Field(..., description="Marital status (married, single, divorced)")
    education: str = Field(..., description="Education level (primary, secondary, tertiary, unknown)")
    default: str = Field(..., description="Has credit in default? (yes, no)")
    balance: float = Field(..., description="Average yearly account balance in EUR")
    housing: str = Field(..., description="Has housing mortgage loan? (yes, no)")
    loan: str = Field(..., description="Has personal loan? (yes, no)")
    contact: str = Field(..., description="Contact communication type (cellular, telephone, unknown)")
    day: int = Field(..., ge=1, le=31, description="Last contact day of the month")
    month: str = Field(..., description="Last contact month of year (jan..dec)")
    duration: int = Field(180, ge=0, description="Last contact duration in seconds (excluded in pre-call mode)")
    campaign: int = Field(..., ge=1, description="Number of contacts performed during this campaign")
    pdays: int = Field(..., ge=-1, description="Days passed after client was last contacted (-1 means not previously contacted)")
    previous: int = Field(..., ge=0, description="Number of contacts performed before this campaign")
    poutcome: str = Field(..., description="Outcome of the previous marketing campaign")
    modelMode: Optional[str] = Field("pre_call", description="pre_call (leakage-free) or post_call")
    selectedModelId: Optional[str] = Field(None, description="Optional specific model ID")


class FeatureContributionOut(BaseModel):
    feature: str
    value: Any
    impact: float
    direction: str
    explanation: str


class PredictionResponse(BaseModel):
    id: Optional[int]
    prediction: str
    label: str
    probability: float
    confidenceTier: str
    modelName: str
    modelMode: str
    topContributions: List[FeatureContributionOut]
    recommendedAction: Dict[str, str]
    createdAt: str


class RegisterInput(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: str = Field(...)
    phone_number: Optional[str] = None
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


class LoginInput(BaseModel):
    email: str
    password: str
    rememberMe: Optional[bool] = False


class ForgotPasswordInput(BaseModel):
    email: str


class ResetPasswordInput(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


class ProfileUpdateInput(BaseModel):
    full_name: str = Field(..., min_length=2)
    phone_number: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    fullName: str
    email: str
    role: str
    phoneNumber: Optional[str]
    createdAt: str
    updatedAt: Optional[str] = None

