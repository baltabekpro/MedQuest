from pydantic import BaseModel


class DashboardActivityPoint(BaseModel):
    date: str  # YYYY-MM-DD
    day: str
    value: int


class DashboardWeeklyActivity(BaseModel):
    days: int
    points: list[DashboardActivityPoint]


class DashboardStats(BaseModel):
    total_patients: int
    total_requests: int
    requests_new: int
    requests_in_progress: int
    requests_closed: int
    requests_closed_today: int
