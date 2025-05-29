import requests
import json
import unittest
import os
import random
import string

# Get the backend URL from environment or use default
BACKEND_URL = "https://779b9a7e-4e74-4084-8a46-12e156a6425b.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

class PjesezaBasicBackendTests(unittest.TestCase):
    def test_01_root_endpoint(self):
        """Test the root API endpoint"""
        print("\n=== Testing Root API Endpoint ===")
        
        response = requests.get(f"{API_URL}/")
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(response.json(), indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Hello World"})
        
    def test_02_create_status_check(self):
        """Test creating a status check"""
        print("\n=== Testing Create Status Check ===")
        
        client_name = f"test_client_{random.randint(1000, 9999)}"
        payload = {"client_name": client_name}
        
        response = requests.post(f"{API_URL}/status", json=payload)
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(response.json(), indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["client_name"], client_name)
        self.assertIn("id", response.json())
        self.assertIn("timestamp", response.json())
        
    def test_03_get_status_checks(self):
        """Test getting status checks"""
        print("\n=== Testing Get Status Checks ===")
        
        response = requests.get(f"{API_URL}/status")
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(response.json(), indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        
if __name__ == "__main__":
    # Run tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)