import uuid


def login(client, email: str, password: str) -> str:
    response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    payload = response.json()
    assert "access_token" in payload
    return payload["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_auth_rbac_and_crud_flow(client):
    admin_token = login(client, "admin@medquest.kz", "admin123")

    me = client.get("/auth/me", headers=auth_headers(admin_token))
    assert me.status_code == 200
    assert me.json()["role"] == "admin"

    suffix = uuid.uuid4().hex[:8]
    doctor_email = f"doctor.{suffix}@medquest.kz"
    registrar_email = f"registrar.{suffix}@medquest.kz"

    doctor_resp = client.post(
        "/users",
        headers=auth_headers(admin_token),
        json={
            "email": doctor_email,
            "full_name": "Doctor Test",
            "role": "doctor",
            "password": "doc12345",
        },
    )
    assert doctor_resp.status_code == 201
    doctor_id = doctor_resp.json()["id"]

    registrar_resp = client.post(
        "/users",
        headers=auth_headers(admin_token),
        json={
            "email": registrar_email,
            "full_name": "Registrar Test",
            "role": "registrar",
            "password": "reg12345",
        },
    )
    assert registrar_resp.status_code == 201

    registrar_token = login(client, registrar_email, "reg12345")

    users_for_registrar = client.get("/users", headers=auth_headers(registrar_token))
    assert users_for_registrar.status_code == 403

    patient_create = client.post(
        "/patients",
        headers=auth_headers(registrar_token),
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

    patient_get = client.get(f"/patients/{patient_id}", headers=auth_headers(registrar_token))
    assert patient_get.status_code == 200

    patient_update = client.put(
        f"/patients/{patient_id}",
        headers=auth_headers(registrar_token),
        json={"phone": "+77000000002"},
    )
    assert patient_update.status_code == 200
    assert patient_update.json()["phone"] == "+77000000002"

    request_create = client.post(
        "/requests",
        headers=auth_headers(registrar_token),
        json={
            "patient_id": patient_id,
            "title": "Боль в спине",
            "description": "Острая боль 3 дня",
            "priority": 4,
        },
    )
    assert request_create.status_code == 201
    request_id = request_create.json()["id"]

    assign = client.patch(
        f"/requests/{request_id}/assign",
        headers=auth_headers(registrar_token),
        json={"doctor_id": doctor_id},
    )
    assert assign.status_code == 200

    change_status = client.patch(
        f"/requests/{request_id}/status",
        headers=auth_headers(registrar_token),
        json={"status": "in_progress"},
    )
    assert change_status.status_code == 200
    assert change_status.json()["status"] == "in_progress"

    request_get = client.get(f"/requests/{request_id}", headers=auth_headers(registrar_token))
    assert request_get.status_code == 200

    dashboard = client.get("/dashboard/stats", headers=auth_headers(registrar_token))
    assert dashboard.status_code == 200

    audit_for_registrar = client.get("/audit/logs", headers=auth_headers(registrar_token))
    assert audit_for_registrar.status_code == 403

    audit_for_admin = client.get("/audit/logs", headers=auth_headers(admin_token))
    assert audit_for_admin.status_code == 200

    delete_request = client.delete(f"/requests/{request_id}", headers=auth_headers(registrar_token))
    assert delete_request.status_code == 204

    get_deleted_request = client.get(f"/requests/{request_id}", headers=auth_headers(registrar_token))
    assert get_deleted_request.status_code == 404

    delete_patient = client.delete(f"/patients/{patient_id}", headers=auth_headers(registrar_token))
    assert delete_patient.status_code == 204

    get_deleted_patient = client.get(f"/patients/{patient_id}", headers=auth_headers(registrar_token))
    assert get_deleted_patient.status_code == 404
