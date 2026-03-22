# Azure Deployment Report - Orchid Vehicle Rental System

**Date:** March 22, 2026  
**Environment:** Azure Container Apps (East Asia)  
**Resource Group:** `orchid-rental-rg`  
**Container Registry:** `orchidacr11.azurecr.io`

---

## Table of Contents

1. [Infrastructure Overview](#1-infrastructure-overview)
2. [MongoDB Configuration](#2-mongodb-configuration)
3. [CI/CD Pipeline Configuration](#3-cicd-pipeline-configuration)
4. [Deployed Services](#4-deployed-services)
5. [API Gateway Configuration](#5-api-gateway-configuration)
6. [API Testing Results](#6-api-testing-results)
7. [Code Changes Summary](#7-code-changes-summary)

---

## 1. Infrastructure Overview

### Azure Resources

| Resource | Type | URL/Name |
|----------|------|----------|
| Resource Group | Resource Group | `orchid-rental-rg` |
| Container Registry | Azure Container Registry | `orchidacr11.azurecr.io` |
| API Gateway | Container App | `api-gateway.agreeablepebble-671ffeb1.eastasia.azurecontainerapps.io` |
| Auth Service | Container App | `auth-service.agreeablepebble-671ffeb1.eastasia.azurecontainerapps.io` |
| Payment Service | Container App | `payment-service.agreeablepebble-671ffeb1.eastasia.azurecontainerapps.io` |
| Notification Service | Container App | `notification-service.agreeablepebble-671ffeb1.eastasia.azurecontainerapps.io` |
| Vehicle Service | Container App | `vehicle-service.agreeablepebble-671ffeb1.eastasia.azurecontainerapps.io` |
| Booking Service | Container App | `booking-service.agreeablepebble-671ffeb1.eastasia.azurecontainerapps.io` |
| Maintenance Service | Container App | `maintenance-service.agreeablepebble-671ffeb1.eastasia.azurecontainerapps.io` |

### Service Ports

| Service | Internal Port |
|---------|---------------|
| API Gateway | 8080 |
| Auth Service | 8081 |
| Vehicle Service | 8082 |
| Booking Service | 8083 |
| Payment Service | 8084 |
| Maintenance Service | 8085 |
| Notification Service | 8086 |

---

## 2. MongoDB Configuration

### MongoDB Atlas Cluster

**Cluster URL:** `rentals.uierpp9.mongodb.net`  
**Authentication:** `admin:1234`

### Database Mapping

| Service | Database Name | Connection String |
|---------|---------------|-------------------|
| Auth Service | `auth-db` | `mongodb+srv://admin:1234@rentals.uierpp9.mongodb.net/auth-db` |
| Payment Service | `payment-db` | `mongodb+srv://admin:1234@rentals.uierpp9.mongodb.net/payment-db` |
| Notification Service | `notification-db` | `mongodb+srv://admin:1234@rentals.uierpp9.mongodb.net/notification-db` |
| Vehicle Service | `vehicle-db` | Uses different MongoDB cluster |
| Booking Service | `booking-db` | Uses different MongoDB cluster |
| Maintenance Service | `maintenance-db` | Uses different MongoDB cluster |

### MongoDB Migration Performed

Changed MongoDB cluster from `rental.z6qzg6i.mongodb.net` to `rentals.uierpp9.mongodb.net` for:
- payment-service
- auth-service
- notification-service

---

## 3. CI/CD Pipeline Configuration

### GitHub Actions Workflows

All services use GitHub Actions with the following pattern:

```yaml
on:
  push:
    branches: [main, develop]
    paths: ['backend/<service-name>/**']
  pull_request:
    branches: [main]
    paths: ['backend/<service-name>/**']
  workflow_dispatch:  # Manual trigger
```

### CI/CD Jobs

1. **Build** - Maven build and test
2. **SonarCloud** - Static code analysis
3. **Snyk** - Security vulnerability scanning
4. **Docker** - Build and push image to ACR
5. **Deploy** - Deploy to Azure Container Apps

### Azure Authentication (OIDC)

Each service uses service-specific secrets for secure Azure deployment:

| Service | Secrets Pattern |
|---------|-----------------|
| Payment Service | `PAYMENTSERVICE_AZURE_CLIENT_ID`, `PAYMENTSERVICE_AZURE_TENANT_ID`, `PAYMENTSERVICE_AZURE_SUBSCRIPTION_ID` |
| Auth Service | `AUTHSERVICE_AZURE_CLIENT_ID`, etc. |
| Vehicle Service | `VEHICLESERVICE_AZURE_CLIENT_ID`, etc. |
| Booking Service | `BOOKINGSERVICE_AZURE_CLIENT_ID`, etc. |
| Maintenance Service | `MAINTENANCESERVICE_AZURE_CLIENT_ID`, etc. |

### Docker Image Tags

```
orchidacr11.azurecr.io/<service-name>:latest
orchidacr11.azurecr.io/<service-name>:<github-sha>
```

---

## 4. Deployed Services

### Service Status (As of March 22, 2026)

| Service | Status | MongoDB | Health |
|---------|--------|---------|--------|
| api-gateway | Running | N/A | OK (routes) |
| auth-service | Running | Connected | OK |
| payment-service | Running | Connected | OK |
| notification-service | Running | Connected | OK |
| vehicle-service | Running | Connected | OK |
| booking-service | Running | Connected | OK |
| maintenance-service | Running | Connected | OK |

### Service Revisions

| Service | Active Revision |
|---------|-----------------|
| auth-service | auth-service--0000003 |
| payment-service | payment-service--0000004 |
| notification-service | notification-service--0000002 |

---

## 5. API Gateway Configuration

### Base URL
```
https://api-gateway.agreeablepebble-671ffeb1.eastasia.azurecontainerapps.io
```

### Route Configuration

| Path Pattern | Target Service |
|--------------|----------------|
| `/api/auth/**` | auth-service |
| `/api/vehicles/**` | vehicle-service |
| `/api/bookings/**` | booking-service |
| `/api/payments/**` | payment-service |
| `/api/maintenance/**` | maintenance-service |
| `/api/notifications/**` | notification-service |

### JWT Security

- JWT validation handled by API Gateway
- Token passed to downstream services via headers
- Role-based access control enforced at service level

---

## 6. API Testing Results

### 6.1 Authentication API

#### Login (Admin)

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "1234Pasan."
}
```

**Response (200 OK):**
```json
{
    "token": "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiT1dORVIiLCJ1c2VySWQiOiI2OWJmOWQ4YWRkYjQ2ZjUyYTQyNWRkYzEiLCJ1c2VybmFtZSI6ImFkbWluIiwic3ViIjoiYWRtaW4iLCJpYXQiOjE3NzQxNjYxMzEsImV4cCI6MTc3NDI1MjUzMX0.5eVY4fNdF2G9fevT4_neurokUK_66GWgSDxSj5kZWAfuzVxmKpm4Lqa5m8Y4tAip",
    "userId": "69bf9d8addb46f52a425ddc1",
    "username": "admin",
    "role": "OWNER"
}
```

#### Token Details (Decoded)
```json
{
    "role": "OWNER",
    "userId": "69bf9d8addb46f52a425ddc1",
    "username": "admin",
    "sub": "admin",
    "iat": 1774166131,
    "exp": 1774252531
}
```

---

### 6.2 Payment Service API

#### Get All Payments

**Request:**
```http
GET /api/payments
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
[
    {
        "paymentId": "PAY001",
        "bookingId": "BOOK001",
        "customerId": "CUST001",
        "amount": 5000.0,
        "paymentStatus": "SUCCESS",
        "paymentDate": "2026-03-12T07:42:52.514",
        "paymentType": "ADVANCE_DEPOSIT",
        "stripePaymentIntentId": null,
        "stage": "ADVANCE"
    },
    {
        "paymentId": "PAY002",
        "bookingId": "BOOK001",
        "customerId": "CUST001",
        "amount": 17500.0,
        "paymentStatus": "SUCCESS",
        "paymentDate": "2026-03-17T07:42:52.514",
        "paymentType": "RENTAL_BALANCE",
        "stripePaymentIntentId": null,
        "stage": "FINAL"
    },
    {
        "paymentId": "PAY003",
        "bookingId": "BOOK002",
        "customerId": "CUST002",
        "amount": 5000.0,
        "paymentStatus": "SUCCESS",
        "paymentDate": "2026-03-19T07:42:52.514",
        "paymentType": "ADVANCE_DEPOSIT",
        "stripePaymentIntentId": null,
        "stage": "ADVANCE"
    }
    // ... more payments
]
```

---

### 6.3 User Management API

#### Get All Users

**Request:**
```http
GET /api/auth/users
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
[
    {
        "userId": "69bf9d8addb46f52a425ddc1",
        "username": "admin",
        "email": "pasancp2000@gmail.com",
        "role": "OWNER"
    },
    {
        "userId": "69bf9d8bddb46f52a425ddc2",
        "username": "cashier1",
        "email": "cashier1@orchid.com",
        "role": "BOOKING_CASHIER"
    },
    {
        "userId": "69bf9d8bddb46f52a425ddc3",
        "username": "cashier2",
        "email": "cashier2@orchid.com",
        "role": "BOOKING_CASHIER"
    },
    {
        "userId": "69bf9d8bddb46f52a425ddc4",
        "username": "advisor1",
        "email": "advisor1@orchid.com",
        "role": "REPAIR_ADVISOR"
    },
    {
        "userId": "69bf9d8bddb46f52a425ddc5",
        "username": "advisor2",
        "email": "advisor2@orchid.com",
        "role": "REPAIR_ADVISOR"
    },
    {
        "userId": "69bf9d8bddb46f52a425ddc6",
        "username": "customer1",
        "email": "customer1@gmail.com",
        "role": "CUSTOMER"
    }
    // ... more customers
]
```

#### Seeded Users Summary

| Username | Email | Role | Password |
|----------|-------|------|----------|
| admin | pasancp2000@gmail.com | OWNER | 1234Pasan. |
| cashier1 | cashier1@orchid.com | BOOKING_CASHIER | Pass@123 |
| cashier2 | cashier2@orchid.com | BOOKING_CASHIER | Pass@123 |
| advisor1 | advisor1@orchid.com | REPAIR_ADVISOR | Pass@123 |
| advisor2 | advisor2@orchid.com | REPAIR_ADVISOR | Pass@123 |
| customer1-5 | customerN@gmail.com | CUSTOMER | Pass@123 |

---

### 6.4 Vehicle Service API

#### Get All Vehicles

**Request:**
```http
GET /api/vehicles
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
[
    {
        "vehicleId": "VEH001",
        "brand": "Toyota",
        "model": "Corolla",
        "type": "SEDAN",
        "pricePerDay": 4500.0,
        "advanceDeposit": 5000.0,
        "availabilityStatus": "AVAILABLE",
        "bookingCount": 0,
        "popularityRank": 0
    },
    {
        "vehicleId": "VEH002",
        "brand": "Honda",
        "model": "Civic",
        "type": "SEDAN",
        "pricePerDay": 5000.0,
        "advanceDeposit": 5000.0,
        "availabilityStatus": "AVAILABLE",
        "bookingCount": 0,
        "popularityRank": 0
    },
    {
        "vehicleId": "VEH003",
        "brand": "BMW",
        "model": "3 Series",
        "type": "SEDAN",
        "pricePerDay": 8500.0,
        "advanceDeposit": 5000.0,
        "availabilityStatus": "AVAILABLE",
        "bookingCount": 0,
        "popularityRank": 0
    },
    {
        "vehicleId": "VEH004",
        "brand": "Toyota",
        "model": "RAV4",
        "type": "SUV",
        "pricePerDay": 7000.0,
        "advanceDeposit": 8000.0,
        "availabilityStatus": "AVAILABLE",
        "bookingCount": 0,
        "popularityRank": 0
    },
    {
        "vehicleId": "VEH005",
        "brand": "Ford",
        "model": "Explorer",
        "type": "SUV",
        "pricePerDay": 8000.0,
        "advanceDeposit": 8000.0,
        "availabilityStatus": "BOOKED",
        "bookingCount": 0,
        "popularityRank": 0
    }
    // ... more vehicles (VEH006-VEH012)
]
```

#### Vehicle Types & Pricing

| Vehicle ID | Brand | Model | Type | Price/Day | Deposit | Status |
|------------|-------|-------|------|-----------|---------|--------|
| VEH001 | Toyota | Corolla | SEDAN | 4,500 | 5,000 | AVAILABLE |
| VEH002 | Honda | Civic | SEDAN | 5,000 | 5,000 | AVAILABLE |
| VEH003 | BMW | 3 Series | SEDAN | 8,500 | 5,000 | AVAILABLE |
| VEH004 | Toyota | RAV4 | SUV | 7,000 | 8,000 | AVAILABLE |
| VEH005 | Ford | Explorer | SUV | 8,000 | 8,000 | BOOKED |
| VEH006 | Jeep | Wrangler | SUV | 9,000 | 8,000 | AVAILABLE |
| VEH007 | Toyota | HiAce | VAN | 10,000 | 10,000 | AVAILABLE |
| VEH008 | Ford | Transit | VAN | 9,500 | 10,000 | MAINTENANCE |
| VEH009 | Tesla | Model 3 | ELECTRIC | 11,000 | 12,000 | AVAILABLE |
| VEH010 | Nissan | Leaf | ELECTRIC | 6,500 | 12,000 | AVAILABLE |
| VEH011 | Toyota | Hilux | TRUCK | 7,500 | 7,000 | AVAILABLE |

---

### 6.5 Booking Service API

#### Get All Bookings

**Request:**
```http
GET /api/bookings
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
[
    {
        "bookingId": "BOOK001",
        "vehicleId": "VEH001",
        "customerId": "CUST001",
        "customerEmail": "customer1@gmail.com",
        "startDate": "2026-03-12",
        "endDate": "2026-03-17",
        "totalAmount": 22500.0,
        "advancePaid": 5000.0,
        "remainingBalance": 17500.0,
        "finalPaymentDone": true,
        "status": "COMPLETED"
    },
    {
        "bookingId": "BOOK002",
        "vehicleId": "VEH003",
        "customerId": "CUST002",
        "customerEmail": "customer2@gmail.com",
        "startDate": "2026-03-19",
        "endDate": "2026-03-24",
        "totalAmount": 42500.0,
        "advancePaid": 5000.0,
        "remainingBalance": 37500.0,
        "finalPaymentDone": false,
        "status": "CONFIRMED"
    },
    {
        "bookingId": "BOOK003",
        "vehicleId": "VEH005",
        "customerId": "CUST001",
        "customerEmail": "customer1@gmail.com",
        "startDate": "2026-03-23",
        "endDate": "2026-03-27",
        "totalAmount": 32000.0,
        "advancePaid": 8000.0,
        "remainingBalance": 24000.0,
        "finalPaymentDone": false,
        "status": "PENDING"
    }
    // ... more bookings
]
```

#### Booking Summary

| Booking ID | Vehicle | Customer | Dates | Total | Status |
|------------|---------|----------|-------|-------|--------|
| BOOK001 | VEH001 (Corolla) | customer1 | Mar 12-17 | 22,500 | COMPLETED |
| BOOK002 | VEH003 (BMW 3) | customer2 | Mar 19-24 | 42,500 | CONFIRMED |
| BOOK003 | VEH005 (Explorer) | customer1 | Mar 23-27 | 32,000 | PENDING |
| BOOK004 | VEH004 (RAV4) | customer3 | Mar 15-18 | 21,000 | COMPLETED |
| BOOK005 | VEH002 (Civic) | customer4 | Mar 20-25 | 25,000 | CONFIRMED |
| BOOK006 | VEH009 (Tesla) | customer5 | Mar 25-29 | 44,000 | PENDING |
| BOOK007 | VEH006 (Wrangler) | customer2 | Mar 07-12 | 45,000 | COMPLETED |

---

### 6.6 Payment Types Summary

| Payment ID | Booking | Amount | Type | Status |
|------------|---------|--------|------|--------|
| PAY001 | BOOK001 | 5,000 | ADVANCE_DEPOSIT | SUCCESS |
| PAY002 | BOOK001 | 17,500 | RENTAL_BALANCE | SUCCESS |
| PAY003 | BOOK002 | 5,000 | ADVANCE_DEPOSIT | SUCCESS |
| PAY004 | BOOK004 | 8,000 | ADVANCE_DEPOSIT | SUCCESS |
| PAY005 | BOOK004 | 13,000 | RENTAL_BALANCE | SUCCESS |
| PAY006 | BOOK005 | 5,000 | ADVANCE_DEPOSIT | SUCCESS |
| PAY009 | BOOK008 | 5,000 | ADVANCE_DEPOSIT | REFUNDED |
| PAY010 | BOOK001 | 15,000 | DAMAGE | SUCCESS |

---

### 6.7 Service Health Checks

#### API Gateway Routes Test

**Request:**
```http
GET /api/auth/users
Authorization: Bearer <jwt-token>
```
**Result:** 200 OK - Confirms routing to auth-service

**Request:**
```http
GET /api/payments
Authorization: Bearer <jwt-token>
```
**Result:** 200 OK - Confirms routing to payment-service

---

## 7. Code Changes Summary

### Auth Service Updates (Commit: 14cf659)

#### 1. DataInitializer.java
- Updated default admin email from `admin@orchid.com` to `pasancp2000@gmail.com`

#### 2. AuthController.java
- Added new endpoint: `PUT /api/auth/users/{userId}`
- Allows updating user email and username

```java
@PutMapping("/users/{userId}")
public ResponseEntity<UserResponse> updateUser(@PathVariable String userId,
                                                @RequestBody Map<String, String> body,
                                                @RequestHeader(value = "X-User-Role", required = false) String role) {
    validateRole(role, "User update");
    return ResponseEntity.ok(authService.updateUser(userId, body.get("email"), body.get("username")));
}
```

#### 3. AuthService.java
- Added `updateUser` method with validation

```java
public UserResponse updateUser(String userId, String email, String username) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (email != null && !email.isBlank()) {
        user.setEmail(email);
    }
    if (username != null && !username.isBlank()) {
        if (!username.equals(user.getUsername()) && userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        user.setUsername(username);
    }

    User savedUser = userRepository.save(user);
    return toUserResponse(savedUser);
}
```

### CI/CD Workflow Updates

#### vehicle-service.yml
- Added `workflow_dispatch` trigger
- Added `ACR_LOGIN_SERVER` environment variable
- Updated Docker build context to `./backend`
- Implemented OIDC-based Azure deployment

#### booking-service.yml
- Added deployment job
- Fixed Docker build context
- Implemented OIDC-based Azure deployment

#### maintenance-service.yml
- Migrated from Docker Hub to Azure Container Registry
- Updated deployment to use OIDC authentication
- Removed error suppression for honest CI/CD feedback

---

## Git Commits (Session)

| Commit | Message |
|--------|---------|
| 14cf659 | Add updateUser API endpoint and update default admin email |
| 44a3bbf | Fix maintenance-service CI/CD workflow for Azure deployment |
| 057a046 | Fix booking-service CI/CD workflow with OIDC deployment |
| aa78d67 | Fix vehicle-service CI/CD workflow with OIDC deployment |

---

## Azure CLI Commands Used

### Container App Updates

```bash
# Update MongoDB URI
az containerapp update \
  --name payment-service \
  --resource-group orchid-rental-rg \
  --set-env-vars "SPRING_DATA_MONGODB_URI=mongodb+srv://admin:1234@rentals.uierpp9.mongodb.net/payment-db?retryWrites=true&w=majority"

# Restart service
az containerapp revision restart \
  --name auth-service \
  --resource-group orchid-rental-rg \
  --revision auth-service--0000003

# View logs
az containerapp logs show \
  --name auth-service \
  --resource-group orchid-rental-rg \
  --tail 30
```

### Container App Status

```bash
az containerapp show \
  --name <service-name> \
  --resource-group orchid-rental-rg \
  --query "properties.runningStatus"
```

---

## Appendix: Environment Variables

### Required Environment Variables per Service

| Variable | Description | Example |
|----------|-------------|---------|
| `SPRING_DATA_MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing key | `<secret>` |
| `VEHICLE_SERVICE_URL` | Vehicle service URL (for gateway) | `https://vehicle-service...` |
| `BOOKING_SERVICE_URL` | Booking service URL (for gateway) | `https://booking-service...` |
| `PAYMENT_SERVICE_URL` | Payment service URL (for gateway) | `https://payment-service...` |

---

---

## 8. API Testing Commands

### PowerShell Commands

```powershell
# Base URL
$baseUrl = "https://api-gateway.agreeablepebble-671ffeb1.eastasia.azurecontainerapps.io"

# Login and get token
$loginBody = '{"username":"admin","password":"1234Pasan."}'
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $loginResponse.token

# Get all users
Invoke-RestMethod -Uri "$baseUrl/api/auth/users" -Method GET -Headers @{Authorization="Bearer $token"}

# Get all vehicles
Invoke-RestMethod -Uri "$baseUrl/api/vehicles" -Method GET -Headers @{Authorization="Bearer $token"}

# Get all bookings
Invoke-RestMethod -Uri "$baseUrl/api/bookings" -Method GET -Headers @{Authorization="Bearer $token"}

# Get all payments
Invoke-RestMethod -Uri "$baseUrl/api/payments" -Method GET -Headers @{Authorization="Bearer $token"}
```

### cURL Commands

```bash
# Base URL
BASE_URL="https://api-gateway.agreeablepebble-671ffeb1.eastasia.azurecontainerapps.io"

# Login
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234Pasan."}'

# Get users (replace TOKEN with actual token)
curl -X GET "$BASE_URL/api/auth/users" \
  -H "Authorization: Bearer TOKEN"

# Get vehicles
curl -X GET "$BASE_URL/api/vehicles" \
  -H "Authorization: Bearer TOKEN"

# Get bookings
curl -X GET "$BASE_URL/api/bookings" \
  -H "Authorization: Bearer TOKEN"

# Get payments
curl -X GET "$BASE_URL/api/payments" \
  -H "Authorization: Bearer TOKEN"
```

---

## 9. Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-login to get new token |
| 504 Gateway Timeout | Cold start | Wait 30s and retry |
| Connection refused | Service not running | Check Azure Container App status |
| MongoDB connection error | Invalid URI or network | Verify connection string |

### Useful Azure CLI Commands

```bash
# Check service status
az containerapp show --name <service> --resource-group orchid-rental-rg --query "properties.runningStatus"

# View logs
az containerapp logs show --name <service> --resource-group orchid-rental-rg --tail 50

# Restart service
az containerapp revision restart --name <service> --resource-group orchid-rental-rg --revision <revision-name>

# Update environment variable
az containerapp update --name <service> --resource-group orchid-rental-rg --set-env-vars "KEY=VALUE"
```

---

**Report Generated:** March 22, 2026  
**Author:** Automated Documentation  
**Branch:** `feature/IT22062642-payment-service`
