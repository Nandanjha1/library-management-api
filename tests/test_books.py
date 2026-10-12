from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_books():
    response = client.get("/books")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)

def test_search_books():
    response = client.get("/books", params={"search": "Clean"})
    assert response.status_code == 200
    data = response.json()
    assert any(
        "clean" in book["title"].lower()
        for book in data["items"]
    )

def test_book_details():
    response = client.get("/books/1")
    assert response.status_code == 200
    data = response.json()
    assert data["book_id"] == 1
    assert "authors" in data
    assert "branch_availability" in data

def test_missing_book():
    response = client.get("/books/99999")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "BOOK_NOT_FOUND"

def test_invalid_pagination():
    response = client.get("/books", params={"limit": 0})
    assert response.status_code == 422

def test_book_not_found():
    response = client.get("/books/999999")
    assert response.status_code == 404

def test_book_pagination():
    response = client.get("/books?limit=2&offset=0")
    assert response.status_code == 200
    assert len(response.json()["items"]) <= 2
    