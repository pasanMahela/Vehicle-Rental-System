# Maintenance Service - README

## 📋 Overview

The Maintenance Service is a microservice for a vehicle rental system that handles all maintenance-related operations. It manages both **reported issues** (accidents, breakdowns) and **scheduled repetitive maintenance** (oil changes, tire rotations, etc.) for vehicles.

## 🚀 Key Functionalities

### 1. Issue Reporting
- Users can report vehicle issues like accidents or breakdowns
- Each issue is tracked with status (REPORTED, SCHEDULED, RESOLVED)
- Issues can be linked to maintenance records when scheduled

### 2. Maintenance Scheduling
- **From Issues**: Schedule maintenance for reported issues with estimated cost
- **Recurring Maintenance**: Create repetitive maintenance tasks (monthly, quarterly, yearly)
- Automatic generation of next cycle for recurring maintenance

### 3. Maintenance Lifecycle Management
- Track maintenance through states: SCHEDULED → IN_PROGRESS → COMPLETED
- Record estimated costs (when scheduling) and actual costs (when completing)
- Automatic linking between issues and maintenance records

### 4. History & Monitoring
- View maintenance history for specific vehicles
- View all maintenance records across the fleet
- Filter completed maintenance records
- Track upcoming maintenance tasks

### 5. Automated Recurring Maintenance
- Automatically generate next maintenance cycle when current one is completed
- Manual trigger to generate all due recurring maintenance

## 📚 API Endpoints

### Base URL
```
http://localhost:8083/api/maintenance
```

---

## 1️⃣ Issue Reporting Endpoints

### 1.1 Report a New Issue
**POST** `/issues/report`

Reports a new vehicle issue (accident, breakdown, etc.)

**Request Body:**
```json
{
    "vehicleId": "VH001",
    "issueType": "ACCIDENT",
    "description": "Front bumper damaged in parking lot collision",
    "reportedBy": "user123"
}
```

**Response:** Created issue with status "REPORTED"

---

### 1.2 Get All Issues for a Vehicle
**GET** `/issues/vehicle/{vehicleId}`

Retrieves all issues reported for a specific vehicle

**Example:** `GET /issues/vehicle/VH001`

---

### 1.3 Get Specific Issue by ID
**GET** `/issues/{issueId}`

Retrieves details of a specific issue

**Example:** `GET /issues/ISSUE001`

---

## 2️⃣ Maintenance Scheduling Endpoints

### 2.1 Schedule Maintenance from an Issue
**POST** `/schedule-from-issue/{issueId}`

Creates a maintenance record from a reported issue

**Request Body:**
```json
{
    "scheduledDate": "2024-01-20T09:00:00",
    "estimatedCost": 500.00
}
```

**Process:**
- Creates maintenance record with status "SCHEDULED"
- Updates the issue status to "SCHEDULED"
- Links the issue to the maintenance record

---

### 2.2 Create Scheduled/Recurring Maintenance
**POST** `/scheduled`

Creates a new scheduled maintenance task (can be recurring)

**Request Body (Monthly):**
```json
{
    "vehicleId": "VH003",
    "maintenanceType": "SCHEDULED",
    "description": "Regular oil change and filter replacement",
    "isRecurring": true,
    "recurrencePattern": "MONTHLY",
    "estimatedCost": 89.99,
    "scheduledDate": "2024-02-01T08:00:00"
}
```

**Recurrence Patterns:** `MONTHLY`, `QUARTERLY`, `YEARLY`

---

## 3️⃣ Maintenance Operations Endpoints

### 3.1 Start Maintenance
**PUT** `/{id}/start`

Changes maintenance status from "SCHEDULED" to "IN_PROGRESS"

**Example:** `PUT /MAINT001/start`

**Process:**
- Records the start date and time
- Updates status to IN_PROGRESS

---

### 3.2 Complete Maintenance
**PUT** `/{id}/complete?actualCost={cost}`

Completes a maintenance task with actual cost

**Example:** `PUT /MAINT001/complete?actualCost=575.50`

**Process:**
- Updates status to "COMPLETED"
- Records actual cost and completion date
- If linked to an issue, updates issue status to "RESOLVED"
- If recurring, generates next cycle automatically

---

### 3.3 Update Maintenance Status
**PUT** `/{id}/status?status={status}`

Manually updates the status of a maintenance record

**Example:** `PUT /MAINT002/status?status=IN_PROGRESS`

**Valid Statuses:** `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

---

## 4️⃣ History & Query Endpoints

### 4.1 Get Upcoming Maintenance for a Vehicle
**GET** `/upcoming/vehicle/{vehicleId}`

Retrieves all SCHEDULED and IN_PROGRESS maintenance for a vehicle

**Example:** `GET /upcoming/vehicle/VH001`

---

### 4.2 Get All Upcoming Maintenance
**GET** `/upcoming/all`

Retrieves all SCHEDULED maintenance across all vehicles

---

### 4.3 Get Vehicle Maintenance History
**GET** `/history/vehicle/{vehicleId}`

Retrieves all maintenance records (past and present) for a vehicle

**Example:** `GET /history/vehicle/VH001`

---

### 4.4 Get All Maintenance History
**GET** `/history/all`

Retrieves all maintenance records in the system

---

### 4.5 Get Vehicle Completed Maintenance
**GET** `/history/vehicle/{vehicleId}/completed`

Retrieves only COMPLETED maintenance records for a vehicle

**Example:** `GET /history/vehicle/VH001/completed`

---

## 5️⃣ Utility Endpoints

### 5.1 Generate Recurring Maintenance
**POST** `/generate-recurring`

Manually triggers generation of all due recurring maintenance records

**Process:**
- Finds all recurring records where nextDueDate <= current date
- Creates new scheduled records for the next cycle
- Useful for catching up on missed recurrences or testing

**Response:** `"Recurring maintenance records generated successfully"`

---

## 6️⃣ Delete Endpoints

### 6.1 Delete Maintenance Record
**DELETE** `/records/{id}`

Permanently removes a maintenance record

**Example:** `DELETE /records/MAINT001`

---

### 6.2 Delete Issue
**DELETE** `/issues/{id}`

Permanently removes a reported issue

**Example:** `DELETE /issues/ISSUE001`

---

## 📊 Data Models

### Reported Issue
```json
{
    "id": "ISSUE001",
    "vehicleId": "VH001",
    "issueType": "ACCIDENT",
    "description": "Front bumper damaged",
    "reportedDate": "2024-01-15T10:30:00",
    "reportedBy": "user123",
    "status": "REPORTED",
    "maintenanceRecordId": null
}
```

### Maintenance Record
```json
{
    "id": "MAINT001",
    "vehicleId": "VH001",
    "maintenanceType": "ACCIDENT",
    "description": "Front bumper damaged",
    "isRecurring": false,
    "recurrencePattern": null,
    "nextDueDate": null,
    "issueId": "ISSUE001",
    "estimatedCost": 500.0,
    "actualCost": 575.5,
    "status": "COMPLETED",
    "scheduledDate": "2024-01-20T09:00:00",
    "startDate": "2024-01-20T09:00:00",
    "completionDate": "2024-01-20T15:30:00",
    "createdAt": "2024-01-15T11:30:00",
    "updatedAt": "2024-01-20T15:30:00"
}
```

## 🔄 Status Flow

### Issue Status Flow:
```
REPORTED → SCHEDULED → RESOLVED
```

### Maintenance Status Flow:
```
SCHEDULED → IN_PROGRESS → COMPLETED
                 ↓
              CANCELLED
```

## 🎯 Use Case Examples

### Example 1: Accident Repair
1. User reports accident → `POST /issues/report`
2. Manager schedules repair → `POST /schedule-from-issue/ISSUE001`
3. Mechanic starts work → `PUT /MAINT001/start`
4. Work completed → `PUT /MAINT001/complete?actualCost=575.50`

### Example 2: Scheduled Oil Change
1. Create recurring maintenance → `POST /scheduled`
2. Each month, system tracks upcoming → `GET /upcoming/vehicle/VH003`
3. When completed, next month auto-generated
4. Run monthly cron job → `POST /generate-recurring`

### Example 3: Maintenance History Review
1. View all vehicle history → `GET /history/vehicle/VH001`
2. Filter completed work → `GET /history/vehicle/VH001/completed`
3. Check upcoming work → `GET /upcoming/vehicle/VH001`

## 🛠️ Technical Stack

- **Framework:** Spring Boot 3.1.5
- **Language:** Java 17
- **Database:** MongoDB
- **Build Tool:** Maven
- **Dependencies:** 
  - Spring Web
  - Spring Data MongoDB
  - Lombok

## 🚦 Getting Started

1. **Clone the repository**
2. **Ensure MongoDB is running** on localhost:27017
3. **Build the project:**
   ```bash
   mvn clean install
   ```
4. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```
5. **Access the service** at `http://localhost:8083`

## 📝 Notes

- All dates should be in ISO format: `yyyy-MM-dd'T'HH:mm:ss`
- The service automatically creates timestamps for creation and updates
- Recurring maintenance patterns: MONTHLY, QUARTERLY, YEARLY
- Issue types: ACCIDENT, BREAKDOWN, GENERAL (customizable)