import unittest
import requests
import json
from pathlib import Path
import io

class MLBackendTests(unittest.TestCase):
    def setUp(self):
        self.base_url = "https://fine-tune-qe34.onrender.com/api/v1"
        self.test_user = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        self.token = self._get_token()
        self.headers = {
            "Authorization": f"Bearer {self.token}"
        }

    def _get_token(self):
        response = requests.post(
            f"{self.base_url}/auth/login",
            data={"username": self.test_user["email"], "password": self.test_user["password"]}
        )
        return response.json()["access_token"]

    def test_auth_flow(self):
        # Test registration
        register_data = {
            "email": "newuser@example.com",
            "password": "newpassword123"
        }
        response = requests.post(f"{self.base_url}/auth/register", json=register_data)
        self.assertEqual(response.status_code, 200)

        # Test login
        login_response = requests.post(
            f"{self.base_url}/auth/login",
            data={"username": register_data["email"], "password": register_data["password"]}
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertIn("access_token", login_response.json())

    def test_dataset_operations(self):
        # Test dataset upload
        test_csv = io.StringIO("col1,col2\n1,2\n3,4")
        files = {
            'file': ('test.csv', test_csv, 'text/csv'),
            'dataset_info': (None, json.dumps({
                "name": "test_dataset",
                "description": "Test dataset description"
            }), 'application/json')
        }
        upload_response = requests.post(
            f"{self.base_url}/datasets/upload",
            headers=self.headers,
            files=files
        )
        self.assertEqual(upload_response.status_code, 200)
        dataset_id = upload_response.json()["id"]

        # Test dataset listing
        list_response = requests.get(
            f"{self.base_url}/datasets/list",
            headers=self.headers
        )
        self.assertEqual(list_response.status_code, 200)
        self.assertTrue(any(d["id"] == dataset_id for d in list_response.json()))

    def test_model_operations(self):
        # Test model creation
        model_data = {
            "name": "test_model",
            "description": "Test model description",
            "framework": "pytorch",
            "architecture": "transformer",
            "version": "1.0.0",
            "config": {
                "model_config": {"hidden_size": 768},
                "training_config": {"batch_size": 32}
            },
            "hyperparameters": {
                "learning_rate": 1e-4,
                "epochs": 3
            }
        }
        create_response = requests.post(
            f"{self.base_url}/models/create",
            headers=self.headers,
            json=model_data
        )
        self.assertEqual(create_response.status_code, 200)
        model_id = create_response.json()["id"]

        # Test model listing
        list_response = requests.get(
            f"{self.base_url}/models/list",
            headers=self.headers
        )
        self.assertEqual(list_response.status_code, 200)
        self.assertTrue(any(m["id"] == model_id for m in list_response.json()))

    def test_training_workflow(self):
        # Create model and dataset first
        model_id = self._create_test_model()
        dataset_id = self._upload_test_dataset()

        # Test training job creation
        training_data = {
            "model_id": model_id,
            "dataset_id": dataset_id,
            "hyperparameters": {
                "learning_rate": 1e-4,
                "epochs": 3
            }
        }
        start_response = requests.post(
            f"{self.base_url}/training/start",
            headers=self.headers,
            json=training_data
        )
        self.assertEqual(start_response.status_code, 200)
        training_id = start_response.json()["id"]

        # Test training status check
        status_response = requests.get(
            f"{self.base_url}/training/{training_id}/status",
            headers=self.headers
        )
        self.assertEqual(status_response.status_code, 200)
        self.assertIn(status_response.json()["status"], ["queued", "running", "completed", "failed"])

    def test_model_evaluation(self):
        model_id = self._create_test_model()
        dataset_id = self._upload_test_dataset()

        # Test evaluation creation
        eval_data = {
            "dataset_id": dataset_id
        }
        eval_response = requests.post(
            f"{self.base_url}/evaluations/{model_id}/evaluate",
            headers=self.headers,
            json=eval_data
        )
        self.assertEqual(eval_response.status_code, 200)
        eval_id = eval_response.json()["id"]

        # Test evaluation retrieval
        get_eval_response = requests.get(
            f"{self.base_url}/evaluations/{eval_id}",
            headers=self.headers
        )
        self.assertEqual(get_eval_response.status_code, 200)

    def _create_test_model(self):
        model_data = {
            "name": "test_model",
            "framework": "pytorch",
            "architecture": "transformer",
            "version": "1.0.0",
            "config": {"model_config": {}, "training_config": {}}
        }
        response = requests.post(
            f"{self.base_url}/models/create",
            headers=self.headers,
            json=model_data
        )
        return response.json()["id"]

    def _upload_test_dataset(self):
        test_csv = io.StringIO("col1,col2\n1,2\n3,4")
        files = {
            'file': ('test.csv', test_csv, 'text/csv'),
            'dataset_info': (None, json.dumps({
                "name": "test_dataset"
            }), 'application/json')
        }
        response = requests.post(
            f"{self.base_url}/datasets/upload",
            headers=self.headers,
            files=files
        )
        return response.json()["id"]

if __name__ == '__main__':
    unittest.main()