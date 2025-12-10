# Dashboard Application - Complete Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Core Components](#core-components)
5. [Utility Functions](#utility-functions)
6. [Data Flow](#data-flow)
7. [API Endpoints](#api-endpoints)
8. [State Management](#state-management)
9. [Styling & Themes](#styling--themes)
10. [Installation & Deployment](#installation--deployment)

---

## Architecture Overview

This is a **data analysis dashboard** built with React + TypeScript, designed for analyzing CSV reports with dynamic charting and filtering capabilities. The application is part of an **architecture/governance thesis project** that explores real-world data governance challenges in enterprise systems.

### Key Features
- 📊 **6 Chart Types**: Bar, Column, Pie, Line, Area, and Scatter charts powered by Highcharts
- 📋 **CSV Data Analysis**: Upload and analyze CSV reports with automatic categorization
- 🔍 **Dynamic Filtering**: Filter data by any column with real-time updates
- 👤 **User Management**: Authentication with role-based access (public/private reports)
- 🔐 **Password Security**: Strong password requirements (10+ chars, mixed case, number, symbol)
- 📱 **Responsive UI**: Dark theme with Tailwind CSS
- 📊 **Table Sorting**: Click column headers to sort ascending/descending
- 👥 **User Profiles**: Photo upload and profile management
- 🎨 **Dark Color Palette**: Professional dark theme with accent colors

### Problem Domain
This dashboard addresses **real-world governance challenges**:
- **Data Silos**: Multiple isolated reports across systems
- **Governance Gaps**: Lack of centralized data access control
- **Analysis Limitations**: Manual CSV analysis without proper tooling
- **Compliance Issues**: No audit trail for data access
- **Integration Friction**: Disparate data sources without unified interface

---

## Project Structure

```
aygo-reporter/
├── src/
│   ├── pages/                    # Page components
│   │   ├── Dashboard.tsx         # Main dashboard with report list
│   │   ├── Statistics.tsx        # Advanced data analysis with charts
│   │   ├── ReportAnalysis.tsx    # Detailed report view with sorting
│   │   ├── Login.tsx             # Authentication page
│   │   ├── ChangePassword.tsx    # Password change page
│   │   └── [other pages]
│   ├── components/               # Reusable components
│   │   ├── DynamicChart.tsx      # Highcharts wrapper for 6 chart types
│   │   ├── CategoryMenu.tsx      # Sidebar file browser
│   │   ├── [other components]
│   ├── layouts/                  # Layout components
│   │   └── DashboardLayout.tsx   # Main layout with nav + profile
│   ├── context/                  # React Context for state
│   ├── config/                   # Configuration files
│   ├── types/                    # TypeScript type definitions
│   └── App.tsx                   # Root component
├── public/                       # Static assets
├── Dockerfile                    # Container configuration
└── package.json                  # Dependencies & scripts
```

---

## Technology Stack

### Frontend
- **React 18**: UI library with hooks
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Highcharts 12.4.0**: Professional charting library
- **lucide-react**: Icon library
- **Axios**: HTTP client (via fetch)

### Backend Services (Java Spring Boot)
- **Auth Service** (port 2081): User authentication, password management
- **Data Service** (port 2082): Report data processing
- **Upload Service** (port 2083): CSV file upload handling
- **Report Service** (port 2084): Report storage & retrieval

### Databases
- **PostgreSQL**: Primary relational database
- **MongoDB**: NoSQL storage for reports
- **Redis**: Caching layer

### Infrastructure
- **Docker Compose**: Multi-container orchestration
- **nginx**: Reverse proxy (port 2080)
- **node:20**: Node.js runtime

---

## Core Components

### 1. **DashboardLayout.tsx** - Main Navigation & Profile
**Purpose**: Top-level layout with sidebar navigation and user profile

**Props**: None (uses localStorage)

**State**:
- `profileImage`: Base64 string of uploaded profile photo
- Extracted from localStorage for user name & email

**Key Functions**:
- `handleImageUpload()`: Converts file to base64, saves to localStorage
- Profile display with hover effect and camera icon for upload
- Shows user name and email below profile photo

**Features**:
- ✅ Dark theme sidebar
- ✅ Logo and branding
- ✅ Navigation menu items
- ✅ Profile photo upload capability
- ✅ Logout button (red, compact styling)
- ✅ "Cambiar Contraseña" (Change Password) link
- ✅ Responsive on mobile

**Styling**:
- Dark blue background: `#0f2a44`
- Hover effect: Lighter shade `#163a5d`
- Logout button: Red `bg-red-600 hover:bg-red-700`
- Profile photo: 64x64px circle with border

---

### 2. **Statistics.tsx** - Advanced Data Analysis & Charting
**Purpose**: Main analysis page with 3 dynamic chart panels, filtering, and data exploration

**Props**: None (uses context & localStorage)

**State**:
- `selectedCategory`: Currently selected report category
- `selectedReportId`: Currently selected report ID
- `report`: Full CSV report object with headers and rows
- `selectedChartColumn1/2/3`: Column names for each chart
- `chartType1/2/3`: Chart type for each panel
- `filterColumnDynamic`: Column selected for filtering
- `filterValueDynamic`: Value selected for filtering
- `appliedDynamicFilter`: Currently applied filter
- `showAdvanced`: Toggle for advanced filter options
- `loadingReport`, `loadingCategories`: Loading states
- `error`: Error message display

**Key Functions**:

#### `buildCounts(rows, column, top = 999): ChartPoint[]`
Generates frequency count of column values, sorted descending by frequency.
- **Parameters**:
  - `rows`: Array of data records from CSV
  - `column`: Column name to count frequencies
  - `top`: Maximum items to return (default 999 = all)
- **Returns**: Array of `{name, y}` objects sorted by count descending
- **Used by**: All 6 chart types to generate chart data
- **Example**: `buildCounts(report.rows, "Status")` → `[{name: "Active", y: 150}, {name: "Inactive", y: 42}]`

#### `tryGetUserId(): number`
Safely extracts userId from localStorage with fallback to 1.
- **Parameters**: None
- **Returns**: User ID (number) or default 1
- **Used by**: `fetchReport()` to authorize API calls
- **Error handling**: Returns 1 if JSON parse fails

#### `fetchCategories()`
Async function to load available report categories for current user.
- **Tries candidates**: Extracts from localStorage, tries defaults [1, 17]
- **API Call**: `GET /api/reports/csv/categories/{userId}`
- **Sets**: `categories` state with category → periods mapping
- **Error handling**: Sets error message if all candidates fail

#### `fetchReport(reportId)`
Async function to load full CSV report data.
- **API Call**: `GET /api/reports/csv/{reportId}?userId={userId}`
- **Sets**: `report` with headers + rows
- **Resets**: Dynamic filter states to null
- **Error handling**: Sets error message, clears report

#### `aplicarFiltros()`
Applies dynamic filter when user clicks "Aplicar filtros" button.
- **Logic**: If both column and value selected, filter matching rows; else clear filter
- **Updates**: `appliedDynamicFilter` state
- **Effect**: `filteredRows` useMemo recalculates

**Memos**:
- `uniqueValuesForColumn`: All unique values in selected filter column (up to 200)
- `filteredRows`: Data rows after applying dynamic filter

**UI Sections**:
1. **Category & Period Selection**: Dropdowns for report selection
2. **Dynamic Filter**: Column + value selection with apply button
3. **Advanced Options**: Toggle-able filter criteria
4. **Chart Configuration**: 3 identical panels:
   - Column selector
   - Chart type selector (6 options)
   - Chart display using `DynamicChart` component

**Dark Theme Colors**:
- Background: White cards with dark text
- Buttons: Dark blue `#0f2a44`
- Hover: Lighter shade `#163a5d`

---

### 3. **ReportAnalysis.tsx** - Detailed Report View with Sorting
**Purpose**: Display full report in table format with sorting capabilities

**Props**: None (uses context & params)

**State**:
- `sortColumn`: Currently sorted column name
- `sortDirection`: "asc" or "desc"
- Other states for report data, filtering, loading

**Key Functions**:

#### `handleHeaderClick(column: string)`
Toggles sort when user clicks table header.
- **Logic**: If same column clicked, toggle direction; else sort ascending
- **Updates**: `sortColumn` and `sortDirection` state
- **Effect**: Table rows re-render in new sort order

**Computed**:
- `sortedRows`: Filtered rows sorted by `sortColumn` and `sortDirection`
- Uses Array.sort() with column value comparison

**UI Features**:
- ✅ Clickable column headers with cursor pointer
- ✅ Visual sort direction indicators (↑↓)
- ✅ Report file info card with name + metadata
- ✅ Data table with pagination
- ✅ File name truncates with ellipsis on overflow
- ✅ Tooltip shows full filename on hover

**Styling**:
- Table header: Dark background with white text, hover highlight
- Sort icon: Shows current sort direction
- File card: Info box with metadata (rows, date, etc.)
- Name truncation: `truncate overflow-hidden text-ellipsis whitespace-nowrap`

---

### 4. **DynamicChart.tsx** - Highcharts Wrapper Component
**Purpose**: Render 6 different chart types from frequency data

**Props**:
```typescript
interface DynamicChartProps {
  type: "bar" | "column" | "pie" | "line" | "area" | "scatter";
  data: ChartPoint[]; // {name, y} array
  title?: string;
}
```

**Supported Chart Types**:

| Type | Best For | Y-Axis | Features |
|------|----------|--------|----------|
| **bar** | Horizontal comparisons | Count | Horizontal bars |
| **column** | Vertical comparisons | Count | Vertical bars |
| **pie** | Proportions | Count | Donut with legend |
| **line** | Trends over time | Count | Connected points |
| **area** | Cumulative trends | Count | Filled area under line |
| **scatter** | Correlations | Count | Discrete points |

**Chart Styling**:
- **Colors**: Dark palette `["#1e40af", "#0369a1", "#0891b2", "#5b21b6", "#be185d", "#92400e"]`
- **Tooltip**: Dark background with light text (Highcharts default)
- **Legend**: Below chart, clickable to toggle series
- **Pie chart text**: Dark color (#1f2937) for visibility
- **Responsive**: Container-based sizing with 100% width

**Configuration Features**:
- Exporting menu (PDF, PNG, SVG)
- Legend with series toggle
- Hover effects and data labels
- Responsive sizing
- Dark theme compatibility

---

### 5. **Login.tsx** - Authentication Page
**Purpose**: User login and registration with password validation

**State**:
- Login form: email, password
- Registration form: name, email, password
- Password validation feedback
- Loading state

**Key Functions**:

#### `validatePassword(password: string): boolean`
Checks if password meets security requirements.
- **Requirements**:
  - ✅ Minimum 10 characters
  - ✅ At least 1 uppercase letter (A-Z)
  - ✅ At least 1 lowercase letter (a-z)
  - ✅ At least 1 number (0-9)
  - ✅ At least 1 symbol (!@#$%^&*)
- **Returns**: Boolean (true if all requirements met)
- **Used by**: Registration form validation

**Features**:
- ✅ Real-time password validation with checklist
- ✅ Green checkmark when requirement met
- ✅ Red X when requirement not met
- ✅ Disabled submit button if validation fails
- ✅ Login existing users
- ✅ Register new users

**API Calls**:
- `POST /api/auth/login`: Authenticate user
- `POST /api/auth/register`: Create new account

---

### 6. **ChangePassword.tsx** - Password Management Page
**Purpose**: Allow users to change their password with validation

**State**:
- `currentPassword`: Old password input
- `newPassword`: New password input
- `confirmPassword`: Confirm new password
- `validationErrors`: List of failed requirements
- `successMessage`: Success feedback after change

**Key Functions**:

#### `validatePassword(password: string): string[]`
Validates new password against requirements.
- **Returns**: Array of failed requirement messages
- **Example**: `["Must be at least 10 characters", "Must contain uppercase letter"]`
- **Empty array**: Password is valid

#### `handleSubmit()`
Submits password change request.
- **Validations**:
  - Confirms new password matches confirmation
  - Checks all password requirements
- **API Call**: `POST /api/auth/change-password`
- **Success**: Redirect to dashboard after 2 seconds
- **Error**: Display error message

**Features**:
- ✅ Real-time validation display
- ✅ Requirement checklist (same as registration)
- ✅ Current password verification
- ✅ Confirm password field
- ✅ Success message with redirect
- ✅ Error handling and display

---

### 7. **Dashboard.tsx** - Report List & Overview
**Purpose**: Display all available reports for user, organized by category

**Features**:
- ✅ List of available reports
- ✅ Category-based organization
- ✅ Quick access to recent reports
- ✅ File metadata display
- ✅ Navigation to analysis pages
- ✅ File name truncation with ellipsis

**Dark Theme**: Same color palette as Statistics page

---

### 8. **CategoryMenu.tsx** - Sidebar File Browser
**Purpose**: Side navigation showing report categories and files

**Features**:
- ✅ Expandable categories
- ✅ File list with icons
- ✅ File count display
- ✅ Navigation to report pages
- ✅ **File name truncation with ellipsis** (fixed in this session)
- ✅ Tooltip showing full filename on hover

**Styling for File Name**:
```css
/* Prevent overflow and show ellipsis */
overflow-hidden
whitespace-nowrap
overflow-hidden
text-ellipsis
```

---

## Utility Functions

### `buildCounts(rows, column, top = 999): ChartPoint[]`
**File**: `src/pages/Statistics.tsx` (Line 38)
**Purpose**: Generate frequency count of column values

```typescript
const buildCounts = (
  rows: Record<string, any>[],
  column?: string,
  top = 999
): ChartPoint[] => {
  if (!column) return [];
  const counts = new Map<string, number>();
  
  rows.forEach((row) => {
    const raw = row[column];
    if (raw === null || raw === undefined) return;
    const key = String(raw).trim();
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, y]) => ({ name, y }));
};
```

**Algorithm**:
1. Create empty Map for counting
2. Iterate rows, accumulate counts for each unique value
3. Convert to array and sort by count descending
4. Slice to `top` items
5. Format as `{name, y}` for Highcharts

**Time Complexity**: O(n log n) due to sort
**Space Complexity**: O(m) where m = unique values

---

### `tryGetUserId(): number`
**File**: `src/pages/Statistics.tsx` (Line 56)
**Purpose**: Safely extract userId from localStorage

```typescript
const tryGetUserId = () => {
  const userData = localStorage.getItem("user");
  if (!userData) return 1;
  try {
    const parsed = JSON.parse(userData);
    return parsed?.userId || 1;
  } catch (e) {
    return 1;
  }
};
```

**Error Handling**: Returns default 1 if:
- localStorage.user doesn't exist
- JSON parse fails
- No userId in parsed object

---

### `validatePassword(password: string): boolean`
**File**: `src/pages/Login.tsx` and `src/pages/ChangePassword.tsx`
**Purpose**: Check if password meets all security requirements

```typescript
const validatePassword = (password: string): boolean => {
  const hasLength = password.length >= 10;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasLength && hasUpper && hasLower && hasNumber && hasSymbol;
};
```

**Requirements Met**:
- ✅ 10+ characters
- ✅ Uppercase letter
- ✅ Lowercase letter
- ✅ Number
- ✅ Symbol

---

## Data Flow

### User Authentication Flow
```
User enters credentials
         ↓
[Login.tsx] sends POST /api/auth/login
         ↓
Backend validates & returns JWT token
         ↓
Token stored in localStorage
         ↓
Redirect to Dashboard
```

### Report Analysis Flow
```
Dashboard.tsx displays available reports
         ↓
User selects category
         ↓
[Statistics.tsx] fetchCategories() loads periods
         ↓
User selects report → fetchReport(reportId)
         ↓
Backend returns CSV headers + rows
         ↓
User selects column + chart type
         ↓
buildCounts() generates frequency data
         ↓
DynamicChart renders Highcharts
```

### Dynamic Filtering Flow
```
User selects filter column
         ↓
uniqueValuesForColumn useMemo populates dropdown
         ↓
User selects filter value
         ↓
User clicks "Aplicar filtros" button
         ↓
aplicarFiltros() sets appliedDynamicFilter
         ↓
filteredRows useMemo recalculates
         ↓
Chart re-renders with filtered data
```

### Sort Flow (ReportAnalysis)
```
User clicks table header
         ↓
handleHeaderClick() called
         ↓
Check if same column: yes → toggle direction / no → sort ascending
         ↓
sortColumn + sortDirection state updated
         ↓
sortedRows useMemo recalculates
         ↓
Table re-renders with new sort
```

---

## API Endpoints

### Authentication Service (Port 2081)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | User login with email/password |
| POST | `/api/auth/register` | New user registration |
| POST | `/api/auth/change-password` | Change user password |
| GET | `/api/auth/user/{id}` | Get user profile info |

### Report Service (Port 2084)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/reports/csv/categories/{userId}` | List all categories & periods for user |
| GET | `/api/reports/csv/{reportId}?userId={userId}` | Get full CSV report (headers + rows) |
| POST | `/api/reports/csv/upload` | Upload new CSV file |
| GET | `/api/reports/csv/{reportId}/download` | Download report as CSV |
| DELETE | `/api/reports/csv/{reportId}` | Delete report |

### Data Service (Port 2082)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/data/validate/{reportId}` | Validate data quality |
| POST | `/api/data/transform` | Transform data format |

### Upload Service (Port 2083)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/upload/csv` | Upload CSV file |
| GET | `/api/upload/status/{uploadId}` | Check upload status |

---

## State Management

### Component State vs Context
- **Local Component State**: Form inputs, UI toggles, sorting
- **localStorage**: User profile (name, email, photo), user ID
- **React Context** (if used): Global auth state, notifications

### Key localStorage Keys
```javascript
// User data (set on login)
localStorage.getItem("user") // {userId, email, name, ...}

// Profile photo (set on upload)
localStorage.getItem("profileImage") // base64 data URL

// Session token (from backend)
localStorage.getItem("token") // JWT token
```

### useMemo Optimization
Used in Statistics.tsx to prevent recalculation:
```typescript
// Recalculates only when report or filterColumnDynamic changes
const uniqueValuesForColumn = useMemo(() => {
  // expensive computation
}, [report, filterColumnDynamic]);

// Recalculates only when report or appliedDynamicFilter changes
const filteredRows = useMemo(() => {
  // filter logic
}, [report, appliedDynamicFilter]);
```

---

## Styling & Themes

### Dark Theme Color Palette
```javascript
const colors = [
  "#1e40af",  // Deep Blue
  "#0369a1",  // Cyan Blue
  "#0891b2",  // Teal
  "#5b21b6",  // Purple
  "#be185d",  // Magenta
  "#92400e"   // Brown
];
```

### Primary Colors
| Element | Color | Usage |
|---------|-------|-------|
| Primary Buttons | `#0f2a44` (dark navy) | "Aplicar filtros", selects |
| Hover Buttons | `#163a5d` (lighter navy) | Button hover state |
| Logout Button | `#dc2626` (red) | Red danger color |
| Sidebar | `#0f2a44` | Navigation background |
| Text | `#1f1f1f` or `#374151` | Body text |
| Borders | `#e5e7eb` | Light gray |
| Pie Chart Text | `#1f2937` | Dark gray for contrast |

### Tailwind Classes Used
```css
/* Dark theme backgrounds */
bg-[#0f2a44]          /* Navy blue buttons */
bg-white              /* Card backgrounds */
bg-red-600            /* Logout button */

/* Text styling */
text-gray-600         /* Secondary text */
text-white            /* On dark backgrounds */
text-sm, text-3xl     /* Various sizes */

/* Layout */
grid grid-cols-1 md:grid-cols-3   /* Responsive 3-column */
flex items-center gap-2            /* Flexbox with spacing */

/* Overflow handling */
truncate              /* Add ... for overflow */
overflow-hidden       /* Hide overflow */
text-ellipsis         /* Show ... */
whitespace-nowrap     /* Prevent wrapping */
min-w-0               /* Allow flex child to shrink */
```

---

## Installation & Deployment

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Java 17+
- PostgreSQL (or use Docker)

### Frontend Setup
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Build Docker image
docker build -t dashboard-frontend .

# Run in Docker Compose
docker-compose up -d frontend
```

### Environment Variables
```bash
# .env (if needed)
VITE_API_URL=http://localhost:2081
VITE_REPORT_API=http://localhost:2084
```

### Docker Compose Services
```yaml
# Key services in docker-compose.yml
frontend:
  image: node:20
  ports: ["2080:3000"]  # nginx reverse proxy

auth-service:
  image: java:17
  ports: ["2081"]

data-service:
  image: java:17
  ports: ["2082"]

upload-service:
  image: java:17
  ports: ["2083"]

report-service:
  image: java:17
  ports: ["2084"]

postgres:
  image: postgres:14
  
mongodb:
  image: mongo:latest
  
redis:
  image: redis:latest
```

### Verify Deployment
```bash
# Check all containers running
docker-compose ps
# Expected: 9/9 containers Up

# Test frontend
curl http://localhost:2080

# Test API
curl http://localhost:2084/api/reports/csv/categories/1

# View logs
docker-compose logs -f frontend
```

---

## Performance Considerations

### Optimization Strategies
1. **useMemo**: Prevents expensive recalculations
2. **Highcharts**: Uses native browser rendering
3. **Lazy Loading**: Charts render on demand
4. **Pagination**: Large datasets paginated in tables
5. **Caching**: Redis caches report metadata

### Known Limitations
- Max 200 unique values in filter dropdown
- Charts render all data points (no sampling)
- Large CSV files (1M+ rows) may be slow
- No virtual scrolling in tables yet

### Future Optimizations
- Virtual scrolling for large tables
- Client-side data sampling for mega-charts
- Service Worker for offline support
- Image optimization for profile photos

---

## Development Guidelines

### Code Quality
- ✅ All components documented with JSDoc
- ✅ Utility functions have clear signatures
- ✅ Dead code removed (no unused functions)
- ✅ Type safety with TypeScript
- ✅ Dark theme consistently applied

### Adding New Features
1. Create component in `src/components/` or `src/pages/`
2. Add TypeScript types in `src/types/`
3. Use existing `buildCounts()` for frequency data
4. Add JSDoc comments to functions
5. Use Tailwind for dark theme styling
6. Test with all chart types if applicable
7. Build & deploy via Docker

### Common Tasks
**Add a new chart type to DynamicChart**:
1. Add type to union: `"bar" | "pie" | ... | "newType"`
2. Add case in switch statement
3. Configure Highcharts options
4. Test with sample data

**Add a new filter criteria**:
1. Add state variables for filter inputs
2. Update `aplicarFiltros()` logic
3. Update `filteredRows` useMemo
4. Add UI controls in Statistics component

**Fix text overflow**:
1. Add `min-w-0` to flex parent
2. Add `overflow-hidden text-ellipsis whitespace-nowrap` to text element
3. Optional: Add `title` attribute for tooltip

---

## Troubleshooting

### Chart not rendering
- Check if column has data: `buildCounts()` returns empty array
- Verify chart type is supported
- Check browser console for Highcharts errors
- Ensure report data is loaded before rendering

### Filter not applying
- Verify column name matches exactly (case-sensitive)
- Check if filter value exists in data
- Click "Aplicar filtros" button (not just select)
- Verify filter state updated in React DevTools

### File name overflowing
- Check if `min-w-0` is on flex parent
- Verify `overflow-hidden` and `text-ellipsis` on text element
- Test in browser at different widths
- Add `title` attribute for tooltip

### Password validation failing
- Check all 5 requirements met:
  - ✅ 10+ chars
  - ✅ Uppercase A-Z
  - ✅ Lowercase a-z
  - ✅ Number 0-9
  - ✅ Symbol !@#$%^&*

### Backend API not responding
- Check service is running: `docker-compose ps`
- Verify port is correct (2081-2084)
- Check firewall allows connection
- View logs: `docker-compose logs report-service`

---

## License & Project Context

This dashboard is built as part of an **architecture/governance thesis project** exploring:
- Data governance patterns in enterprise systems
- Role-based access control implementation
- Compliance & audit trails for data access
- Challenges in centralizing disparate data sources
- Real-world obstacles to data democratization

---

**Last Updated**: June 9, 2025  
**Maintainer**: Development Team  
**Status**: ✅ Production Ready
