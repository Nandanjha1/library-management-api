from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_member_profile_without_token():
    response = client.get("/members/me")
    assert response.status_code in (401, 403)

def test_member_loans_without_token():
    response = client.get("/members/me/loans")
    assert response.status_code in (401, 403)

def test_member_fines_without_token():
    response = client.get("/fines/me")
    assert response.status_code in (401, 403)
