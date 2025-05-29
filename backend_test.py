import requests
import json
import unittest
import os
import time
import random
import string

# Get the backend URL from environment or use default
BACKEND_URL = "https://779b9a7e-4e74-4084-8a46-12e156a6425b.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

# Test data
TEST_USERNAME = f"testuser_{random.randint(1000, 9999)}"
TEST_EMAIL = f"test_{random.randint(1000, 9999)}@example.com"
TEST_PASSWORD = "testpassword123"
ADMIN_EMAIL = "admin@pjeseza.com"
ADMIN_PASSWORD = "admin123"
YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Astley - Never Gonna Give You Up

class PjesezaBackendTests(unittest.TestCase):
    def setUp(self):
        self.user_token = None
        self.admin_token = None
        self.clip_id = None
        
    def test_01_register_user(self):
        """Test user registration"""
        print("\n=== Testing User Registration ===")
        
        payload = {
            "username": TEST_USERNAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "language_preference": "en"
        }
        
        response = requests.post(f"{API_URL}/auth/register", json=payload)
        data = response.json()
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["username"], TEST_USERNAME)
        self.assertEqual(data["user"]["email"], TEST_EMAIL)
        
        # Save token for later tests
        self.user_token = data["access_token"]
        
    def test_02_login_user(self):
        """Test user login"""
        print("\n=== Testing User Login ===")
        
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=payload)
        data = response.json()
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], TEST_EMAIL)
        
        # Update token
        self.user_token = data["access_token"]
        
    def test_03_login_admin(self):
        """Test admin login with default credentials"""
        print("\n=== Testing Admin Login ===")
        
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=payload)
        data = response.json()
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], ADMIN_EMAIL)
        self.assertEqual(data["user"]["role"], "admin")
        
        # Save admin token
        self.admin_token = data["access_token"]
        
    def test_04_get_current_user(self):
        """Test getting current user info (protected route)"""
        print("\n=== Testing Get Current User ===")
        
        if not self.user_token:
            self.skipTest("User token not available")
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        data = response.json()
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["email"], TEST_EMAIL)
        self.assertEqual(data["username"], TEST_USERNAME)
        
    def test_05_youtube_video_info(self):
        """Test getting YouTube video info"""
        print("\n=== Testing YouTube Video Info ===")
        
        if not self.user_token:
            self.skipTest("User token not available")
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        payload = {"url": YOUTUBE_URL}
        
        response = requests.post(f"{API_URL}/video/info", json=payload, headers=headers)
        data = response.json()
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertIn("video_info", data)
        self.assertIn("title", data["video_info"])
        self.assertIn("duration", data["video_info"])
        
    def test_06_create_video_clip(self):
        """Test creating a video clip"""
        print("\n=== Testing Create Video Clip ===")
        
        if not self.user_token:
            self.skipTest("User token not available")
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        payload = {
            "youtube_url": YOUTUBE_URL,
            "start_time": 0,
            "end_time": 10,
            "clip_name": f"Test Clip {random.randint(1000, 9999)}"
        }
        
        response = requests.post(f"{API_URL}/video/clip", json=payload, headers=headers)
        data = response.json()
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertIn("clip_id", data)
        self.assertIn("clip", data)
        
        # Save clip ID for later tests
        self.clip_id = data["clip_id"]
        
    def test_07_get_user_clips(self):
        """Test getting user's clips"""
        print("\n=== Testing Get User Clips ===")
        
        if not self.user_token:
            self.skipTest("User token not available")
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        response = requests.get(f"{API_URL}/video/clips", headers=headers)
        data = response.json()
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("clips", data)
        self.assertIsInstance(data["clips"], list)
        
        # Verify our clip is in the list
        if self.clip_id:
            clip_found = False
            for clip in data["clips"]:
                if clip["id"] == self.clip_id:
                    clip_found = True
                    break
            self.assertTrue(clip_found, "Created clip not found in user's clips")
        
    def test_08_admin_get_users(self):
        """Test admin endpoint to get all users"""
        print("\n=== Testing Admin Get Users ===")
        
        if not self.admin_token:
            self.skipTest("Admin token not available")
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response = requests.get(f"{API_URL}/admin/users", headers=headers)
        data = response.json()
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("users", data)
        self.assertIsInstance(data["users"], list)
        
        # Verify our test user is in the list
        user_found = False
        for user in data["users"]:
            if user["email"] == TEST_EMAIL:
                user_found = True
                break
        self.assertTrue(user_found, "Test user not found in admin users list")
        
    def test_09_admin_get_stats(self):
        """Test admin endpoint to get platform statistics"""
        print("\n=== Testing Admin Get Stats ===")
        
        if not self.admin_token:
            self.skipTest("Admin token not available")
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response = requests.get(f"{API_URL}/admin/stats", headers=headers)
        data = response.json()
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("total_users", data)
        self.assertIn("total_clips", data)
        self.assertIn("total_videos", data)
        self.assertIn("active_users", data)
        
    def test_10_ai_auto_caption(self):
        """Test AI auto-caption feature"""
        print("\n=== Testing AI Auto-Caption ===")
        
        if not self.user_token:
            self.skipTest("User token not available")
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        payload = {"video_id": self.clip_id or "dummy_id"}
        
        response = requests.post(f"{API_URL}/ai/auto-caption", json=payload, headers=headers)
        data = response.json()
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertIn("captions", data)
        self.assertIn("languages_available", data)
        
    def test_11_ai_generate_script(self):
        """Test AI script generation feature"""
        print("\n=== Testing AI Script Generation ===")
        
        if not self.user_token:
            self.skipTest("User token not available")
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        payload = {
            "topic": "Video editing tips",
            "language": "en"
        }
        
        response = requests.post(f"{API_URL}/ai/generate-script", json=payload, headers=headers)
        data = response.json()
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {json.dumps(data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertIn("script", data)
        self.assertIn("word_count", data)
        
    def test_12_unauthorized_access(self):
        """Test unauthorized access to protected routes"""
        print("\n=== Testing Unauthorized Access ===")
        
        # Try to access protected route without token
        response = requests.get(f"{API_URL}/auth/me")
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.json() if response.text else 'No response data'}")
        
        self.assertIn(response.status_code, [401, 403, 422])  # Different frameworks handle this differently
        
        # Try to access admin route with user token
        if self.user_token:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = requests.get(f"{API_URL}/admin/users", headers=headers)
            
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.json() if response.text else 'No response data'}")
            
            self.assertIn(response.status_code, [401, 403])

if __name__ == "__main__":
    # Run tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)