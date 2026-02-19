from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_patients: int
    total_requests: int
    requests_new: int
    requests_in_progress: int
    requests_closed: int
    requests_closed_today: int
