"""
Test ML endpoints with actual backend
"""
import requests
import json

BASE_URL = "http://localhost:5001"

def test_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✓ Backend is running: {response.json()}")
        return True
    except Exception as e:
        print(f"✗ Backend not running: {e}")
        return False

def test_train_endpoint():
    """Test train model endpoint (will fail without auth, but shows if route exists)"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/platforms/instagram/ml/train-model/test-connection-id"
        )
        print(f"\nTrain endpoint response:")
        print(f"  Status: {response.status_code}")
        print(f"  Body: {response.text[:200]}")
        
        if response.status_code == 401:
            print("  ✓ Endpoint exists (401 = needs authentication)")
            return True
        elif response.status_code == 404:
            print("  ✗ Endpoint not found!")
            return False
        else:
            print(f"  ? Unexpected status: {response.status_code}")
            return True
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def test_predict_endpoint():
    """Test predict endpoint (will fail without auth, but shows if route exists)"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/platforms/instagram/ml/predict-engagement/test-connection-id",
            json={"post": {"media_type": "IMAGE", "caption": "Test"}}
        )
        print(f"\nPredict endpoint response:")
        print(f"  Status: {response.status_code}")
        print(f"  Body: {response.text[:200]}")
        
        if response.status_code == 401:
            print("  ✓ Endpoint exists (401 = needs authentication)")
            return True
        elif response.status_code == 404:
            print("  ✗ Endpoint not found!")
            return False
        else:
            print(f"  ? Unexpected status: {response.status_code}")
            return True
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

if __name__ == '__main__':
    print("="*60)
    print("TESTING ML ENDPOINTS")
    print("="*60)
    
    if test_health():
        test_train_endpoint()
        test_predict_endpoint()
    else:
        print("\n⚠️  Backend is not running!")
        print("Start backend with: python run.py")
