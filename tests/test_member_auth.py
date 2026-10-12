from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_member_profile_requires_authentication():
    response = client.get("/members/me")
    assert response.status_code == 401

def test_member_profile_rejects_invalid_token():
    response = client.get(
        "/members/me",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401
