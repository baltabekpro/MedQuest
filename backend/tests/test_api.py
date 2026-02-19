import uuid

import pytest


async def login(async_client, email: str, password: str) -> dict:
    response = await async_client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    payload = response.json()
    assert "access_token" in payload
    assert "refresh_token" in payload
    return payload


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_health(async_client):
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_auth_rbac_filters_and_crud_flow(async_client):
    admin_tokens = await login(async_client, "admin@medquest.kz", "admin123")
    admin_access = admin_tokens["access_token"]

    me = await async_client.get("/auth/me", headers=auth_headers(admin_access))
    assert me.status_code == 200
    assert me.json()["role"] == "admin"

    suffix = uuid.uuid4().hex[:8]
    doctor_email = f"doctor.{suffix}@medquest.kz"
    registrar_email = f"registrar.{suffix}@medquest.kz"

    doctor_resp = await async_client.post(
        "/users",
        headers=auth_headers(admin_access),
        json={
            "email": doctor_email,
            "full_name": "Doctor Test",
            "role": "doctor",
            "password": "doc12345",
        },
    )
    assert doctor_resp.status_code == 201
    doctor_id = doctor_resp.json()["id"]

    registrar_resp = await async_client.post(
        "/users",
        headers=auth_headers(admin_access),
        json={
            "email": registrar_email,
            "full_name": "Registrar Test",
            "role": "registrar",
            "password": "reg12345",
        },
    )
    assert registrar_resp.status_code == 201
    registrar_id = registrar_resp.json()["id"]

    get_user = await async_client.get(f"/users/{registrar_id}", headers=auth_headers(admin_access))
    assert get_user.status_code == 200
    assert get_user.json()["email"] == registrar_email

    users_page = await async_client.get(
        "/users",
        headers=auth_headers(admin_access),
        params={"page": 1, "limit": 20, "search": "Registrar", "role": "registrar"},
    )
    assert users_page.status_code == 200
    users_payload = users_page.json()
    assert "items" in users_payload and "total" in users_payload
    assert users_payload["page"] == 1 and users_payload["limit"] == 20

    registrar_tokens = await login(async_client, registrar_email, "reg12345")
    registrar_access = registrar_tokens["access_token"]
    registrar_refresh = registrar_tokens["refresh_token"]

    users_for_registrar = await async_client.get("/users", headers=auth_headers(registrar_access))
    assert users_for_registrar.status_code == 403

    update_me = await async_client.patch(
        "/auth/me",
        headers=auth_headers(registrar_access),
        json={"full_name": "Registrar Updated"},
    )
    assert update_me.status_code == 200
    assert update_me.json()["full_name"] == "Registrar Updated"

    bad_password_change = await async_client.post(
        "/auth/change-password",
        headers=auth_headers(registrar_access),
        json={"current_password": "wrong", "new_password": "newpass123"},
    )
    assert bad_password_change.status_code == 400

    good_password_change = await async_client.post(
        "/auth/change-password",
        headers=auth_headers(registrar_access),
        json={"current_password": "reg12345", "new_password": "reg123456"},
    )
    assert good_password_change.status_code == 200

    relogin_tokens = await login(async_client, registrar_email, "reg123456")
    registrar_access = relogin_tokens["access_token"]

    patient_create = await async_client.post(
        "/patients",
        headers=auth_headers(registrar_access),
        json={
            "full_name": "Иван Петров",
            "birth_date": "1990-01-01",
            "phone": "+77000000001",
            "email": "ivan.petrov@example.com",
            "address": "Алматы",
        },
    )
    assert patient_create.status_code == 201
    patient_id = patient_create.json()["id"]

    patient_search = await async_client.get(
        "/patients",
        headers=auth_headers(registrar_access),
        params={"search": "Иван", "page": 1, "limit": 20},
    )
    assert patient_search.status_code == 200
    patients_payload = patient_search.json()
    assert "items" in patients_payload and patients_payload["total"] >= 1

    request_create = await async_client.post(
        "/requests",
        headers=auth_headers(registrar_access),
        json={
            "patient_id": patient_id,
            "title": "Боль в спине",
            "description": "Острая боль 3 дня",
            "priority": 4,
        },
    )
    assert request_create.status_code == 201
    request_id = request_create.json()["id"]

    assign = await async_client.patch(
        f"/requests/{request_id}/assign",
        headers=auth_headers(registrar_access),
        json={"doctor_id": doctor_id},
    )
    assert assign.status_code == 200
    assert assign.json()["assigned_doctor_full_name"] == "Doctor Test"

    change_status = await async_client.patch(
        f"/requests/{request_id}/status",
        headers=auth_headers(registrar_access),
        json={"status": "closed"},
    )
    assert change_status.status_code == 200
    assert change_status.json()["status"] == "closed"

    requests_filtered = await async_client.get(
        "/requests",
        headers=auth_headers(registrar_access),
        params={
            "patient_id": patient_id,
            "priority": 4,
            "status": "closed",
            "search": "спине",
            "page": 1,
            "limit": 20,
        },
    )
    assert requests_filtered.status_code == 200
    requests_payload = requests_filtered.json()
    assert requests_payload["total"] >= 1
    assert requests_payload["items"][0]["patient_full_name"] == "Иван Петров"

    dashboard = await async_client.get("/dashboard/stats", headers=auth_headers(registrar_access))
    assert dashboard.status_code == 200
    assert "requests_closed_today" in dashboard.json()

    sessions = await async_client.get("/auth/sessions", headers=auth_headers(registrar_access))
    assert sessions.status_code == 200
    assert isinstance(sessions.json(), list)
    assert len(sessions.json()) >= 1

    logout = await async_client.post("/auth/logout", json={"refresh_token": registrar_refresh})
    assert logout.status_code == 200

    revoked_refresh = await async_client.post(
        "/auth/refresh",
        json={"refresh_token": registrar_refresh},
    )
    assert revoked_refresh.status_code == 401

    audit_for_registrar = await async_client.get("/audit/logs", headers=auth_headers(registrar_access))
    assert audit_for_registrar.status_code == 403

    audit_for_admin = await async_client.get(
        "/audit/logs",
        headers=auth_headers(admin_access),
        params={"action": "UPDATE", "search": "password_changed", "page": 1, "limit": 20},
    )
    assert audit_for_admin.status_code == 200
    audit_payload = audit_for_admin.json()
    assert "items" in audit_payload
    if audit_payload["items"]:
        assert "ip_address" in audit_payload["items"][0]
        assert "user_full_name" in audit_payload["items"][0]

    delete_request = await async_client.delete(f"/requests/{request_id}", headers=auth_headers(registrar_access))
    assert delete_request.status_code == 204

    delete_patient = await async_client.delete(f"/patients/{patient_id}", headers=auth_headers(registrar_access))
    assert delete_patient.status_code == 204
