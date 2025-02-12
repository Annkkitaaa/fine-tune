import unittest
import requests

class AuthDebugTest(unittest.TestCase):
    def setUp(self):
        self.base_url = "https://fine-tune-qe34.onrender.com"
        
    def test_login_debug(self):
        login_data = {
            "username": "test@example.com",
            "password": "testpassword123"
        }
        
        response = requests.post(
            f"{self.base_url}/auth/login",
            data=login_data
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        print(f"Response Text: {response.text}")
        
        # Test if server is running
        try:
            response = requests.get(f"{self.base_url}/health")
            print(f"\nHealth Check Status: {response.status_code}")
        except requests.exceptions.ConnectionError:
            print("\nServer appears to be down or unreachable")

if __name__ == '__main__':
    unittest.main()