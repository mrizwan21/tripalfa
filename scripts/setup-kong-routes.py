#!/usr/bin/env python3
"""
Kong Duffel Routes Configuration Script
Configures Kong with all Duffel API routes, plugins, and settings
"""

import requests
import json
import sys

KONG_ADMIN_API = "http://localhost:8001"
SERVICE_HOST = "api-sandbox.duffel.com"
SERVICE_PORT = 443
SERVICE_PATH = "/air"

# Define all Duffel routes
ROUTES = [
    {"name": "duffel-offer-requests", "paths": ["/offer_requests"], "methods": ["POST"]},
    {"name": "duffel-seat-maps", "paths": ["/seat_maps"], "methods": ["GET"]},
    {"name": "duffel-available-services", "paths": ["/orders/*/available_services"], "methods": ["GET"]},
    {"name": "duffel-selected-services", "paths": ["/order_change_requests"], "methods": ["POST"]},
    {"name": "duffel-orders-create", "paths": ["/orders"], "methods": ["POST"]},
    {"name": "duffel-orders-get", "paths": ["/orders", "/orders/*"], "methods": ["GET"]},
    {"name": "duffel-orders-update", "paths": ["/orders/*"], "methods": ["PATCH"]},
    {"name": "duffel-payment-intents", "paths": ["/payment_intents"], "methods": ["GET", "POST"]},
    {"name": "duffel-payment-methods", "paths": ["/payment_methods"], "methods": ["GET"]},
    {"name": "duffel-airlines", "paths": ["/airlines"], "methods": ["GET"]},
    {"name": "duffel-aircraft", "paths": ["/aircraft"], "methods": ["GET"]},
    {"name": "duffel-airports", "paths": ["/airports"], "methods": ["GET"]},
]

def create_service():
    """Create or get the Duffel API service"""
    print("1️⃣  Creating/Getting Duffel Service...")
    
    # Check if service already exists
    response = requests.get(f"{KONG_ADMIN_API}/services", params={"name": "duffel-api-service"})
    if response.status_code == 200:
        data = response.json()
        if data.get("data"):
            service_id = data["data"][0]["id"]
            print(f"  ✅ Service already exists: {service_id}")
            return service_id
    
    # Create new service
    service_data = {
        "name": "duffel-api-service",
        "host": SERVICE_HOST,
        "port": SERVICE_PORT,
        "protocol": "https",
        "path": SERVICE_PATH,
        "connect_timeout": 5000,
        "write_timeout": 15000,
        "read_timeout": 15000,
    }
    
    response = requests.post(f"{KONG_ADMIN_API}/services", data=service_data)
    if response.status_code in [200, 201]:
        service_id = response.json()["id"]
        print(f"  ✅ Service created: {service_id}")
        return service_id
    else:
        print(f"  ❌ Failed to create service: {response.status_code}")
        print(f"     {response.text}")
        sys.exit(1)

def create_routes(service_id):
    """Create all Duffel routes"""
    print("\n2️⃣  Creating Routes...")
    
    count = 0
    for route in ROUTES:
        route_data = {
            "name": route["name"],
            "strip_path": False,
            "protocols": ["https", "http"],
        }
        
        # Add paths
        for i, path in enumerate(route["paths"]):
            route_data[f"paths[{i}]"] = path
        
        # Add methods
        for i, method in enumerate(route["methods"]):
            route_data[f"methods[{i}]"] = method
        
        response = requests.post(
            f"{KONG_ADMIN_API}/services/{service_id}/routes",
            data=route_data
        )
        
        if response.status_code in [200, 201]:
            print(f"  ✅ {route['name']}")
            count += 1
        else:
            print(f"  ⚠️  {route['name']}: {response.status_code}")
    
    print(f"  Total routes created: {count}/{len(ROUTES)}")
    return count

def configure_plugins(service_id):
    """Configure plugins for the service"""
    print("\n3️⃣  Configuring Plugins...")
    
    plugins = [
        {
            "name": "key-auth",
            "config": {
                "key_names": ["Authorization"],
                "key_in_header": True,
                "hide_credentials": True,
            }
        },
        {
            "name": "rate-limiting",
            "config": {
                "minute": 1000,
                "hour": 10000,
                "policy": "local",
                "fault_tolerant": True,
            }
        },
        {
            "name": "request-transformer",
            "config": {
                "add": {
                    "headers": ["Duffel-Version:v2", "Content-Type:application/json"]
                }
            }
        },
        {
            "name": "cors",
            "config": {
                "origins": ["*"],
                "methods": ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
                "headers": ["Accept", "Accept-Version", "Content-Length", "Content-MD5",
                           "Content-Type", "Date", "X-Api-Version", "X-Response-Time",
                           "X-Status-Reason", "X-UW-Auth-Token"],
                "expose_headers": ["X-Api-Version", "X-Response-Time", "X-Status-Reason",
                                  "X-UW-Auth-Token"],
                "credentials": True,
                "max_age": 3600,
            }
        }
    ]
    
    count = 0
    for plugin in plugins:
        plugin_payload = {"name": plugin["name"]}
        if "config" in plugin:
            plugin_payload.update({
                f"config[{k}]": v if not isinstance(v, dict) else json.dumps(v)
                for k, v in plugin["config"].items()
            })
        
        response = requests.post(
            f"{KONG_ADMIN_API}/services/{service_id}/plugins",
            data=plugin_payload
        )
        
        if response.status_code in [200, 201]:
            print(f"  ✅ {plugin['name']}")
            count += 1
        else:
            print(f"  ⚠️  {plugin['name']}: {response.status_code}")
    
    print(f"  Total plugins configured: {count}/{len(plugins)}")
    return count

def verify_configuration(service_id):
    """Verify Kong configuration"""
    print("\n4️⃣  Verifying Configuration...")
    
    # Check service
    service_response = requests.get(f"{KONG_ADMIN_API}/services/{service_id}")
    if service_response.status_code == 200:
        service = service_response.json()
        print(f"  ✅ Service: {service['name']} ({service['host']}:{service['port']})")
    
    # Check routes
    routes_response = requests.get(f"{KONG_ADMIN_API}/services/{service_id}/routes")
    if routes_response.status_code == 200:
        route_count = len(routes_response.json().get("data", []))
        print(f"  ✅ Routes: {route_count} configured")
    
    # Check plugins
    plugins_response = requests.get(f"{KONG_ADMIN_API}/services/{service_id}/plugins")
    if plugins_response.status_code == 200:
        plugin_count = len(plugins_response.json().get("data", []))
        print(f"  ✅ Plugins: {plugin_count} configured")

def test_kong():
    """Test Kong connectivity"""
    print("\n5️⃣  Testing Kong...")
    
    try:
        response = requests.get(f"{KONG_ADMIN_API}/status", timeout=5)
        if response.status_code == 200:
            status = response.json()
            db_reachable = status.get("database", {}).get("reachable", False)
            if db_reachable:
                print(f"  ✅ Kong is running and database is reachable")
                return True
            else:
                print(f"  ⚠️  Kong is running but database is NOT reachable")
                return False
    except Exception as e:
        print(f"  ❌ Cannot reach Kong: {e}")
        return False

def main():
    print("=" * 60)
    print("Kong Duffel Routes Configuration")
    print("=" * 60)
    
    # Test Kong first
    if not test_kong():
        print("❌ Kong is not ready. Exiting.")
        sys.exit(1)
    
    # Create service
    service_id = create_service()
    
    # Create routes
    create_routes(service_id)
    
    # Configure plugins
    configure_plugins(service_id)
    
    # Verify
    verify_configuration(service_id)
    
    print("\n" + "=" * 60)
    print("✅ Kong Configuration Complete!")
    print("=" * 60)
    print(f"\n📝 Service ID: {service_id}")
    print(f"🔗 Kong Proxy: http://localhost:8000")
    print(f"🔐 Kong Admin API: http://localhost:8001")
    print(f"📊 Konga UI: http://localhost:1337")
    print("\n🚀 Next steps:")
    print("   1. Test Kong routes: curl http://localhost:8000/airlines")
    print("   2. Access Konga UI: http://localhost:1337")
    print("   3. Set KONG_PROXY_URL env var for API Gateway")

if __name__ == "__main__":
    main()
