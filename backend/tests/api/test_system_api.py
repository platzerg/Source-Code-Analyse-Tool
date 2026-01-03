"""
Tests for System API endpoints (health, products, stats)
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# --- Health Check Tests ---

def test_health_check():
    """Test GET /api/v1/health endpoint"""
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "ok"
    assert "service" in data


# --- Products Tests ---

def test_get_products():
    """Test GET /api/v1/products endpoint"""
    response = client.get("/api/v1/products")

    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) > 0

    # Validate product structure
    first_product = products[0]
    assert "id" in first_product
    assert "name" in first_product
    assert "price" in first_product
    assert "category" in first_product
    assert "stock" in first_product


def test_get_products_mock_data():
    """Test that products endpoint returns expected mock data"""
    response = client.get("/api/v1/products")

    assert response.status_code == 200
    products = response.json()

    # Should have Laptop Pro
    laptop = next((p for p in products if p["name"] == "Laptop Pro"), None)
    assert laptop is not None
    assert laptop["category"] == "Electronics"
    assert laptop["price"] == 1299.99


# --- Stats Tests ---

def test_get_stats():
    """Test GET /api/v1/stats endpoint"""
    response = client.get("/api/v1/stats")

    assert response.status_code == 200
    stats = response.json()

    # Validate stats structure
    assert "total_products" in stats
    assert "total_value" in stats
    assert "active_categories" in stats

    # Validate types
    assert isinstance(stats["total_products"], int)
    assert isinstance(stats["total_value"], (int, float))
    assert isinstance(stats["active_categories"], int)


def test_get_stats_calculations():
    """Test that stats calculations are correct"""
    response = client.get("/api/v1/stats")

    assert response.status_code == 200
    stats = response.json()

    # Should have 4 mock products
    assert stats["total_products"] == 4

    # Should have multiple categories
    assert stats["active_categories"] > 0

    # Total value should be positive
    assert stats["total_value"] > 0
