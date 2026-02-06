# EBIS Functional Requirements Documentation

## Work Order Module

### Overview
The Work Order module is the core operational component of EBIS, managing aircraft maintenance work orders from creation through completion. It tracks labor, parts, outside repairs, and provides workflow management for technicians and administrators.

---

### 1. Work Order Navigation & Search

#### 1.1 Find Work Order
**URL:** `/workorder/aircraft`

**Purpose:** Search for existing work orders across the system.

**Search Fields:**
| Field | Type | Description |
|-------|------|-------------|
| City | text (disabled) | Pre-selected city code |
| Work Order | text | Work order ID number |
| Registration No. | text | Aircraft registration number |
| A/C Serial | text | Aircraft serial number |
| Customer | text | Customer name search |
| Customer P/O | text | Customer purchase order number |
| Discrepancy | text | Search within discrepancy descriptions |
| Corrective Action | text | Search within corrective actions |
| Part Number | text | Part number search |
| Part Description | text | Part description search |
| Mine Only | checkbox | Filter to current user's work orders |
| Is Quote | checkbox | Filter to quotes only |

**Business Rules:**
- City is pre-selected based on user's default or last selected city
- Search is scoped to the selected city
- Multiple search criteria can be combined

---

#### 1.2 Work Order List Views

**Available Views:**
| View | URL | Description |
|------|-----|-------------|
| My Open Items | `/workorder/aircraft` | Work orders assigned to current user |
| Open | `/workorder/aircraft/open` | All open work orders |
| All | `/workorder/aircraft/all` | All work orders (open and closed) |
| Open Quotes | `/workorder/aircraft/quotes/open` | Open quotes |
| All Quotes | `/workorder/aircraft/quotes/all` | All quotes |

**List View Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Work Order | text | Work order ID (format: CITY#####-MM-YYYY) |
| Reg. No. | text | Aircraft registration number |
| Serial | text | Aircraft serial number |
| Customer | text | Customer name |
| Info | text | Aircraft make/model/year |
| Type | text | WO (Work Order) or Quote |
| Items | text | Format: complete/open/total |
| Parts | text | Format: complete/open/total |
| Status | text | Current work order status |
| Status Notes | text | Additional status information |
| Last Worked | date | Date last worked on |
| Created Date | date | Work order creation date |
| Due Date | date | Target completion date |
| Sales Person | text | Assigned sales person |

**Filters:**
- Filter by Open Status (dropdown)
- Pagination: 25/50/100 per page

**User Actions:**
- Double-click row to open work order detail
- Sort by any column
- Export to report

---

### 2. Work Order Detail

#### 2.1 Work Order Header
**URL:** `/workorder/[id]/item/[itemId]`

**Display Information:**
- Work Order Number
- Due Date (with icon indicator)
- Aircraft Registration Number
- Aircraft Make/Model/Year
- Serial Number
- Customer Name
- Status (dropdown for status change)

---

#### 2.2 Left Sidebar Navigation

**Work Flow Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Workflow | icon | Kanban-style workflow view |
| ADA | icon | Activity Dashboard Analysis |
| Items | count | Work items list |
| List Items | count | Detailed items table |
| List Parts | count | All parts across items |
| Kits | count | Applied labor kits |
| List OSR | count | Outside repairs list |
| Config & Billing | - | Work order configuration |

**Aircraft Group:**
| Tab | Description |
|-----|-------------|
| Readings | Aircraft meter readings |
| Aircraft Detail | Aircraft information |
| Cylinders | Engine cylinder data |
| Item Signoffs | All signoffs for work order |

**History Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| W/O History | count | Previous work orders |
| Parts History | - | Parts transaction history |

**Media Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Media | count | Work order attachments |
| A/C Media | count | Aircraft-specific media |
| Fleet Media | count | Fleet-wide media |

**Documents Group:**
| Tab | Description |
|-----|-------------|
| Reports | Generate reports |
| Log Books | Log book entries |

**Activity Group:**
| Tab | Description |
|-----|-------------|
| Tech Activity | Technician time tracking |
| Edit History | Change audit log |

---

### 3. Work Order Items

#### 3.1 Item Detail
**URL:** `/workorder/[id]/item/[itemId]`

**Main Info Section:**
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| Discrepancy | text-limited | 4000 chars max | Problem description |
| Corrective Action | text-limited | 8000 chars max | Resolution description |
| Category | dropdown | Required | Work item category (e.g., Airworthy Airframe) |
| Sub Category | dropdown | Optional | Sub-category classification |
| Action Category | dropdown | Optional | Action type classification |
| Labor Kit | lookup | Optional | Associated labor kit template |
| ATA Code | text | Optional | ATA chapter code reference |
| Grouping | dropdown | Optional | Item grouping |
| Warranty Vendor | dropdown | Optional | Vendor for warranty work |
| Enable RII | checkbox | - | Enable Required Inspection Item |
| Notes | text-limited | 4000 chars max | Internal notes |
| Always Show Notes | checkbox | - | Display notes prominently |
| Created By | text (readonly) | - | Creator and timestamp |

**Billing Section:**
| Field | Type | Description |
|-------|------|-------------|
| Owner Auth | dropdown | Authorization status (Open, Authorized, etc.) |
| Hours Estimate | numeric | Estimated labor hours |
| Labor Kit: Display Items | dropdown | How to display kit items |
| Department | dropdown | Department assignment |
| Billing Method | dropdown | Flat Rate or Hourly |
| Billing Customer | dropdown | Customer to bill |
| Flat Rate | currency | Flat rate amount |
| Flat Rate Qty | numeric | Flat rate quantity/multiplier |
| Ship In | currency | Inbound shipping charge |
| Use Flat Part Charge | checkbox | Use flat charge for parts |
| Do Not Bill | checkbox | Exclude from billing |
| Do Not Tax Shop Labor | checkbox | Exclude labor from tax |

**Log Books Section:**
| Field | Type | Description |
|-------|------|-------------|
| Log Book Category | table | Log book entries (Airframe, Engine, etc.) |

---

#### 3.2 Item Service (Labor Tracking)
**URL:** `/workorder/[id]/item/[itemId]/service`

**Purpose:** Track technician labor hours on work items.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Technician | text | Technician name |
| Total Hrs. | numeric | Total hours worked |
| Timer Hrs. | numeric | Hours from timer |
| Override Hrs. | numeric | Manually entered hours |
| O/T Hrs. | numeric | Overtime hours |
| Last Worked | date | Most recent work date |
| Is Training | checkbox | Training indicator |
| Training Signoff | text | Training approval |
| Notes | text | Labor notes |

**Summary Row:** Displays totals for all hour columns.

**User Actions:**
- Add technician labor entry
- Edit existing entries
- Delete entries
- Start/stop timer

---

#### 3.3 Item Parts
**URL:** `/workorder/[id]/item/[itemId]/part`

**Purpose:** Manage parts required for work item.

**Part Detail Fields:**
| Field | Type | Section | Description |
|-------|------|---------|-------------|
| Item Number | text (readonly) | Main Info | Parent item reference |
| Part Number | lookup | Main Info | Part number with search |
| Description | text-limited (256) | Main Info | Part description |
| Qty Needed | numeric | Main Info | Quantity required |
| Qty Used | numeric (readonly) | Main Info | Quantity consumed |
| Date Needed | date | Main Info | Required by date |
| Request Status | dropdown | Main Info | Part request status |
| Notes | text-limited (3999) | Main Info | Part notes |
| Part Status | text (readonly) | Order Status | Current procurement status |
| ETA | text (readonly) | Order Status | Expected arrival |
| Order Notes | text (readonly) | Order Status | Procurement notes |
| Install Type | dropdown | Install Info | Installation type |
| Install Date | date | Install Info | Date installed |
| Service Date | date | Install Info | Service/overhaul date |
| Serial New | text | Install Info | New part serial |
| Lot | text | Install Info | Lot number |
| Part Condition | dropdown | Install Info | Part condition |
| Install Notes | text-limited (255) | Install Info | Installation notes |
| Remove Date | date | Install Info | Removal date |
| Serial Old | text | Install Info | Removed part serial |
| Part Number Old | text | Install Info | Removed part number |
| Cost | currency | Price Info | Part cost |
| Retail | currency | Price Info | Retail price |
| Unit Price Override | currency | Price Info | Override price |
| Final Unit Price | currency (readonly) | Price Info | Calculated final price |
| Ship In | currency | Price Info | Inbound shipping |
| Ship Out | currency | Price Info | Outbound shipping |
| Do Not Tax | checkbox | Price Info | Tax exemption |
| Date Received | date | Inspection Info | Receipt date |
| Purchase Order | combobox-search | Inspection Info | Associated P/O |
| Vendor | combobox-search | Inspection Info | Part vendor |
| Invoice Number | text | Inspection Info | Vendor invoice |
| Inspected By | combobox-search | Inspection Info | Inspector |
| Approved | dropdown | Inspection Info | Approval status |
| Warranty Date | date | Inspection Info | Warranty expiration |

---

#### 3.4 Item Outside Repair (OSR)
**URL:** `/workorder/[id]/item/[itemId]/osr`

**Purpose:** Track parts sent to outside vendors for repair.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Vendor | text | Repair vendor name |
| Part Number | text | Part being repaired |
| Description | text | Part description |
| Serial Old | text | Original serial number |
| Serial New | text | New/repaired serial |
| Labor | currency | Vendor labor charge |
| Parts | currency | Vendor parts charge |
| Ship In | currency | Inbound shipping |
| Ship Out | currency | Outbound shipping |
| P/O | text | Purchase order reference |
| Invoice | text | Vendor invoice number |

**User Actions:**
- Add outside repair entry
- Edit existing entries
- Link to purchase order
- Track repair status

---

#### 3.5 Item Tools
**URL:** `/workorder/[id]/item/[itemId]/tool`

**Purpose:** Track special tools required for work item.

**Filters:**
| Filter | Type | Description |
|--------|------|-------------|
| Current Tools Only | dropdown | Show only currently assigned tools |
| Hide Tools in Kits | dropdown | Exclude tools from labor kits |

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Name | text | Tool name/identifier |
| Description | text | Tool description |
| Added By | text | User who assigned tool |
| Transfer Date | date | Date tool was assigned |
| Tool Type | text | Tool classification |

**User Actions:**
- Assign tool to item
- Remove tool assignment
- Transfer tool to another item

---

#### 3.6 Item Signoffs
**URL:** `/workorder/[id]/item/[itemId]/itemsignoff`

**Purpose:** Manage inspection signoffs for work item completion.

**Header:**
- Override Inspector button (change signoff user)
- Using Logged In Account: [Current User]

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Rank | numeric | Signoff priority/order |
| Signoff | text | Signoff type name |
| Signoff By | text | Inspector who signed |
| Signoff Date | date | Date of signoff |

**Standard Signoff Types:**
- Final Inspection
- Function Check
- Hidden Damage
- In Process 1, 2, 3, 4
- Leak Check
- Prelim Inspection
- Ready for Inspection

**Business Rules:**
- Signoffs may be required based on category
- Some signoffs require specific user roles
- RII items require additional signoffs
- Signoff order may be enforced

---

### 4. Workflow View
**URL:** `/workorder/[id]/workflow`

**Purpose:** Kanban-style board for managing work item status progression.

**Filter:**
- Select Category (dropdown) - Filter by work item category

**Status Columns:**
| Column | Description |
|--------|-------------|
| Open Items | Newly created, not started |
| Waiting for Parts | Blocked pending parts |
| In Progress | Currently being worked |
| Tech Review | Awaiting technician review |
| Admin Review | Awaiting administrative review |
| Finished | Completed items |

**Item Card Display:**
- Item number and category
- Status indicator
- Discrepancy description (truncated)
- For finished items: Techs link, Parts link, Signoffs progress, Hours estimate

**User Actions:**
- Click item to open detail
- Drag items between columns (status change)
- Filter by category

---

### 5. ADA (Activity Dashboard Analysis)
**URL:** `/workorder/[id]/ada/summary`

**Purpose:** Dashboard view of work order progress and metrics.

**Sub-tabs:**
- Item Summary
- Item Overruns

#### 5.1 Item Summary

**Item Status Section:**
| Metric | Description |
|--------|-------------|
| Open Items | Count of items not finished |
| Inspect/Review | Count in inspection or review |
| Finished | Count of completed items |

**Hours Worked Section:**
- Chart displaying hours by technician

**Technicians Section:**
- List of technicians who worked on W/O
- Hours per technician

**Parts Used Section:**
| Metric | Description |
|--------|-------------|
| Received | Parts received |
| Ordered | Parts on order |
| Open | Parts needed but not ordered |

**Part Types Section:**
- Breakdown by part category

**Charts:**
- Items Finished (Last 7 Days) - trend chart
- Hrs. Worked (Last 7 Days) - trend chart

---

### 6. Config & Billing

#### 6.1 General Configuration
**URL:** `/workorder/[id]/config`

**Main Info Section:**
| Field | Type | Description |
|-------|------|-------------|
| Work Order | text (readonly) | W/O number |
| City | text (readonly) | City code |
| W/O Type | text (readonly) | Work order type |
| Status Notes | text-limited (255) | Status description |
| Work Center | dropdown | Assigned work center |
| Customer | lookup (readonly) | Customer with search |
| Registration No. | text (readonly) | Aircraft registration |
| Customer PO Number | text | Customer P/O reference |
| Quote Number | text | Quote reference |
| Invoice Number | text | Invoice number |
| Due Date | date | Target completion |
| Meter Display Date | date | Meter reading date |
| Invoice Date | date | Invoice date |
| Override Invoice Instructions | dropdown | Invoice instruction override |
| Lead Technician | combobox-search | Primary technician |
| Sales Person | combobox-search | Sales representative |
| Priority | dropdown | Work order priority |

**Important Dates Section:**
| Field | Type | Description |
|-------|------|-------------|
| Created Date | text (readonly) | Creation timestamp |
| Completed By | text (readonly) | Completing user |
| Completed Date | text (readonly) | Completion timestamp |
| Completed First | text (readonly) | First completion timestamp |

---

#### 6.2 Billing Configuration
**URL:** `/workorder/[id]/config/billing`

**Labor Section:**
| Field | Type | Description |
|-------|------|-------------|
| Labor Billing Style | dropdown | Billing calculation method |
| Labor Rate | currency | Hourly rate |
| Minimum Hours | numeric | Minimum billable hours |
| Labor Discount | percentage | Discount on labor |
| Overtime Percentage | percentage | OT rate multiplier |
| Overtime Labor Rate | currency | OT hourly rate |
| Hours for Inspection | numeric | Inspection hours |

**Parts Section:**
| Field | Type | Description |
|-------|------|-------------|
| Use Parts Discount | checkbox | Enable parts discount |
| Parts Discount is Over Cost | checkbox | Discount calculation method |
| Parts Discount | percentage | Discount percentage |
| Parts Matrix | checkbox | Use pricing matrix |
| Use Parts Dealer Pricing | checkbox | Use dealer pricing |

**Outside Repair Section:**
| Field | Type | Description |
|-------|------|-------------|
| OSR Labor Markup | percentage | Markup on vendor labor |
| OSR Parts Markup | percentage | Markup on vendor parts |
| OSR Labor Markup Cap | currency | Maximum labor markup |
| OSR Parts Markup Cap | currency | Maximum parts markup |

**Shop Supplies Section:**
| Field | Type | Description |
|-------|------|-------------|
| Shop Supplies Method | dropdown | Calculation method |
| Shop Supplies % Method | dropdown | Percentage basis |
| Shop Supplies Include | dropdown | What to include |
| Shop Supplies Percentage | percentage | Percentage rate |

**Misc. Charges Section:**
| Field | Type | Description |
|-------|------|-------------|
| Misc Charges Amount | currency | Flat misc charge |
| Misc. Charges Notes | text-limited (3999) | Charge description |
| Misc. Charges Markup | percentage | Markup percentage |

**Other Section:**
| Field | Type | Description |
|-------|------|-------------|
| Currency | dropdown | Currency code |
| Terms | dropdown | Payment terms |
| Bill At Cost | checkbox | Bill at cost (no markup) |
| No Charge on Shipping | checkbox | Free shipping |
| Credit Card Fee | percentage | CC processing fee |
| Shipping Markup | percentage | Shipping markup |
| Invoice Discount Method | dropdown | Discount calculation |
| Invoice Discount | percentage | Invoice discount |

---

### 7. Readings
**URL:** `/workorder/[id]/readings`

**Purpose:** Record aircraft meter readings at time of service.

**Dynamic Sections:** Based on aircraft meter profile (e.g., Airframe, Engine 1, Engine 2)

**Fields per Meter:**
| Field | Type | Description |
|-------|------|-------------|
| [Meter Name] | numeric | Current reading (hours, cycles, landings, etc.) |

---

### 8. List Views

#### 8.1 List Items
**URL:** `/workorder/[id]` (List Items tab)

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Item | text | Item number |
| Discrepancy | text | Problem description |
| Corrective Action | text | Resolution description |
| Category | text | Work category |
| Item Status | text | Current status |
| TTL Hrs | numeric | Total hours |
| EST Hrs | numeric | Estimated hours |
| REM Hrs | numeric | Remaining hours |
| Parts | text | Parts count |
| # Active | numeric | Active technicians |
| Last Worked | date | Last work date |
| All S/O | text | All signoffs status |
| PRI S/O | text | Primary signoffs status |
| Auth | text | Authorization status |
| Billing | text | Billing method |
| Department | text | Department |
| # Media | numeric | Attached media count |

---

#### 8.2 List Parts
**URL:** `/workorder/[id]/part`

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Item | text | Parent item number |
| Discrepancy | text | Item discrepancy |
| Category | text | Item category |
| Part Number | text | Part number |
| Description | text | Part description |
| Qty Needed | numeric | Quantity required |
| Qty Used | numeric | Quantity consumed |
| Price Ea. | currency | Unit price |
| Ship In | currency | Inbound shipping |
| Ship Out | currency | Outbound shipping |
| Status | text | Part status |
| P/O | text | Purchase order |
| Eta | date | Expected arrival |
| Order Notes | text | Procurement notes |

---

### 9. Business Rules Summary

#### Work Order Lifecycle:
1. **Created** - Initial state when W/O is opened
2. **Scheduled** - W/O has a due date and is scheduled
3. **Open** - Work has begun
4. **In Progress** - Active work being performed
5. **Tracking** - Monitoring status
6. **Pending** - Awaiting action/parts
7. **In Review** - Undergoing review
8. **Completed** - All work finished

#### Item Status Flow:
1. Open Items
2. Waiting for Parts (if parts needed)
3. In Progress
4. Tech Review
5. Admin Review
6. Finished

#### Signoff Requirements:
- Items may require specific signoffs based on category
- RII (Required Inspection Item) requires additional inspector signoffs
- Signoffs can be ordered by rank
- Some signoffs require specific user roles/certifications

#### Billing Rules:
- Flat Rate: Fixed price regardless of actual hours
- Hourly: Billed based on actual time worked
- Parts can be billed at cost, retail, or with markup/discount
- Shop supplies can be calculated as percentage of labor, parts, or both
- Overtime rates apply after standard hours exceeded

---

### 10. Integration Points

- **Aircraft Module**: Links to aircraft detail, readings, history
- **Customer Module**: Customer lookup for billing
- **Vendor Module**: Outside repair vendor selection
- **Purchase Order Module**: Parts ordering and receiving
- **Master Parts Module**: Part lookup and inventory
- **Tools Module**: Tool assignment and tracking
- **Time Clock Module**: Technician time tracking
- **Scheduler Module**: Work order scheduling

---

## Aircraft Module

### Overview
The Aircraft module manages the aircraft fleet database, tracking aircraft information, maintenance compliance, customer relationships, and service history. It serves as the central repository for aircraft data that connects to work orders, parts catalogs, and billing configurations.

---

### 1. Aircraft Navigation & List

#### 1.1 Aircraft List
**URL:** `/aircraft`

**Purpose:** View and search all aircraft in the system.

**Module Tabs:**
| Tab | URL | Description |
|-----|-----|-------------|
| List | `/aircraft` | All aircraft with count badge |
| Compliance | `/aircraft/compliance` | Cross-aircraft compliance tracking |
| Reports | `/aircraft/reports` | Compliance-related reports |

**List View Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Reg. No. | text | Aircraft registration number |
| Make | text | Aircraft manufacturer |
| Model | text | Aircraft model |
| Year | text | Year built |
| Meter Profile | text | Assigned meter profile (e.g., SR2X, SF50) |
| Primary Customer | text | Primary customer name |
| CPL # | numeric | Compliance item count |
| Media | numeric | Attached media count |

**Features:**
- Global search bar with keyboard shortcut (Ctrl+K)
- Sortable columns (default: Reg. No. ascending)
- Row selection checkboxes
- Pagination: 25/50/100 per page
- Double-click row to open aircraft detail

---

### 2. Aircraft Detail

#### 2.1 Aircraft Header
**URL:** `/aircraft/[id]`

**Display Information:**
- Registration Number (e.g., 1221z)
- Meter Profile (e.g., SR2X)
- Model information (e.g., SR22, Cirrus 2021)
- Serial Number

---

#### 2.2 Left Sidebar Navigation

**Aircraft Info Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Main Info | - | Primary aircraft information |
| Detail | - | Detailed aircraft specifications |
| Readings | - | Meter readings history |
| Cylinders | count | Engine cylinder data |
| Compliance | count | Compliance items for this aircraft |
| Continued Items | count | Deferred maintenance items |

**Relationships Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Customers | count | Linked customer accounts |

**Media Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Media | count | Aircraft-specific attachments |
| Fleet Media | count | Fleet-wide media |

**History Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| W/O History | count | Work order history |
| OSR History | - | Outside repair history |
| Parts History | - | Parts installation history |

**Parts Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Parts Catalog | count | Parts associated with aircraft |

**Billing Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Contract Pricing | count | Contract-specific pricing |
| Billing Override | - | Aircraft billing overrides |
| Tax Override | - | Aircraft tax overrides |

**Audit Group:**
| Tab | Description |
|-----|-------------|
| Edit History | Change audit log |

**Documents Group:**
| Tab | Description |
|-----|-------------|
| Reports | Generate aircraft reports |

---

### 3. Main Info Tab
**URL:** `/aircraft/[id]`

#### 3.1 Main Info Section
| Field | Type | Description |
|-------|------|-------------|
| Meter Profile | lookup (disabled) | Assigned meter profile |
| Primary City | dropdown | Default service city (e.g., KTYS) |
| Customer | lookup (disabled) | Primary customer |
| Make | dropdown | Aircraft manufacturer |
| Model | dropdown | Aircraft model |
| Year Built | text | Year of manufacture |
| Serial Number | text | Aircraft serial number |
| Aircraft Class | dropdown | Aircraft classification |
| Fuel Code | dropdown | Fuel type code |
| Registration Expires | date | Registration expiration date |
| Warranty Expires | date | Warranty expiration date |
| Work Center | dropdown | Default work center |
| Cost Center | dropdown | Cost center assignment |
| User Status | dropdown | Custom status field |
| Department | dropdown | Department assignment |
| Location | text | Current location |
| Is Rental | checkbox | Rental aircraft indicator |
| Avg. Daily Utilization | numeric | Average daily usage hours |
| Notes | text | General notes |
| Parts Program Notes | text-limited (100) | Parts program information |

#### 3.2 Overrides Section
| Field | Type | Description |
|-------|------|-------------|
| Category Profile | dropdown | Category profile override |
| Fleet Config | searchable | Fleet configuration assignment |
| Parts Catalog | searchable | Parts catalog assignment |
| P/O Stock Room | dropdown | Default stock room for P/O |

#### 3.3 Billing Section
| Field | Type | Description |
|-------|------|-------------|
| Billing Profile | dropdown | Billing profile override |
| Tax Profile | dropdown | Tax profile override |

---

### 4. Detail Tab
**URL:** `/aircraft/[id]/detail?ID=[detailId]`

**Purpose:** Manage detailed aircraft specifications and maintenance dates.

**Features:**
- View History button to see previous detail records
- Current record indicator

#### 4.1 Date Section
| Field | Type | Description |
|-------|------|-------------|
| Date | date (disabled) | Detail record date |

#### 4.2 Next Due Section
| Field | Type | Description |
|-------|------|-------------|
| Next Annual | date | Next annual inspection due |
| Next ELT | date | Next ELT inspection due |
| Next Corrosion | date | Next corrosion inspection due |
| Next O/2 | date | Next oxygen system service due |
| Next FAR 411 | date | Next FAR 411 compliance due |
| Next FAR 413 | date | Next FAR 413 compliance due |

#### 4.3 Engine Section
| Field | Type | Description |
|-------|------|-------------|
| Engine SN | text | Engine serial number |
| Engine Make | text | Engine manufacturer |
| Engine Model | text | Engine model |
| Engine O/H Date | date | Last engine overhaul date |

#### 4.4 Propeller Section
| Field | Type | Description |
|-------|------|-------------|
| Prop 1 SN | text | Propeller serial number |
| Prop Make | text | Propeller manufacturer |
| Prop Model | text | Propeller model |
| Prop O/H Date | date | Last propeller overhaul date |
| Prop Last Bal | date | Last propeller balance date |

#### 4.5 Misc. Section
| Field | Type | Description |
|-------|------|-------------|
| Last Oil Date | date | Last oil change date |
| Last Oil Reading | numeric | Meter reading at last oil change |
| Battery Date | date | Battery installation date |
| Gross Weight | text | Aircraft gross weight |
| Maintenance Notes | text | General maintenance notes |

---

### 5. Readings Tab
**URL:** `/aircraft/[id]/readings?sortBy=Date%20DESC`

**Purpose:** View and manage all meter readings for the aircraft.

**Features:**
- Add Reading button
- Readings sorted by date (newest first)
- Dynamic fields based on meter profile

**User Actions:**
- Add new meter reading entry
- View reading history

---

### 6. Compliance Tab (Aircraft-Level)
**URL:** `/aircraft/[id]/compliance`

**Purpose:** Create and manage inspections and recurring maintenance for components.

**Search/Filter:**
- Compliance search box
- Type filter dropdown (All Types)
- Status Type filter dropdown (All Status Types)

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Type | text | Compliance type (Inspection, AD, Appliance) |
| Name | text | Compliance item name |
| Item | text | Item reference |
| Part Number | text | Associated part number |
| Serial No. | text | Component serial number |
| Start/Install | date | Start or installation date |
| Hrs Rmng | numeric | Hours remaining |
| Days Rmng | numeric | Days remaining |
| Due Date | date | Due date |
| Status | text | Status (Overdue, Impending, Upcoming) |
| Open W/O | text | Associated open work order |

**Features:**
- Bulk selection checkbox
- Pagination: 25/50/100 per page

---

### 7. Customers Tab
**URL:** `/aircraft/[id]/customer`

**Purpose:** View customers linked to this aircraft.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Name | text | Customer name |
| Phone | text | Phone number |
| City | text | Customer city |
| # A/C | numeric | Number of aircraft for customer |
| Last Work Order | text | Most recent work order |
| Last OTC Invoice | text | Most recent OTC invoice |

**User Actions:**
- Add customer link
- Remove customer link

---

### 8. W/O History Tab
**URL:** `/aircraft/[id]/history`

**Purpose:** View work order history for this aircraft.

**Filter:**
- Status dropdown (All, Open, Completed, Void)

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Work Order | text | Work order number |
| W/O Status | text | Work order status |
| Discrepancy | text | Work description |
| Reading | numeric | Meter reading at service |
| Created Date | date | Work order creation date |
| Created By | text | Creator |
| Comp. Date | date | Completion date |
| Comp. By | text | Completed by |
| Due Date | date | Due date |
| Parts | text | Parts count (used/total) |
| Registration No. | text | Registration number |

**User Actions:**
- Double-click to open work order

---

### 9. Parts Catalog Tab
**URL:** `/aircraft/[id]/partscatalog`

**Purpose:** View common parts associated with this aircraft based on fleet configuration.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Part Number | text | Part number |
| Description | text | Part description |
| Part Component | text | Component classification |
| Part Type | text | Part type (e.g., Avionics) |
| Line Code | text | Line code |
| Supplier | text | Part supplier |
| Media | numeric | Media attachment count |

**Features:**
- Sortable by Part Number (default)
- Pagination: 25/50/100 per page

---

### 10. Billing Override Tab
**URL:** `/aircraft/[id]/billingoverride`

**Purpose:** Configure aircraft-specific billing overrides that apply to work orders.

**Note:** "Changes made will not automatically affect open work orders"

**Features:**
- Resync Open W/Os button - Apply changes to existing open work orders

#### 10.1 Enable Options Section
| Field | Type | Description |
|-------|------|-------------|
| Use Billing Override | checkbox | Enable billing overrides |

#### 10.2 Labor Section
| Field | Type | Description |
|-------|------|-------------|
| Use Labor Billing Style | checkbox | Override labor billing style |
| Labor Billing Style | dropdown | Billing calculation method |
| Use Labor Rate | checkbox | Override labor rate |
| Labor Rate | currency | Hourly labor rate |
| Use Minimum Hours | checkbox | Override minimum hours |
| Minimum Hours | numeric | Minimum billable hours |
| Use Labor Discount | checkbox | Override labor discount |
| Labor Discount | percentage | Labor discount percentage |
| Use Overtime Percentage | checkbox | Override OT percentage |
| Overtime Percentage | percentage | OT multiplier |
| Use Overtime Labor Rate | checkbox | Override OT rate |
| Overtime Labor Rate | currency | OT hourly rate |
| Add Hours to Item for Inspection | checkbox | Add inspection hours |
| Hours for Inspection | numeric | Inspection hours to add |

#### 10.3 Parts Section
| Field | Type | Description |
|-------|------|-------------|
| Use Parts Discount | checkbox | Enable parts discount override |
| Parts Discount is Over Cost | checkbox | Discount over cost flag |
| Parts Discount | percentage | Parts discount percentage |
| Use Parts Matrix Override | checkbox | Override parts matrix |
| Parts Matrix | checkbox | Use parts matrix pricing |
| Use Parts Dealer Pricing | checkbox | Use dealer pricing |

#### 10.4 Outside Repair Section
| Field | Type | Description |
|-------|------|-------------|
| Use OSR Labor Markup | checkbox | Override OSR labor markup |
| OSR Labor Markup | percentage | OSR labor markup percentage |
| Use OSR Parts Markup | checkbox | Override OSR parts markup |
| OSR Parts Markup | percentage | OSR parts markup percentage |
| OSR Labor Markup Cap | currency | Maximum labor markup amount |
| OSR Parts Markup Cap | currency | Maximum parts markup amount |

#### 10.5 Shop Supplies Section
| Field | Type | Description |
|-------|------|-------------|
| Use Shop Supplies | checkbox | Override shop supplies |
| Shop Supplies Method | dropdown | Calculation method |
| Shop Supplies | currency | Shop supplies amount |

#### 10.6 Misc. Charges Section
| Field | Type | Description |
|-------|------|-------------|
| Use Misc Charges | checkbox | Override misc charges |
| Misc Charges Amount | currency | Misc charges amount |
| Misc. Charges Notes | text | Charge description |
| Use Misc. Charges Markup | checkbox | Override misc markup |
| Misc. Charges Markup | percentage | Misc markup percentage |

#### 10.7 Other Section
| Field | Type | Description |
|-------|------|-------------|
| Contract No. | text | Contract number reference |
| Currency | dropdown | Currency code |
| Terms | dropdown | Payment terms |
| Use Bill At Cost | checkbox | Override bill at cost |
| Bill At Cost | checkbox | Bill at cost flag |
| Use No Charge on Shipping | checkbox | Override shipping charge |
| No Charge on Shipping | checkbox | Free shipping flag |
| Credit Card Fee | percentage | Credit card fee percentage |
| Shipping Markup | percentage | Shipping markup percentage |
| Invoice Discount Method | dropdown | Discount method |
| Invoice Discount | percentage | Invoice discount percentage |

---

### 11. Module-Level Compliance
**URL:** `/aircraft/compliance`

**Purpose:** View and manage compliance items across all aircraft in the fleet.

**Description:** "Create and manage inspections and recurring maintenance for components for all aircraft"

**Search/Filter:**
- Compliance search box (Ctrl+Shift+K)
- Type filter dropdown (All Types)
- Status Type filter dropdown (All Status Types)
- A/C Class filter dropdown (All A/C Classes)

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Reg. No. | text (link) | Aircraft registration (links to aircraft) |
| Model | text | Aircraft model |
| Type | text | Compliance type (Inspection, AD, Appliance) |
| Name | text | Compliance item name |
| Item | text | Item reference number |
| Part Number | text | Associated part number |
| Serial No. | text | Component serial number |
| Start/Install | date | Start or installation date |
| Hrs Rmng | numeric | Hours remaining |
| Cycl Rmng | numeric | Cycles remaining |
| Lngs Rmng | numeric | Landings remaining |
| Bat Rmng | numeric | Battery remaining |
| Days Rmng | numeric | Days remaining |
| Due Date | date | Compliance due date |
| Status | text | Status indicator (Overdue, Impending, Upcoming) |
| Open W/O | text | Associated open work order |

**Status Indicators:**
- **Overdue** - Past due compliance item
- **Impending** - Due soon (within threshold)
- **Upcoming** - Future due date

**Features:**
- Bulk selection checkbox
- Pagination: 25/50/100 per page (234 Total items in sample)

---

### 12. Module-Level Reports
**URL:** `/aircraft/reports`

**Purpose:** View and export data based on custom search criteria.

**Available Reports:**

#### Compliance Section
| Report | Description |
|--------|-------------|
| Compliance Listing | Compliance Detail Listing |

#### Compliance - Upcoming Section
| Report | Description |
|--------|-------------|
| Upcoming Compliance - All | Listing of all upcoming Compliance Items |
| Upcoming Compliance - Airframe | Listing of upcoming Airframe Compliance Items |
| Upcoming Compliance - Engine | Listing of upcoming Engine Compliance Items |
| Upcoming Compliance - Inspection | Listing of upcoming Inspection Compliance Items |

**Export Options:**
- PDF export
- Excel export

---

### 13. Business Rules Summary

#### Aircraft Data Relationships:
- Each aircraft has one Primary Customer
- Aircraft can be linked to multiple Customers
- Meter Profile determines available meter readings
- Parts Catalog is derived from Fleet Config assignment
- Billing Override settings cascade to work orders

#### Compliance Types:
- **Inspection** - Scheduled maintenance inspections (50-Hour, 100-Hour, Annual)
- **AD** - Airworthiness Directives (regulatory requirements)
- **Appliance** - Component-level compliance (Alternators, Servos, etc.)

#### Compliance Status Calculation:
- Based on Hours, Cycles, Landings, or Calendar Days remaining
- Status determined by proximity to due date/value
- Overdue items highlighted for attention

#### Billing Override Hierarchy:
1. Aircraft-level billing overrides (if enabled)
2. Customer-level billing settings
3. System default billing configuration

---

### 14. Integration Points

- **Work Order Module**: Creates work orders for aircraft, links to history
- **Customer Module**: Customer relationship management
- **Master Parts Module**: Parts catalog association
- **Compliance Module**: Compliance tracking and scheduling
- **Purchase Order Module**: P/O stock room assignment
- **Reports Module**: Aircraft and compliance reporting

---

## Master Parts Module

### Overview
The Master Parts module manages the master list of parts and inventory across all stock rooms. It provides comprehensive part information management, stock tracking, physical inventory capabilities, pricing controls, and integration with work orders, purchase orders, and over-the-counter sales.

---

### 1. Master Parts Navigation & List

#### 1.1 Master Parts List
**URL:** `/masterpart`

**Purpose:** View and search all parts in the master parts database.

**Module Tabs:**
| Tab | URL | Description |
|-----|-----|-------------|
| List | `/masterpart` | All parts with count badge (e.g., 25,379) |
| Phys. Inventory | `/masterpart/inventory` | Physical inventory management |
| Reports | `/masterpart/reports` | Parts-related reports and exports |

**Stock Room Selector:**
- Dropdown to select active stock room (e.g., KTYS)
- Stock room context affects quantity displays and inventory operations

**List View Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Part Number | text | Unique part identifier |
| Description | text | Part description |
| Line Code | text | Inventory line code |
| Part Component | text | Component classification |
| Part Type | text | Part type category (e.g., Airframe) |
| Supplier | text | Default supplier name |
| Location | text | Stock room location |
| Qty | numeric | Quantity in selected stock room |
| TTL Qty | numeric | Total quantity across all stock rooms |
| Media | numeric | Attached media count |

**Features:**
- Global search bar with keyboard shortcut (Ctrl+K)
- Sortable columns (default: Part Number ascending)
- Row selection checkboxes
- Pagination: 25/50/100 per page
- Double-click row to open part detail

---

### 2. Part Detail

#### 2.1 Part Header
**URL:** `/masterpart/[id]`

**Display Information:**
- Part Number (e.g., 20547-004)
- Description (e.g., Placard, Door Latch, German)

---

#### 2.2 Left Sidebar Navigation

**Part Info Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Main Info | - | Primary part information |
| Stock Info | count | Stock quantities for this part |

**Media Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Media | count | Part-specific attachments |

**Relationships Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Catalogs | count | Parts catalogs containing this part |
| Alternates | count | Alternate part numbers |
| Superseded | count | Superseded part relationships |

**History Group:**
| Tab | Description |
|-----|-------------|
| W/O History | Work order usage history |
| P/O History | Purchase order history |
| OTC History | Over-the-counter sales history |
| Cores | Core tracking history |

**Documents Group:**
| Tab | Description |
|-----|-------------|
| Reports | Part-specific reports and labels |

**Billing Group:**
| Tab | Description |
|-----|-------------|
| Contract Pricing | Contract-specific pricing rules |

**Audit Group:**
| Tab | Description |
|-----|-------------|
| Qty History | Quantity change history |
| Edit History | Change audit log |

---

### 3. Main Info Tab
**URL:** `/masterpart/[id]`

#### 3.1 Important Information Section
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| Part Number | text (disabled) | Unique | Part identifier (read-only after creation) |
| Description | text-limited | 228 chars max | Part description |
| Track Serial Number | checkbox | - | Enable serial number tracking |
| Part Component | dropdown | Optional | Component classification |
| Warranty Days | numeric | - | Default warranty period in days |
| Part Type | dropdown | Optional | Part type category |
| Supplier | dropdown | Optional | Default supplier |
| Line Code | text | Optional | Inventory line code |
| Unit of Measurement | dropdown | Optional | Unit of measure |
| Family Code | text | Optional | Part family grouping |
| Manufacturer | text | Optional | Part manufacturer |
| Manuf. Part No. | text | Optional | Manufacturer's part number |
| Model No. | text | Optional | Model number |
| Replacement Days | numeric | - | Days until replacement due |
| Replacement Hours | numeric | - | Hours until replacement due |
| Weight | numeric | - | Part weight |
| Weight (Unit) | dropdown | Optional | Weight unit of measure |

#### 3.2 Pricing Section
| Field | Type | Description |
|-------|------|-------------|
| Cost | currency | Part cost (4 decimal places) |
| Retail | currency | Retail price |
| Always Use Retail | checkbox | Force retail pricing |
| Dealer Percent | percentage | Dealer pricing percentage |

#### 3.3 Other Info Section
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| Part for Standing W/O Only | checkbox | - | Restrict to standing work orders |
| Print 1 Label/1 Qty | checkbox | - | Label printing behavior |
| Has Core | checkbox | - | Part has core return requirement |
| Core Charge | currency | - | Core charge amount |
| Core Notes | text-limited | 255 chars max | Core-related notes |
| Hazard | checkbox | - | Hazardous material indicator |
| Hazard Charge | currency | - | Hazmat handling charge |
| Hazard Notes | text-limited | 255 chars max | Hazmat notes |
| GL Code | text | Optional | General ledger code |
| UNSPSC Code | text | Optional | UNSPSC classification code |
| Income Account | dropdown | Optional | Income account for accounting |
| Expense Account | dropdown | Optional | Expense account for accounting |
| Asset Account | dropdown | Optional | Asset account for accounting |
| Notes | text-limited | 255 chars max | General notes |
| Alert Notes | text-limited | 500 chars max | Alert/warning notes |
| Consumable | checkbox | - | Consumable part indicator |
| Has Shelf Life | checkbox | - | Part has expiration date |
| Reference Only | checkbox | - | Reference-only part (no inventory) |
| Reference Notes | text-limited | 500 chars max | Reference notes |

---

### 4. Stock Info Tab
**URL:** `/masterpart/[id]/qty`

**Purpose:** Manage stock quantities for the part across stock rooms.

#### 4.1 Reorder Section
| Field | Type | Description |
|-------|------|-------------|
| Location (General) | text | Default location in stock room |
| Min Level | numeric | Minimum stock level |
| Max Level | numeric | Maximum stock level |
| Min Order | numeric | Minimum order quantity |
| Max Order | numeric | Maximum order quantity |

#### 4.2 Stock Quantity Summary
| Column | Type | Description |
|--------|------|-------------|
| Stock Room | text | Stock room name |
| Total Quantity | numeric | Total quantity in stock room |
| Total Stock Qty | numeric | Total stock quantity |

**Features:**
- View Each Stock Room button - See breakdown by stock room

#### 4.3 Stock Quantity Records
| Column | Type | Description |
|--------|------|-------------|
| Qty | numeric | Quantity |
| Part Condition | text | Part condition (New, Used, OH, etc.) |
| Location | text | Specific location within stock room |
| Lot | text | Lot number |
| Cost | currency | Unit cost |
| Retail | currency | Unit retail price |
| Shipping | currency | Shipping cost |
| Shelf Life | date | Expiration date |
| Warranty Date | date | Warranty expiration |
| Purchase Order | text | Associated P/O number |

**User Actions:**
- Add stock quantity record
- Edit existing records
- Delete records

---

### 5. Catalogs Tab
**URL:** `/masterpart/[id]/catalog`

**Purpose:** View parts catalogs this part has been added to.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Parts Catalog | text | Catalog name |
| Catalog Identifier | text | Catalog ID |
| # Parts | numeric | Number of parts in catalog |

---

### 6. Alternates Tab
**URL:** `/masterpart/[id]/alternate`

**Purpose:** Manage alternate part number relationships.

**Features:**
- Link alternate parts that can substitute for this part
- View all alternates for this part

---

### 7. Superseded Tab
**URL:** `/masterpart/[id]/superseded`

**Purpose:** Manage superseded part relationships.

**Features:**
- Track when parts are replaced by newer versions
- Link to superseding parts

---

### 8. W/O History Tab
**URL:** `/masterpart/[id]/wohistory`

**Purpose:** View work order usage history for this part.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Qty | numeric | Quantity used |
| Reg. No. | text | Aircraft registration |
| Work Order | text | Work order number |
| Status | text | Part status on W/O |
| Final Price | currency | Billed price |
| Category | text | Work item category |
| Added on | date | Date added to W/O |
| Added By | text | User who added part |

**Features:**
- Stock room filter dropdown
- Advanced search capability
- Export functionality

---

### 9. P/O History Tab
**URL:** `/masterpart/[id]/pohistory`

**Purpose:** View purchase order history for this part.

**Features:**
- Track all purchase orders containing this part
- View order quantities, dates, and vendors

---

### 10. OTC History Tab
**URL:** `/masterpart/[id]/otchistory`

**Purpose:** View over-the-counter sales history for this part.

**Features:**
- Track all OTC invoices containing this part
- View sales quantities and pricing

---

### 11. Contract Pricing Tab
**URL:** `/masterpart/[id]/contractpricing`

**Purpose:** Set specific prices for this part based on quantity and date range.

**Note:** "This feature is limited for OTC only"

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Contract | text | Contract reference |
| Start Date | date | Pricing start date |
| End Date | date | Pricing end date |
| Min Qty | numeric | Minimum quantity for pricing |
| Max Qty | numeric | Maximum quantity for pricing |
| Cost Ea. | currency | Contract cost each |
| Price Each | currency | Contract price each |
| City | text | Applicable city/stock room |

**User Actions:**
- Add contract pricing record
- Edit existing records
- Delete records

---

### 12. Reports Tab (Part-Level)
**URL:** `/masterpart/[id]/reports`

**Purpose:** Generate part-specific reports and labels.

**Available Labels:**
| Label Type | Description |
|------------|-------------|
| Part Label: Avery 5160 | 2.5" x 1", 30 per sheet |
| Part Label: Avery 5160 (Barcode) | 2.5" x 1" with code39 barcode |
| Part Label: Avery 8463 | 3.5" x 2", 10 per sheet |
| Part Label: Dymo 30252 | 3.5" x 1.125" for Dymo printer |
| Part Label: Dymo 30252 (Barcode) | 3.5" x 1.125" with code39 barcode |
| Part Label: Dymo 30256 | 3.5" x 1.125" for Dymo printer |

**Export Options:**
- PDF export
- Excel export

---

### 13. Physical Inventory
**URL:** `/masterpart/inventory`

**Purpose:** Perform physical inventory counts and reconciliation.

**Description:** "Quickly perform a physical inventory: use the Advanced Search to specify which parts to show"

**Filters:**
| Filter | Type | Description |
|--------|------|-------------|
| Last Confirmed | dropdown | Filter by last confirmation date (e.g., "> 180 Days Ago") |
| Location | button | Filter by stock room location |

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Part Number | text | Part identifier |
| Description | text | Part description |
| Part Type | text | Part type category |
| Location | text | Stock room location |
| Qty | numeric | Current quantity |
| Confirm | checkbox | Confirm inventory count |
| Last Date | date | Last inventory date |
| Last Confirmed | text | Last confirming user |

**User Actions:**
- Confirm inventory counts
- Update quantities
- Export inventory data

---

### 14. Module-Level Reports
**URL:** `/masterpart/reports`

**Purpose:** View and export data based on custom search criteria.

**Available Exports:**
| Export | Description |
|--------|-------------|
| Export General List | Part number, description, part component, etc. |
| Export Pull Ticket | Pull ticket logs for multiple destinations |
| Export Stock Quantity Information | Basic part info with detailed stock quantities |
| Export Stock Quantity Logs | Inventory quantity and cost change details |
| Export Stock Room Detail | General info, location-specific info, detailed quantities |
| Export Stock Room Summary | General info with summarized quantities |
| Parts History | OTC and/or work order part usage history |

**Available Reports:**
| Report | Description |
|--------|-------------|
| Cost & Retail List | Parts with general info and total cost & retail |
| Cost & Retail List (Breakdown) | Parts with stock quantity detail by stock room |
| Expiring Parts | Parts set to expire within specified days |
| Family List | Parts grouped by Family Code |
| Last Usage | When part was last used on W/O, OTC, P/O, or adjustments |
| Order for Stock | Parts with stock, min/max levels, order qty, cheapest vendor |
| Order for Stock (Compact) | Basic stock info with min/max and general cost |
| Stock Qty History | Stock quantity and inventory values for a date |
| Stock Value Difference | Starting/ending inventory value between two dates |

**Export Options:**
- PDF export
- Excel export

---

### 15. Business Rules Summary

#### Part Data Relationships:
- Part numbers are unique across the system
- Parts can belong to multiple Parts Catalogs
- Parts can have multiple Alternate parts
- Superseded relationships track part evolution
- Stock quantities are tracked per stock room

#### Serial Number Tracking:
- When enabled, each part instance must have a unique serial
- Serial tracking affects inventory management and traceability
- Required for certain aviation compliance requirements

#### Pricing Hierarchy:
1. Contract Pricing (if applicable and within date/qty range)
2. Unit Price Override (on work order/OTC)
3. Retail Price (if "Always Use Retail" is checked)
4. Calculated price based on Cost + Markup

#### Inventory Management:
- Min/Max levels trigger reorder alerts
- Physical inventory confirms actual vs. system quantities
- Stock quantity records track condition, lot, shelf life
- Quantity history provides audit trail

#### Core Management:
- Parts with "Has Core" require core return tracking
- Core charges applied when core not returned
- Core notes provide return instructions

---

### 16. Integration Points

- **Work Order Module**: Parts added to work items, usage tracking
- **Purchase Order Module**: Parts ordered from vendors
- **Over the Counter Module**: Parts sold directly to customers
- **Aircraft Module**: Parts Catalog association via Fleet Config
- **Vendor Module**: Default supplier assignment
- **Cores Module**: Core return tracking
- **Reports Module**: Inventory and usage reporting

---

## Outstanding Parts Module

### Overview
The Outstanding Parts module provides a centralized view of all parts that have been requested for work orders but not yet fulfilled. It serves as a procurement queue, enabling parts personnel to identify parts needs across all open work orders, check stock availability, and initiate purchase orders for parts that need to be ordered.

---

### 1. Outstanding Parts List
**URL:** `/outstandingparts`

**Purpose:** View and manage parts requests across all open work orders that are awaiting fulfillment.

---

#### 1.1 Header Controls

**Filter Controls:**
| Control | Type | Description |
|---------|------|-------------|
| City | dropdown | Filter by city/location (e.g., City vs KTYS) |
| Stock Room | dropdown | Select active stock room context |

**Action Buttons:**
| Button | Description |
|--------|-------------|
| WIP Sort | Toggle to sort Work-In-Progress parts to bottom of list |
| Advanced Search | Open advanced search panel with filter count badge |
| Refresh | Reload the parts list |
| Export | Export list data |
| More | Additional options menu |
| Tour | Interactive walkthrough for this feature |

**More Menu Options:**
- Hard Refresh
- Clear All Selections

---

#### 1.2 List View Columns
| Column | Type | Description |
|--------|------|-------------|
| (checkbox) | selection | Row selection checkbox |
| Wip | indicator | Work-in-progress status indicator |
| Status | text | Part request status |
| Part Number | text (link) | Part number - links to Master Parts detail |
| Description | text | Part description |
| Qty | numeric | Quantity needed/requested |
| Destination | text (link) | Work order number - links to work order item |
| Reg. No. | text | Aircraft registration number |
| Rqst Date | date | Date part was requested |
| Rqst By | text | User who requested the part |
| Location | text | Stock room location for the part |
| Qty Stk | numeric | Quantity currently in stock |
| Alt # | numeric | Number of alternate parts available |
| Qty PO | numeric | Quantity already on purchase order |
| PO | checkbox | Purchase order selection with header count |

**PO Column Header:**
- Master checkbox for selecting/deselecting all visible rows
- Counter showing number of selected items for P/O creation

---

#### 1.3 List Features

**Sorting:**
- Default sort by Part Number ascending
- Sortable columns: Part Number, Description, Qty, Destination, Reg. No., Rqst Date, Rqst By, Status, Wip

**Pagination:**
- Options: 25, 50, or 100 per page
- Page navigation with first/last/prev/next controls
- Total item count displayed (e.g., "Page 1 of 9 (209 Total)")

**Row Interactions:**
- Click on Part Number: Navigate to Master Parts detail view
- Click on Destination: Navigate to Work Order item parts tab
- Click on Qty Stk (when highlighted): Quick inventory view
- Click on Qty PO (when highlighted): View related purchase orders

---

### 2. User Actions

| Action | Description |
|--------|-------------|
| View outstanding parts | Browse all parts needing fulfillment |
| Filter by city/stock room | Narrow list to specific location |
| Sort by column | Organize list by any sortable field |
| Toggle WIP sort | Move WIP parts to bottom of list |
| Select parts for P/O | Use checkboxes to select parts for purchase order creation |
| Navigate to part detail | Click part number to view Master Parts record |
| Navigate to work order | Click destination to view requesting work order |
| Export list | Export current view to file |
| Advanced search | Apply complex filter criteria |

---

### 3. Business Rules Summary

#### Part Request Lifecycle:
1. Part added to work order item with status "Requested"
2. Part appears in Outstanding Parts list
3. Parts personnel reviews availability (Qty Stk column)
4. If in stock: Part is fulfilled from inventory
5. If not in stock: Part is selected for purchase order (PO checkbox)
6. Once ordered, Qty PO shows ordered quantity
7. Part removed from Outstanding Parts when fulfilled

#### Status Indicators:
- Parts with stock available (Qty Stk > 0) may be fulfillable from inventory
- Parts with alternates (Alt # > 0) have substitute options
- Parts already on P/O (Qty PO > 0) are being procured
- "(Open)" indicator in PO column indicates P/O is still open

#### WIP Parts:
- Work-In-Progress parts may have different priority
- WIP Sort button toggles these to bottom of list for clarity

---

### 4. Integration Points

- **Work Order Module**: Source of part requests; destination link navigates to work order item
- **Master Parts Module**: Part number links to part detail; stock quantities from inventory
- **Purchase Order Module**: Selected parts can be added to purchase orders
- **Stock Room**: Location context affects availability and fulfillment

---

## Part Status Module

### Overview
The Part Status module provides a consolidated, aircraft-centric view of all parts that have been requested across work orders. Unlike the Outstanding Parts module which focuses on procurement workflow, Part Status emphasizes tracking parts by aircraft to give technicians and managers visibility into what parts are needed for each aircraft currently in service.

---

### 1. Part Status List
**URL:** `/partstatus`

**Purpose:** View and track parts requests across all open work orders, organized by aircraft for easy reference.

---

#### 1.1 Header Controls

**Filter Controls:**
| Control | Type | Description |
|---------|------|-------------|
| City | dropdown | Filter by city/location (e.g., KTYS) |
| Use Filters | dropdown | Pre-defined filter options |
| Show All Parts | dropdown | Ownership filter |

**Use Filters Options:**
| Option | Description |
|--------|-------------|
| Use Filters | Default view - all parts |
| Received in Last 8 Days | Parts received within 8 days |
| All Requested | All parts in requested status |
| ETA Next 3 Days | Parts with ETA within 3 days |

**Show All Parts Options:**
| Option | Description |
|--------|-------------|
| Show All Parts | Show parts for all users |
| Mine Only | Filter to parts requested by current user |

**Action Buttons:**
- Refresh
- Export
- Additional options (icons)

---

#### 1.2 List View Structure

**Grouping:**
The list is organized with expandable aircraft grouping rows. Each aircraft group header displays:
- Registration Number (e.g., N127RH)
- Aircraft Model (e.g., SR22T)

Parts are nested under their respective aircraft groups.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| A/C | text (expandable) | Aircraft registration and model - group header row |
| Work Order | text | Work order number containing the part request |
| Part Number | text | Part number |
| Description | text | Part description |
| Qty | numeric | Quantity requested |
| Rqst By | text | User who requested the part |
| Rqst | date | Request date |
| ETA | date | Expected arrival date |
| Status | button/text | Part status with clickable link for ordered parts |
| Notes | text | Order notes |

**Column Features:**
- Sortable columns (click header to sort)
- Resizable columns (drag column separator)
- Default sort: by Aircraft (GroupByHeader ASC)

---

#### 1.3 Status Column Behavior

The Status column displays the current procurement status of each part:

| Status | Display | Behavior |
|--------|---------|----------|
| (blank) | Disabled button | Part not yet on order |
| Ordered (P/O) | Clickable button | Links directly to the Purchase Order detail page |

**Navigation:**
- Clicking "Ordered (P/O)" status navigates to `/purchaseorder/[poID]/part`
- This allows users to quickly access the purchase order containing the part

---

#### 1.4 List Features

**Pagination:**
- Options: Fit the Screen, 25 per page, 50 per page
- Page navigation with first/last/prev/next controls
- Total item count displayed (e.g., "Page 1 of 12 (281 Total)")
- Go to specific page input

**Row Interactions:**
- Expandable aircraft group rows (toggle expand/collapse)
- Click on Status button to navigate to Purchase Order (when ordered)

---

### 2. User Actions

| Action | Description |
|--------|-------------|
| View part status by aircraft | See all parts organized by aircraft |
| Filter by city | Narrow list to specific location |
| Apply quick filters | Use pre-defined filters (Received, Requested, ETA) |
| Filter to own requests | Show only parts requested by current user |
| Sort by column | Organize list by any column |
| Expand/collapse aircraft groups | Show/hide parts for specific aircraft |
| Navigate to Purchase Order | Click ordered status to view P/O details |
| Export list | Export current view to file |

---

### 3. Business Rules Summary

#### Aircraft-Centric Organization:
- Parts are grouped by aircraft (registration number + model)
- Provides a "per-aircraft" view of parts status
- Useful for technicians working on specific aircraft

#### Status Tracking:
- Parts appear in the list until fulfilled
- Status shows current procurement state
- Ordered parts link directly to their purchase orders

#### Relationship to Outstanding Parts:
- Part Status and Outstanding Parts show similar data with different views
- Outstanding Parts: procurement-focused, flat list with P/O selection
- Part Status: aircraft-focused, grouped by aircraft, read-only status view

---

### 4. Integration Points

- **Work Order Module**: Source of part requests; work order number displayed in list
- **Purchase Order Module**: Status column links to P/O details when ordered
- **Aircraft Module**: Parts grouped by aircraft registration
- **User Management**: "Mine Only" filter based on requesting user

---

## Purchase Order Module

### Overview
The Purchase Order module manages the procurement lifecycle for parts and service items. It provides comprehensive tools for creating purchase orders, tracking ordered items, receiving inventory, managing vendor relationships, and generating procurement-related reports. The module supports both work order-driven parts requests and stock replenishment orders.

---

### 1. Purchase Order Navigation & List Views

#### 1.1 Module Tabs
**URL:** `/purchaseorder`

**Left Sidebar Navigation:**
| Tab | URL | Badge | Description |
|-----|-----|-------|-------------|
| Current P/Os | `/purchaseorder` | count | Active purchase orders (open status) |
| My Current P/Os | `/purchaseorder/mycurrent` | count | Current user's active P/Os |
| Ordered | `/purchaseorder/ordered` | count | P/Os with "Ordered" status |
| Outst. Items | `/purchaseorder/outstanding` | count | Line items not yet received |
| Receive History | `/purchaseorder/receivehistory` | count | Recent receiving activity (Last 90 Days) |
| All P/Os | `/purchaseorder/all` | - | All purchase orders |
| Create | - | - | Create new purchase order |
| Reports | `/purchaseorder/reports` | - | Module-level reports |
| Reminders | `/purchaseorder/reminders` | - | P/O reminders dashboard |

**Header Controls:**
| Control | Type | Description |
|---------|------|-------------|
| City | dropdown | Filter by city/location |

---

#### 1.2 Current P/Os List
**URL:** `/purchaseorder`

**Purpose:** View all current (open status) purchase orders for the selected city.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| (checkbox) | selection | Row selection |
| P/O | text | Purchase order number (format: CITY##### e.g., KTYS17467) |
| Vendor | text | Vendor name |
| Status | text | P/O status (e.g., Ordered, Received) |
| Status Notes | text | Additional status information |
| Department | text | Department assignment (e.g., Maintenance) |
| Date Created | date | Creation date |
| Lead User | text | Primary user responsible |
| Rmdr # | numeric | Number of reminders |
| # Open | numeric (button) | Count of open items - clickable |
| Open Asset List | text | Aircraft/stock destinations with open items |

**Features:**
- Sortable columns (default: P/O ascending)
- Pagination: 25/50/100 per page
- Double-click row to open P/O detail
- Export functionality
- Refresh button

---

#### 1.3 Ordered List
**URL:** `/purchaseorder/ordered`

**Purpose:** View purchase orders that have been submitted to vendors.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| P/O | text | Purchase order number |
| Vendor | text | Vendor name |
| Status Notes | text | Order reference/notes (e.g., vendor S/O number) |
| Department | text | Department assignment |
| Date Created | date | Creation date |
| Date Ordered | date | Date order was placed |
| Lead User | text | Primary user responsible |
| Rmdr # | numeric | Number of reminders |
| # Open | numeric | Count of open items |
| Open Asset List | text | Destinations with open items |

---

#### 1.4 Outstanding Items List
**URL:** `/purchaseorder/outstanding`

**Purpose:** View individual line items that are on ordered P/Os but not yet received.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Part Number | text | Part number |
| Description | text | Part description |
| P/O | text | Purchase order number |
| Vendor | text | Vendor name |
| Qty | numeric (button) | Quantity ordered |
| Eta | date | Expected arrival date |
| Destination | text | Stock room or work order destination |
| Date Added | date | Date added to P/O |
| Date Ordered | date | Date P/O was ordered |
| Ship Method | text | Shipping method |
| Tracking Number | text (button) | Shipment tracking number |
| Lead User | text | Primary user |

---

#### 1.5 Receive History
**URL:** `/purchaseorder/receivehistory`

**Purpose:** View receiving activity history for the last 90 days.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Part Number | text | Part number |
| Date | date | Date received |
| Received By | text | User who received |
| P/O | text | Purchase order number |
| Vendor | text | Vendor name |
| Qty | numeric | Quantity received |
| Unit Chg | currency | Unit charge indicator |
| Part Cost | currency | Cost per part |
| Shipping | currency | Shipping cost |
| Invoice Number | text | Vendor invoice number |
| Destination | text | Stock room or work order |
| Info | button | Additional information |

---

#### 1.6 Reminders Dashboard
**URL:** `/purchaseorder/reminders`

**Purpose:** Manage and track reminders across all purchase orders.

**Filters:**
| Filter | Type | Options |
|--------|------|---------|
| Date Range | dropdown | Last 7 Days, Last 30 Days, etc. |
| User | dropdown | All users or specific user |
| Status | dropdown | Open, Processed, All |
| P/O | dropdown | Specific P/O selection |

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Date | date | Reminder date |
| User | text | Assigned user |
| Reminder | text | Reminder type/title |
| Details | text | Reminder description |
| Vendor | text | Associated vendor |
| P/O | text | Purchase order number |
| Status | text | P/O status |
| Notes | text | Additional notes |
| Processed | checkbox | Whether reminder has been handled |

---

### 2. Purchase Order Detail

#### 2.1 P/O Header
**URL:** `/purchaseorder/[id]`

**Display Information:**
- Purchase Order Number (e.g., KTYS17467)
- Vendor Name
- Status dropdown (for changing status)
- Actions menu

---

#### 2.2 Left Sidebar Navigation (Detail View)

**Order Management Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Items | count | Parts and service items on the P/O |
| Cores | - | Core return tracking |
| Config & Info | - | P/O configuration and settings |
| Reminders | count | P/O-specific reminders |

**Receiving Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Receiving | count | Receive ordered items |
| S/N Components | - | Serial number component tracking |

**Review Group:**
| Tab | Description |
|-----|-------------|
| Review | Summary/review of P/O |

**Documents Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Media | count | Attached files/images |
| Reports | - | P/O reports and labels |

**History Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Receive History | count | Receiving history for this P/O |
| Edit History | - | Change audit log |

**Financial Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Credits | count | Vendor credits/returns |

---

### 3. Items Tab
**URL:** `/purchaseorder/[id]/part`

**Purpose:** Manage parts and service items on the purchase order.

#### 3.1 Sub-tabs
| Tab | Description |
|-----|-------------|
| Parts | Part line items |
| ETA And Notes | Expected arrival dates and notes |
| Service | Service item line items |

#### 3.2 Parts Table Columns
| Column | Type | Description |
|--------|------|-------------|
| (checkbox) | selection | Row selection |
| Qty | numeric | Quantity ordered |
| Qty Outst | text | Quantity outstanding (open/total) |
| Part Number | text | Part number |
| Description | text | Part description |
| Price | currency | Unit price |
| Total Price | currency | Line total |
| Media | numeric (button) | Attached media count |

**Header Display:**
- Total P/O amount shown as button (e.g., "$11.02")

---

### 4. Config & Info Tab
**URL:** `/purchaseorder/[id]`

**Purpose:** Configure purchase order settings and view information.

#### 4.1 Sub-tabs
| Tab | URL | Description |
|-----|-----|-------------|
| Main Info | `/purchaseorder/[id]` | Primary P/O configuration |
| Tax | `/purchaseorder/[id]/tax` | Tax settings |
| Totals | `/purchaseorder/[id]/totals` | P/O totals summary |

#### 4.2 Main Info Section
| Field | Type | Description |
|-------|------|-------------|
| Purchase Order | text (readonly) | P/O number |
| City | text (readonly) | City code |
| Status Notes | text-limited (255) | Status description |
| Lead User | lookup | Primary responsible user |
| Vendor | lookup (readonly) | Vendor name |
| Department | dropdown | Department (e.g., Maintenance) |
| Vendor Contact | text | Vendor contact name |
| Ordered Date | date | Date order was placed |
| Contract | dropdown | Contract selection |
| Contract No. | text | Contract number |
| CLIN | text | Contract Line Item Number |
| Contract Pricing Date | date | Contract pricing date |
| Internal Tracking Number | text | Internal reference number |
| RMA Number | text | Return Merchandise Authorization |
| Notes | text-limited (3999) | General notes |
| Currency | dropdown | Currency code |
| Ship Method | dropdown | Shipping method (FedEx Ground, etc.) |
| Ship To | dropdown | Destination location |
| Terms | dropdown | Payment terms (Credit Card, Net 30, etc.) |
| Printout Disclaimer | dropdown | Disclaimer for printed P/O |
| Cost Center | dropdown | Cost center assignment |
| Service Items | checkbox | Enable service items |

#### 4.3 Additional Fees Section
| Field | Type | Description |
|-------|------|-------------|
| Parts Shipping In | currency | Inbound shipping cost |
| Misc. Charges | currency | Miscellaneous charges |
| Misc. Charges Notes | text-limited (3999) | Misc charges description |

#### 4.4 Tax Tab
**URL:** `/purchaseorder/[id]/tax`

**Main Info Section:**
| Field | Type | Description |
|-------|------|-------------|
| Taxable | checkbox | P/O is taxable |
| Tax Rate | percentage | Tax rate percentage |

**Taxable Items Section:**
| Field | Type | Description |
|-------|------|-------------|
| Tax OSR Labor | checkbox | Tax outside repair labor |
| Tax Parts | checkbox | Tax parts |
| Tax OSR Parts | checkbox | Tax outside repair parts |
| Tax Shipping Out | checkbox | Tax outbound shipping |
| Tax Shipping In | checkbox | Tax inbound shipping |
| Tax OSR Shipping In | checkbox | Tax OSR inbound shipping |
| Tax OSR Shipping Out | checkbox | Tax OSR outbound shipping |
| Tax Misc Charges | checkbox | Tax miscellaneous charges |
| Tax Credit Card Fee | checkbox | Tax credit card fees |

#### 4.5 Totals Tab
**URL:** `/purchaseorder/[id]/totals`

**Totals Section:**
| Field | Type | Description |
|-------|------|-------------|
| Total Parts | currency (readonly) | Sum of parts cost |
| Total Labor | currency (readonly) | Sum of labor/service |
| Total Ship In | currency (readonly) | Total inbound shipping |
| Total Ship Out | currency (readonly) | Total outbound shipping |
| Total Tax | currency (readonly) | Calculated tax |
| Total Amount | currency (readonly) | Grand total |

**Credits Section:**
| Field | Type | Description |
|-------|------|-------------|
| Total Credit Parts | currency (readonly) | Parts credits |
| Total Credit Labor | currency (readonly) | Labor credits |
| Total Credit Shipping | currency (readonly) | Shipping credits |
| Total Credit Tax | currency (readonly) | Tax credits |
| Total Credit | currency (readonly) | Total credits |
| View Credit History | button | Navigate to credit history |

---

### 5. Receiving Tab
**URL:** `/purchaseorder/[id]/receive`

**Purpose:** Receive ordered items into inventory or to work orders.

#### 5.1 Sub-tabs
| Tab | Description |
|-----|-------------|
| Quick Receive | Simplified receiving for non-serialized parts |
| Part | Individual part receiving (required for serialized parts) |

#### 5.2 Overview Section
| Field | Type | Description |
|-------|------|-------------|
| Inspect Date | date | Inspection date |
| Inspect Invoice No. | text | Vendor invoice number |
| Approved | checkbox | Parts inspection approved |

#### 5.3 Destinations Table
| Column | Type | Description |
|--------|------|-------------|
| (checkbox) | selection | Select for receiving |
| Qty | numeric | Quantity to receive |
| Destination | text | Stock room or work order |
| Part Number | text | Part number |
| Description | text | Part description |
| Part Condition | dropdown | Condition (New, OH, etc.) |
| Location | text | Stock location |
| Cost Ea. | currency | Unit cost |
| Lot | text | Lot number |
| Ship | currency | Shipping cost |
| Core | checkbox | Core tracking |
| Wrty. Exp. | date | Warranty expiration |
| Shelf Life | date | Shelf life expiration |

**Action Buttons:**
- Receive [count] - Receive selected items
- Clear - Clear selections

---

### 6. Reports Tab (P/O Level)
**URL:** `/purchaseorder/[id]/reports`

**Purpose:** Generate reports and labels for the specific purchase order.

#### 6.1 Primary Reports
| Report | Description |
|--------|-------------|
| Purchase Order | PDF/export for submission to vendor |
| Purchase Order (With Options) | P/O with display overrides (hide info, custom disclaimer) |
| Receiving Detail | Detailed listing of receipts |
| Request For Pricing | P/O form without destination/pricing for vendor quotes |

#### 6.2 Labels
| Label Type | Description |
|------------|-------------|
| Part Label: Avery 5160 | 2.5" x 1", 30 per sheet |
| Part Label: Avery 5160 (Barcode Traceability) | With barcodes and traceability info |
| Part Label: Avery 5160 (Barcode) | With code39 barcode |
| Part Label: Avery 8463 | 3.5" x 2", 10 per sheet |
| Part Label: Avery 8463 (Barcode Traceability) | With barcodes and traceability info |
| Part Labels: Dymo 30252 | 3.5" x 1.125" for Dymo printer |
| Part Labels: Dymo 30252 (Barcode Traceability) | With barcodes and traceability |
| Part Labels: Dymo 30252 (Barcode) | With code39 barcode |
| Part Labels: Dymo 30256 | 4" x 2.25" for Dymo printer |
| Part Labels: Dymo 30256 (Barcode Traceability) | With barcodes and traceability |
| Part Labels: Dymo 30336 (Company Control) | 1" x 2.125" with company info |

---

### 7. Module-Level Reports
**URL:** `/purchaseorder/reports`

**Purpose:** Generate reports across all purchase orders.

#### 7.1 Exports
| Export | Description |
|--------|-------------|
| Export Consumables | P/O totals for orders with consumable (SHOP destination) parts |
| Export Purchase Orders | P/Os including part and destination data |

#### 7.2 Reports
| Report | Description |
|--------|-------------|
| Purchase Order Totals | List and export P/O totals based on search criteria |
| Receiving Detail | Detailed listing of P/O receipts |

**Export Options:**
- PDF export
- Excel export

---

### 8. Business Rules Summary

#### Purchase Order Lifecycle:
1. **Created** - P/O initialized with vendor and items
2. **Ordered** - P/O submitted to vendor, ordered date set
3. **Received** - All items received into inventory
4. **Closed** - P/O finalized

#### P/O Number Format:
- Format: CITY##### (e.g., KTYS17467)
- City prefix indicates originating location
- Numeric sequence auto-generated

#### Item Destinations:
- **Stock Room** - Items go to inventory (e.g., "Stock (KTYS)")
- **Work Order** - Items go directly to work order (e.g., "N123AB - SR22T (KTYS43629-10-2025)")
- **Shop** - Consumable items for general shop use

#### Receiving Rules:
- Quick Receive available for non-serialized parts
- Serialized parts must be received individually via Part tab
- Receiving creates inventory records or updates work order parts
- Invoice number and inspection data tracked per receipt

#### Outstanding Items:
- Items remain "outstanding" until received
- Outstanding count drives reminder workflows
- Multiple partial receipts supported

---

### 9. Integration Points

- **Work Order Module**: Parts requested from W/O appear as P/O line items; received parts update W/O part records
- **Master Parts Module**: Part lookup for P/O items; receiving updates inventory quantities
- **Vendor Module**: Vendor selection and contact information
- **Outstanding Parts Module**: Outstanding items visible in Outstanding Parts list
- **Part Status Module**: Ordered parts status displayed in Part Status view
- **Cores Module**: Core return tracking when receiving parts with cores
- **Reports Module**: P/O reports and label generation

---

## Over the Counter Module

### Overview
The Over the Counter (OTC) module manages direct parts sales to customers outside of work orders. It handles the complete sales cycle from quotes to invoices, including parts selection, pricing, shipping, payment tracking, and returns. The module supports both quotes (preliminary pricing) and invoices (finalized sales) with a conversion workflow between them.

---

### 1. OTC Navigation & List Views

#### 1.1 Module Sidebar
**URL:** `/otc`

**Left Sidebar Navigation:**
| Section | Options | Description |
|---------|---------|-------------|
| City | dropdown | Select active city/location (e.g., KTYS) |
| Quotes | List, Create | Manage OTC quotes |
| Invoices | List, Create | Manage OTC invoices (with count badge) |
| Reports | Quick Cash Snapshot, Reports | Reporting and dashboards |

---

#### 1.2 Quotes List
**URL:** `/otc/quote`

**Purpose:** View and manage OTC quotes (preliminary pricing documents).

**Header Controls:**
| Control | Type | Description |
|---------|------|-------------|
| Status | dropdown | Filter by status |
| Ownership | dropdown | All Quotes / My Quotes |
| Sales Agent | dropdown | Filter by sales agent |

**Status Filter Options:**
| Option | Description |
|--------|-------------|
| (All) | Show all statuses |
| Open | Open quotes |
| Review | Quotes under review |
| Approved | Approved quotes |
| Waiting For Parts | Blocked pending parts |
| Shipped (Partial) | Partially shipped |
| Shipped | Fully shipped |
| Processed | Completed quotes |
| Void | Cancelled quotes |

**List View Columns:**
| Column | Type | Description |
|--------|------|-------------|
| OTC # | text | OTC number (format: CITY#### or QCITY###) |
| Customer | text | Customer name |
| # Parts | numeric | Number of parts on quote |
| # O/S | numeric | Number of outstanding parts |
| Sales Agent | text | Assigned sales agent |
| Created | date | Creation date |
| Est. Ship | date | Estimated ship date |
| Reminder | date | Reminder date |
| Media | numeric (button) | Attached media count |
| Status Notes | text | Status notes/comments |

**OTC Number Format:**
- Quotes: `QCITY###` (e.g., QKTYS303)
- Invoices: `CITY####` (e.g., KTYS7774)

---

#### 1.3 Invoices List
**URL:** `/otc`

**Purpose:** View and manage OTC invoices (finalized sales documents).

**List View Columns:** Same as Quotes List

**Features:**
- Sortable columns (default: OTC # ascending)
- Pagination: 25/50/100 per page
- Double-click row to open OTC detail
- Row selection checkboxes

---

### 2. OTC Detail - Quote View

#### 2.1 Quote Header
**URL:** `/otc/[id]`

**Display Information:**
- OTC Number with "Quote" indicator
- Customer Name
- Status dropdown (Open, Review, Approved, etc.)

---

#### 2.2 Left Sidebar Navigation (Quote)

**Main Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Parts | count | Parts on the quote |
| Kits | count | Applied parts kits |
| Misc. Charges | count | Miscellaneous charges |
| Config & Billing | - | Configuration and billing settings |

**Actions Group:**
| Tab | Description |
|-----|-------------|
| Convert Quote | Convert quote to invoice |

**Media Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Media | count | Attached files/images |

**Documents Group:**
| Tab | Description |
|-----|-------------|
| Reports | Generate quote reports |

**Audit Group:**
| Tab | Description |
|-----|-------------|
| Edit History | Change audit log |

---

#### 2.3 Parts Tab (Quote)
**URL:** `/otc/[id]`

**Purpose:** Manage parts included in the quote.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| (checkbox) | selection | Row selection |
| Need | numeric | Quantity needed |
| Part Number | text | Part number |
| Description | text | Part description |
| Price (Ea) | currency | Unit price |

**Header Display:**
- Total quote amount button (e.g., "$416.83")

**Features:**
- Add parts via search
- Remove parts
- Adjust quantities and pricing
- Status filter dropdown

---

### 3. OTC Detail - Invoice View

#### 3.1 Invoice Header
**URL:** `/otc/[id]`

**Display Information:**
- OTC Number with "Invoice" indicator
- Customer Name
- Status dropdown

---

#### 3.2 Left Sidebar Navigation (Invoice)

**Main Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Parts | count | Parts on the invoice |
| Kits | count | Applied parts kits |
| Misc. Charges | count | Miscellaneous charges |
| Config & Billing | - | Configuration and billing settings |

**Fulfillment Group (Invoice Only):**
| Tab | Badge | Description |
|-----|-------|-------------|
| Tracking | count | Shipment tracking information |
| Payments | count | Payment records |

**Media Group:**
| Tab | Badge | Description |
|-----|-------|-------------|
| Media | count | Attached files/images |

**Documents Group:**
| Tab | Description |
|-----|-------------|
| Reports | Generate invoice reports |

**Audit Group:**
| Tab | Description |
|-----|-------------|
| Edit History | Change audit log |

**Returns Group (Invoice Only):**
| Tab | Badge | Description |
|-----|-------|-------------|
| Returns | count | Return merchandise records |

---

#### 3.3 Parts Tab (Invoice)
**URL:** `/otc/[id]`

**Purpose:** Manage parts on the invoice with fulfillment tracking.

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| (checkbox) | selection | Row selection |
| Need | numeric | Quantity needed |
| Ship | numeric | Quantity shipped |
| Part Number | text | Part number |
| Description | text | Part description |
| Serial Number | text | Part serial number |
| Price (Ea) | currency | Unit price |
| Status | text | Fulfillment status (e.g., Fulfilled) |
| P/O | text | Associated purchase order |
| Eta | date | Expected arrival date |
| Order Notes | text | Order/procurement notes |

**Header Display:**
- Outstanding count button
- Total invoice amount button
- Balance due button

---

### 4. Config & Billing

#### 4.1 General Sub-tab
**URL:** `/otc/[id]/config`

**Main Info Section:**
| Field | Type | Description |
|-------|------|-------------|
| City | text (disabled) | City code |
| OTC # | text (disabled) | OTC number |
| Reference No | text | External reference number |
| System Type | text (disabled) | Quote or Invoice |
| Type | dropdown | OTC type classification |
| Department | dropdown | Department assignment |
| Sales Agent | lookup | Primary sales agent |
| Sales Agent 2 | combobox-search | Secondary sales agent |
| Export Required | checkbox | Export documentation required |
| Terms | dropdown | Payment terms |
| Ship Method | dropdown | Shipping method (FedEx Ground, etc.) |
| Ship To Type | dropdown | Ship to address type (Bill To, etc.) |
| Shipping In | currency | Inbound shipping charge |
| Shipping Out | currency | Outbound shipping charge |
| Status Notes | text-limited (255) | Status notes |

**Buyer Info Section:**
| Field | Type | Description |
|-------|------|-------------|
| Customer | lookup (disabled) | Customer name |
| Contact | text | Customer contact name |
| Contract Pricing | lookup | Contract pricing selection |
| Contract No. | text | Contract number |
| CLIN | text | Contract Line Item Number |
| Contract Pricing Date | date | Contract pricing date |
| Buyer P/O # | text | Customer purchase order number |
| Customer No. Type | dropdown | Customer number type |
| Customer No. | text | Customer reference number |
| Buyer Notes | text-limited (3999) | Notes from buyer |

**Additional Info Section:**
| Field | Type | Description |
|-------|------|-------------|
| Reminder | date | Reminder date |
| Reminder Notes | text-limited (3999) | Reminder notes |
| Internal Notes | text-limited (3999) | Internal notes |
| Print Notes | text-limited (3999) | Notes to print on documents |

**Important Dates Section:**
| Field | Type | Description |
|-------|------|-------------|
| Created Date | date | Creation date |
| Est. Ship | date | Estimated ship date |
| Shipped | date | Actual ship date |
| Display Date | date | Display date on documents |
| Payment Due | date | Payment due date |
| Processed Date | date | Processing completion date |
| Acct Invoice # | text | Accounting invoice number |

---

#### 4.2 Billing Sub-tab
**URL:** `/otc/[id]/config/billing`

**Parts Section:**
| Field | Type | Description |
|-------|------|-------------|
| Use Parts Discount | checkbox | Enable parts discount |
| Parts Discount is Over Cost | checkbox | Discount calculation method |
| Parts Discount | percentage | Discount percentage |
| Parts Matrix | checkbox | Use parts pricing matrix |
| Use Parts Dealer Pricing | checkbox | Use dealer pricing |
| OTC Parts Discount Level | dropdown | Discount level (Standard Level, etc.) |
| OTC Part Contract Pricing | dropdown | Contract pricing selection |

**Other Section:**
| Field | Type | Description |
|-------|------|-------------|
| Currency | dropdown | Currency code (USD, etc.) |
| Credit Card Fee | percentage | Credit card processing fee |
| Shipping Markup | percentage | Shipping markup percentage |

---

#### 4.3 Tax Sub-tab
**URL:** `/otc/[id]/config/tax`

**Main Info Section:**
| Field | Type | Description |
|-------|------|-------------|
| Taxable | checkbox | OTC is taxable |
| Tax Method | dropdown | Tax calculation method (Standard) |
| Tax Rate | percentage | Tax rate percentage |

**Taxable Items Section:**
| Field | Type | Description |
|-------|------|-------------|
| Tax Parts | checkbox | Tax parts |
| Tax Shipping Out | checkbox | Tax outbound shipping |
| Tax Shipping In | checkbox | Tax inbound shipping |
| Tax Misc Charges | checkbox | Tax miscellaneous charges |
| Tax Drop Ship Fees | checkbox | Tax drop ship fees |
| Tax Hazardous Fees | checkbox | Tax hazardous material fees |
| Tax AOG | checkbox | Tax AOG (Aircraft on Ground) charges |
| Tax Restocking Fee | checkbox | Tax restocking fees |
| Tax Credit Card Fee | checkbox | Tax credit card fees |

---

#### 4.4 Advanced Sub-tab
**URL:** `/otc/[id]/config/advanced`

**Actions:**
| Action | Description |
|--------|-------------|
| Refresh Part Pricing | Recalculate part prices based on current settings |
| Refresh P/Os | Update linked purchase order information |
| Delete | Delete the OTC record |

---

### 5. Reports

#### 5.1 OTC-Level Reports
**URL:** `/otc/[id]/reports`

**Available Reports:**
| Report | Description |
|--------|-------------|
| Over the Counter Part Percentage | Print part percentage report |
| Over the Counter Price Quote | Print price quote document |

---

#### 5.2 Module-Level Reports
**URL:** `/otc/reports`

**Available Reports:**
| Report | Description |
|--------|-------------|
| Export Over the Counter | Export OTC quotes & invoices with parts, misc charges, and tracking |
| Parts History | Export OTC part usage history |
| Sales Agent Report | View OTC sales by invoice, grouped by sales agent or status |
| Tax Report | Exportable list of OTC totals with tax and billing information |

**Export Options:**
- PDF export
- Excel export

---

### 6. Quick Cash Snapshot
**URL:** `/otc/quickcash`

**Purpose:** View current inventory values and outstanding amounts.

**Dashboard Fields:**
| Field | Type | Description |
|-------|------|-------------|
| OTC | currency (readonly) | Outstanding OTC invoice amount |
| Purchase Orders | currency (readonly) | Outstanding purchase order amount |
| Inventory | currency (readonly) | Current inventory value |

**Features:**
- Click on amounts to drill down to detail lists
- City-specific values based on selected city

---

### 7. User Actions

| Action | Description |
|--------|-------------|
| Create Quote | Start new quote for customer |
| Create Invoice | Start new invoice for customer |
| Convert Quote to Invoice | Promote quote to invoice for processing |
| Add Parts | Add parts to quote/invoice |
| Apply Kit | Apply parts kit to quote/invoice |
| Add Misc. Charge | Add miscellaneous charges |
| Track Shipment | Add shipment tracking information (invoices) |
| Record Payment | Record customer payment (invoices) |
| Process Return | Handle merchandise return (invoices) |
| Generate Reports | Create quotes, invoices, and reports |
| Export Data | Export OTC data for analysis |

---

### 8. Business Rules Summary

#### Quote vs Invoice:
- **Quotes** are preliminary pricing documents that can be modified freely
- **Invoices** are finalized sales documents with fulfillment tracking
- Quotes can be converted to invoices via "Convert Quote" action
- Invoices have additional features: Tracking, Payments, Returns

#### OTC Number Format:
- Quote format: `QCITY###` (e.g., QKTYS303)
- Invoice format: `CITY####` (e.g., KTYS7774)
- City prefix indicates originating location

#### Status Workflow:
1. **Open** - Initial state
2. **Review** - Under review
3. **Approved** - Approved for processing
4. **Waiting For Parts** - Blocked pending parts availability
5. **Shipped (Partial)** - Some items shipped
6. **Shipped** - All items shipped
7. **Processed** - Fully completed
8. **Void** - Cancelled

#### Pricing Rules:
- Parts can use standard pricing, discount pricing, or contract pricing
- Parts Matrix enables tiered pricing based on quantity
- Dealer pricing provides special rates
- Credit card fees can be applied
- Shipping markup configurable

#### Tax Calculation:
- Taxable flag enables tax calculation
- Individual items can be taxed or exempt
- Tax method determines calculation approach
- Multiple tax categories (parts, shipping, fees, etc.)

---

### 9. Integration Points

- **Customer Module**: Customer selection and contact information
- **Master Parts Module**: Part lookup, pricing, and inventory availability
- **Purchase Order Module**: Parts procurement for OTC fulfillment; P/O links displayed on invoice parts
- **Cores Module**: Core tracking when selling parts with cores
- **Reports Module**: OTC reports and export generation
- **Accounting System**: Invoice and payment export via Acct Invoice #

---

## Cores Module

### Overview
The Cores module tracks part cores that must be returned to vendors when replacement parts are purchased. When a customer replaces a part with a core exchange requirement, a core record is created to manage the return process, track shipping, monitor receipt by the vendor, and record any credit received.

---

### 1. Cores List
**URL:** `/core`

**Purpose:** View and manage all core return records for the selected city and status.

---

#### 1.1 Header Controls

**Left Sidebar:**
| Control | Type | Description |
|---------|------|-------------|
| City | combobox-search | Filter cores by city location; options include "(All)" and specific city codes (e.g., KTYS) |
| List | button (badge) | Shows count of cores matching current filters (e.g., "List 499") |

**Status Filter:**
| Filter | Type | Options |
|--------|------|---------|
| Status | combobox-search | (All), Open, Sent, Received (Awaiting Credit), Partial Credit, Credit, Sold, Rejected, Void |

---

#### 1.2 List View Columns
| Column | Type | Description |
|--------|------|-------------|
| (checkbox) | checkbox | Row selection checkbox |
| Part Number | text | Part number of the core being returned |
| Description | text | Part description |
| Customer | text | Customer associated with the core |
| Reg. No. | text | Aircraft registration number (if applicable) |
| Vendor | text | Vendor to receive the core |
| Detail | text | Source reference (e.g., "WO #KTYS41403-11-2024, #4" or "OTC #KTYS8106" or "Stock") |
| Status | text | Current core status (Open, Sent, etc.) |
| Status Notes | text | Additional status information |
| Created | date | Date the core record was created (YYYY-MM-DD format) |
| Media | button | Media attachment count (disabled when 0) |

---

#### 1.3 List Features
- **Pagination:** 25/50/100 records per page
- **Total Records:** Displays total count (e.g., "Page 1 of 22 (499 Total)")
- **Navigation:** Page number buttons, Previous/Next, direct page input
- **Row Interaction:** Double-click row to open core detail view
- **Sorting:** Click column headers to sort

---

### 2. Core Detail
**URL:** `/core/[coreID]`

**Purpose:** View and edit details for a specific core record.

---

#### 2.1 Header
| Element | Type | Description |
|---------|------|-------------|
| Part Number | heading | Displays the part number as page title |
| Subtitle | text | Shows "Vendor: [name], Customer: [name]" |
| Status | button-dropdown | Current status with dropdown to change status |

**Status Change Options:**
- Sent
- Received (Awaiting Credit)
- Partial Credit
- Credit
- Sold
- Rejected
- Void

---

#### 2.2 Left Sidebar Navigation
| Tab | Badge | Description |
|-----|-------|-------------|
| Main Info | - | Primary core record information |
| Media | count | Attached files (photos, videos, documents) |
| Reports | - | Core-specific reports |
| Edit History | - | Change audit log |

---

#### 2.3 Main Info - Overview Section
| Field | Type | Character Limit | Description |
|-------|------|-----------------|-------------|
| City | text (disabled) | - | City code (readonly) |
| Vendor | lookup | - | Vendor to receive core (with search/clear buttons) |
| Vendor Notes | text-limited | 500 | Notes about the vendor |
| Customer | lookup | - | Customer associated with core (with search/clear buttons) |
| Customer Notes | text-limited | 500 | Notes about the customer |
| Purchase Order | lookup (disabled) | - | Associated purchase order (with navigation button) |
| Created Date | date | - | Date core record was created (MM/DD/YYYY) |
| Destination | text (disabled) | - | Source reference (e.g., "WO #KTYS41403-11-2024, #4") |
| Status Notes | text-limited | 4000 | Additional status information |

---

#### 2.4 Main Info - Part Details Section
| Field | Type | Character Limit | Description |
|-------|------|-----------------|-------------|
| Part Number | lookup (disabled) | - | Part number being returned (with navigation button) |
| Description | text-limited | 255 | Part description |
| Original Serial No. | text | - | Serial number of the original part |
| Qty | text-numeric | - | Quantity of cores |
| Core Charge | currency | - | Core charge amount ($0.00 format) |
| Internal Notes | text-limited | 3999 | Internal notes (not printed) |
| Print Notes | text-limited | 3999 | Notes that appear on printed documents |

---

#### 2.5 Main Info - Sent Details Section
| Field | Type | Options/Limit | Description |
|-------|------|---------------|-------------|
| Sent Date | date | MM/DD/YYYY | Date core was sent to vendor |
| Sent Method | dropdown | Local, Shipped | How the core was sent |
| Sent Shipping Method | combobox-search | 53 options | Shipping carrier/method (FedEx, UPS, DHL, etc.) |
| Tracking Number | text | - | Shipping tracking number |
| RMA Number | text | - | Return Merchandise Authorization number |
| Return ETA | date | MM/DD/YYYY | Expected return date |

**Sent Shipping Method Options (partial list):**
- "Cirrus Express", FedEx (multiple services), UPS (multiple services), DHL, Freight, Hand Delivery, Will Call, Courier, etc.

---

#### 2.6 Main Info - Received Details Section
| Field | Type | Options/Limit | Description |
|-------|------|---------------|-------------|
| Received Date | date | MM/DD/YYYY | Date vendor received the core |
| Received Method | dropdown | Local, Shipped | How the core was received |
| Received Serial No. | text | - | Serial number when received |
| Received Condition | combobox-search | 44 options | Condition of received core |
| Received Notes | text-limited | 3999 | Notes about the received core |

**Received Condition Options (partial list):**
- 8130-3, As Removed, New, Overhauled, Repaired, Serviceable, Tested, Rejected (Unservicable), CORE, etc.

---

#### 2.7 Main Info - Finalized Details Section
| Field | Type | Options/Limit | Description |
|-------|------|---------------|-------------|
| Completed Date | date | MM/DD/YYYY | Date core process was completed |
| Credit Amount | currency | - | Credit amount received ($0.00 format) |
| Credit Invoice Number | text | - | Vendor's credit invoice number |
| Credit Notes | text-limited | 3999 | Notes about the credit |
| Accounting Status | dropdown | Not Processed, Processed | Accounting processing status |
| Accounting Date | date | MM/DD/YYYY | Date processed in accounting |

---

### 3. Core Media
**URL:** `/core/[coreID]/media`

**Purpose:** Manage media attachments for the core record.

**Media Categories:**
| Category | Description |
|----------|-------------|
| Photos | Image files |
| Videos | Video files |
| Documents | Document files |

**Features:**
- Upload files via "Choose File" button
- View counts by category
- Organize by media type

---

### 4. Core Reports
**URL:** `/core/[coreID]/reports`

**Purpose:** Generate reports for the specific core record.

**Available Reports:**
| Report | Description | Export Options |
|--------|-------------|----------------|
| Core Printout | Print a document for the vendor when shipping the core | PDF, Excel |

---

### 5. Core Edit History
**URL:** `/core/[coreID]/edithistory`

**Purpose:** View the audit trail of changes made to the core record.

**Displayed Information:**
- Action type (Insert, Update)
- Changed fields and values
- User who made the change
- Date/time of change
- IP address

---

### 6. User Actions

| Action | Description |
|--------|-------------|
| Filter by City | Select city to filter core list |
| Filter by Status | Select status to filter core list |
| View Core Detail | Double-click row to open core record |
| Change Status | Use status dropdown in header to update core status |
| Edit Core Fields | Modify editable fields and save |
| Upload Media | Attach photos, videos, or documents |
| Generate Reports | Print core printout for shipping |
| View Edit History | Review audit trail of changes |
| Navigate to Source | Click destination link to view originating W/O, OTC, or Stock record |
| Navigate to P/O | Click purchase order link to view associated P/O |
| Navigate to Vendor | Click vendor link to view vendor record |
| Navigate to Part | Click part number link to view master part record |

---

### 7. Business Rules Summary

#### Core Creation:
- Cores are created automatically when parts with core requirements are used on Work Orders or OTC transactions
- Cores can also be created for Stock inventory items
- The "Destination" field links back to the originating transaction

#### Status Workflow:
1. **Open** - Initial state, core needs to be returned
2. **Sent** - Core has been shipped to vendor
3. **Received (Awaiting Credit)** - Vendor received core, awaiting credit
4. **Partial Credit** - Partial credit received from vendor
5. **Credit** - Full credit received from vendor
6. **Sold** - Core was sold instead of returned
7. **Rejected** - Core was rejected by vendor
8. **Void** - Core record cancelled

#### Tracking Requirements:
- Sent cores should have shipping method and tracking number
- RMA numbers may be required by vendors
- Receipt confirmation tracks when vendor received the core
- Received condition documents the state of the returned core

#### Financial Tracking:
- Core Charge: Amount charged to customer for core deposit
- Credit Amount: Amount credited by vendor when core is returned
- Accounting Status tracks whether the credit has been processed

---

### 8. Integration Points

- **Work Order Module**: Cores created from parts used on work orders; Destination links to work order item
- **Over the Counter Module**: Cores created from OTC parts sales; Destination links to OTC transaction
- **Purchase Order Module**: P/O lookup links to associated purchase orders
- **Master Parts Module**: Part number lookup links to master part records
- **Vendor Module**: Vendor lookup links to vendor records
- **Customer Module**: Customer lookup links to customer records
- **Accounting System**: Accounting Status and Date track credit processing

---

---

## Customers Module

### Overview
The Customers module manages the master list of customer records in EBIS. It provides comprehensive customer information management including contact details, billing preferences, tax settings, shipping addresses, and integrates with aircraft ownership, work order history, and financial tracking.

---

### 1. Customer List
**URL:** `/customer`

**Purpose:** View and manage all customer records in the system.

---

#### 1.1 Header Controls

**Toolbar Buttons:**
| Button | Function |
|--------|----------|
| Advanced Search | Opens advanced filtering panel with 44 filter options |
| Add New Customer | Quick create modal for new customer records |
| Column Settings | Configure visible columns |
| Export | Export list data |
| Refresh | Reload list data |

**Add New Customer Modal:**
- Single field: Name (required)
- Actions: Add, Add and Goto, Cancel

---

#### 1.2 List View Columns
| Column | Type | Description |
|--------|------|-------------|
| Name | text | Customer name (sortable, default sort) |
| Phone | text | Primary phone number |
| Email | text | Primary email address |
| City | text | Customer city |
| # A/C | number | Count of aircraft owned by customer |
| Last W/O Worked | date | Date of most recent work order activity |

---

#### 1.3 Advanced Search Filters
44 filter options available, including:

**Aircraft-Related Filters:**
- A/C All Notes
- A/C Any Due (Next Days)
- A/C Last Oil (> Days Ago)
- A/C Make
- A/C Meter Profile
- A/C Model
- A/C Next Annual (Days)
- A/C Next Corrosion (Next Days)
- A/C Next ELT (Days)
- A/C Next FAR 411 (Days)
- A/C Next FAR 413 (Days)
- A/C Next O/2 (Days)
- A/C Reg. No Expires (Days)
- A/C Warranty Expires (Days)
- Aircraft Billing Profile
- Aircraft Class

**Customer Filters:**
- City
- Customer Class
- Has Addtl Addresses
- Has Media
- Has Resale No
- Modified Since
- Name
- Primary City
- Resale No
- Sales Person
- State
- Tax Exception Expires (Days)
- Tax Profile

**Compliance Filters:**
- Compliance: Until Due (Days)
- Limit Due Items to Two Years Ago

**Billing Filters:**
- OTC Billing Profile
- R/O Billing Profile

**Transaction History Filters:**
- OTC Completed (> Days Ago)
- OTC Completion Date
- W/O Action Category
- W/O Category
- W/O Completion Date
- W/O Corr. Action
- W/O Created Date
- W/O Discrepancy
- W/O Last Completed (> Days Ago)
- W/O Last Created (> Days Ago)
- W/O Sub Category

---

#### 1.4 List Features
- Pagination: 25/50/100 records per page
- Total records displayed: 3,941 customers
- Double-click row to open customer detail
- Column sorting
- Page navigation with direct page input

---

### 2. Customer Detail
**URL:** `/customer/[customerID]`

**Purpose:** View and edit comprehensive customer information.

---

#### 2.1 Customer Header
- Customer Name (large heading)
- Search bar
- Action buttons (settings, options)

---

#### 2.2 Left Sidebar Navigation

**Information Group:**
| Tab | URL | Description |
|-----|-----|-------------|
| Main Info | `/customer/[id]` | Primary customer information |
| Addresses | `/customer/[id]/address` | Additional shipping/billing addresses |

**Billing Group:**
| Tab | URL | Description |
|-----|-----|-------------|
| Billing Override | `/customer/[id]/billingoverride` | Custom billing rate overrides |
| Tax Override | `/customer/[id]/taxoverride` | Custom tax exemptions |

**Media Group:**
| Tab | URL | Description |
|-----|-----|-------------|
| Media | `/customer/[id]/media` | Photos, videos, documents |

**Related Records Group:**
| Tab | URL | Description |
|-----|-----|-------------|
| Aircraft | `/customer/[id]/aircraft` | Aircraft owned by customer (shows count badge) |
| Cores | `/customer/[id]/cores` | Core returns for customer |

**History Group:**
| Tab | URL | Description |
|-----|-----|-------------|
| W/O History | `/customer/[id]/wo/history` | Work order history |
| R/O History | `/customer/[id]/ro/history` | Repair order history |
| OTC History | `/customer/[id]/otc/history` | Over the counter history |

**Documents Group:**
| Tab | URL | Description |
|-----|-----|-------------|
| Reports | `/customer/[id]/reports` | Customer-specific reports |

**Audit Group:**
| Tab | URL | Description |
|-----|-----|-------------|
| Edit History | `/customer/[id]/edithistory` | Audit trail of changes |

---

### 3. Main Info Tab

#### 3.1 Contact Info Section (Collapsible)
| Field | Type | Description |
|-------|------|-------------|
| Title | text | Contact title |
| Name 2 | text | Secondary contact name |
| Show Name 2 on Invoice | checkbox | Display secondary name on invoices |
| Email | text | Primary email address |
| Phone | text | Primary phone number |
| Phone Type | dropdown | Mobile, Home, Work, etc. |
| Phone 2 | text | Secondary phone number |
| Phone Type 2 | dropdown | Phone type for secondary |
| Phone 3 | text | Third phone number |
| Phone Type 3 | dropdown | Phone type for third |
| Phone 4 | text | Fourth phone number |
| Phone Type 4 | dropdown | Phone type for fourth |
| Address | text | Street address line 1 |
| Address 2 | text | Street address line 2 |
| City | text | City |
| State | text | State/Province |
| Zip | text | Postal/ZIP code |
| Country | text | Country name |
| Use Country | checkbox | Include country on address labels |
| Primary City | dropdown | Primary service location |
| Customer Since | date | Date customer was created |

#### 3.2 Ship Section (Collapsible)
| Field | Type | Description |
|-------|------|-------------|
| Ship Address | text | Shipping street address |
| Ship Address 2 | text | Shipping address line 2 |
| Ship City | text | Shipping city |
| Ship State | text | Shipping state |
| Ship Zip | text | Shipping postal code |
| Ship Country | text | Shipping country |
| Ship Country (Use) | checkbox | Include country on shipping labels |
| Ship Method | dropdown | Default shipping method |
| Ship To Type | dropdown | Bill To, Ship To options |

#### 3.3 General Billing Section (Collapsible)
| Field | Type | Description |
|-------|------|-------------|
| Account Number | text | Customer account number |
| OTC Customer ID | text | Over the counter customer ID |
| Resale No | text | Resale certificate number |
| OTC Resale No | text | OTC-specific resale number |
| Customer Class | combobox-search | Customer classification |
| Terms | combobox-search | Payment terms |
| Default Payment Method | combobox-search | Default payment method |
| Sales Person | combobox-search | Assigned sales representative |
| Aircraft Billing Profile | combobox-search | Default billing profile for aircraft W/Os |
| OTC Billing Profile | combobox-search | Default billing profile for OTC |
| R/O Billing Profile | combobox-search | Default billing profile for repair orders |
| Billing Override | button | Link to billing override settings |
| Owner Authorization is Always Open | checkbox | Skip owner authorization workflow |
| No Automatic Shop Supplies | checkbox | Disable automatic shop supply charges |
| Max Allowed Amount Due (OTC) | text-numeric | Maximum OTC credit limit |

#### 3.4 Tax Info Section (Collapsible)
| Field | Type | Description |
|-------|------|-------------|
| Tax Profile | combobox-search | Tax calculation profile |
| Tax ID Number | text | Tax identification number |
| Tax Exemption Expires | date | Tax exemption expiration date |
| Tax Override | button | Link to tax override settings |

#### 3.5 Notes Section (Collapsible)
| Field | Type | Description |
|-------|------|-------------|
| Notes | text-limited | General notes (4000 char limit) |
| Repair Order Notes | text-limited | Notes for repair orders (4000 char) |
| OTC Notes | text-limited | Notes for OTC transactions (4000 char) |
| Notification Notes (On View W/O) | text-limited | Popup notes when viewing W/O (4000 char) |
| Notification Notes (On View R/O) | text-limited | Popup notes when viewing R/O (4000 char) |
| Notification Notes (On View OTC) | text-limited | Popup notes when viewing OTC (4000 char) |

---

### 4. Additional Addresses Tab
**URL:** `/customer/[customerID]/address`

**Purpose:** Manage multiple shipping and billing addresses for a customer.

**List Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Nickname | text | Address label/nickname |
| Name | text | Contact name at address |
| Address | text | Street address |
| City | text | City |
| State | text | State/Province |
| Phone | text | Phone at address |
| Email | text | Email at address |
| Notes | text | Address notes |

**Features:**
- Add new address
- Edit existing address
- Delete address
- Pagination support

---

### 5. Aircraft Tab
**URL:** `/customer/[customerID]/aircraft`

**Purpose:** View aircraft owned by or associated with the customer.

**List Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Reg. No. | text | Aircraft registration number (link to aircraft) |
| Make | text | Aircraft manufacturer |
| Model | text | Aircraft model |
| Year | text | Aircraft year |
| Primary City | text | Primary service location |
| Media | button | Media count (photos/documents) |

**Features:**
- Link/unlink aircraft to customer
- Add new aircraft
- Navigate to aircraft detail
- Pagination support

---

### 6. Work Order History Tab
**URL:** `/customer/[customerID]/wo/history`

**Purpose:** View all work orders associated with the customer.

**Filter Controls:**
- Status filter dropdown (All, specific statuses)
- Type filter dropdown (All, specific types)

**List Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Work Order | text | Work order number (link) |
| W/O Status | text | Current work order status |
| Discrepancy | text | Discrepancy description (with icon) |
| Reading | text | Aircraft meter reading at time of service |
| Created Date | date | Work order creation date (sortable) |
| Created By | text | User who created the W/O |
| Comp. Date | date | Completion date |
| Comp. By | text | User who completed the W/O |
| Due Date | date | Target completion date |
| Parts | text | Parts status (completed/total) |
| Registration No. | text | Aircraft registration number |

---

### 7. Customer Reports

#### 7.1 Module-Level Reports
**URL:** `/customer/reports`

| Report | Description | Export Options |
|--------|-------------|----------------|
| Accounts Receivable Aging Report | Shows W/O and OTC Totals Payment Aging in 0-30, 31-60, 61-90, and 91+ Day Age Groupings | PDF, Excel |
| Payment History | Detailed list of customer payments | PDF, Excel |

#### 7.2 Customer-Specific Reports
**URL:** `/customer/[customerID]/reports`

| Report | Description | Export Options |
|--------|-------------|----------------|
| Customer Record | Printout displaying customer and essential aircraft maintenance information | PDF, Excel |
| Customer Report | Printout of details for each aircraft the customer owns | PDF, Excel |

---

### 8. User Actions

| Action | Description |
|--------|-------------|
| Search Customers | Use advanced search with 44 filter options |
| Add Customer | Quick create via modal or full detail entry |
| View Customer Detail | Double-click row to open customer record |
| Edit Customer Fields | Modify any editable field and auto-save |
| Manage Addresses | Add/edit/delete additional addresses |
| View Linked Aircraft | See all aircraft associated with customer |
| View Transaction History | Review W/O, R/O, and OTC history |
| Set Billing Profiles | Configure billing and tax settings |
| Upload Media | Attach photos, videos, documents |
| Generate Reports | Run customer and AR reports |
| View Edit History | Review audit trail of changes |

---

### 9. Business Rules Summary

#### Customer Creation:
- Customer name is required
- Customer record can be created with minimal information
- Additional details can be added after creation

#### Billing Configuration:
- Billing profiles can be set separately for Aircraft W/O, OTC, and R/O
- Customer class affects default pricing and terms
- Tax profiles control tax calculation
- Tax exemptions can have expiration dates

#### Authorization Settings:
- "Owner Authorization is Always Open" bypasses owner approval workflow
- "No Automatic Shop Supplies" prevents automatic shop supply charges

#### Notification Notes:
- Notes can be configured to popup when viewing W/O, R/O, or OTC
- Useful for alerts about special customer requirements

#### Address Management:
- Primary address stored in main customer record
- Multiple additional addresses supported for shipping/billing
- Ship-to type determines default address usage

---

### 10. Integration Points

- **Aircraft Module**: Aircraft linked to customers; customer lookup on aircraft records
- **Work Order Module**: Customer selection on work orders; W/O history from customer record
- **Repair Order Module**: Customer selection on repair orders; R/O history from customer record
- **Over the Counter Module**: Customer selection on OTC; OTC history from customer record
- **Cores Module**: Customer linked to core returns
- **Purchase Order Module**: Customer reference on certain P/Os
- **Accounting System**: AR aging, payment tracking, billing profiles
- **Reports**: Customer reports accessible from module and detail views

---

## Vendors Module

### Overview
The Vendors module manages the master list of vendor records in EBIS. Vendors are external suppliers, service providers, and outside repair facilities used for parts procurement and outside repair services. The module tracks vendor contact information, approval status, tax settings, and provides history views for purchase orders and outside service repairs associated with each vendor.

---

### 1. Vendor List
**URL:** `/vendor`

**Purpose:** View and manage all vendor records in the system.

---

#### 1.1 Header Controls

**Toolbar Buttons:**
| Button | Function |
|--------|----------|
| Advanced Search | Opens advanced filtering panel with 30 filter options |
| Add Vendor | Quick create modal for new vendor records |
| Column Settings | Configure visible columns |
| Export | Export list data |
| Refresh | Reload list data |

**Add Vendor Modal:**
| Field | Type | Description |
|-------|------|-------------|
| Vendor | text (required) | Vendor name |

**Actions:**
- Add: Create vendor and stay on list
- Add and Goto: Create vendor and navigate to detail view
- Cancel: Close modal without creating

---

#### 1.2 List View Columns
| Column | Type | Description |
|--------|------|-------------|
| (checkbox) | selection | Row selection checkbox |
| Vendor | text | Vendor name (sortable, default sort) |
| Phone | text | Primary phone number |
| City | text | Vendor city |
| Email | text | Primary email address |
| Contact | text | Primary contact name |
| Vendor Class | text | Vendor classification category |
| Approved | text | Approval status (Yes, Open) |
| Expires | date | Approval expiration date (MM/DD/YYYY) |
| Media | button | Count of attached media files |

---

#### 1.3 Advanced Search Filters
30 filter options available:

**Contact/Location Filters:**
- Account
- Address
- Address 2
- City
- City (Multiple)
- Contact
- Country
- Country (Multiple)
- Email
- Phone
- State
- State (Multiple)
- Url
- Vendor
- Zip
- Zip (Multiple)

**Business Filters:**
- Approval Expiring (Days)
- Approved
- Do not create P/O
- GL Account Number
- Has Media
- Has Warranty Claims
- Inactive
- Is OSR
- Is Supplier
- Is Tools
- Limit P/O to City
- Ship Method
- Terms
- Vendor Class

---

#### 1.4 List Features
- Pagination: 25/50/100 records per page
- Total records: 518 vendors
- Double-click row to open vendor detail
- Column sorting
- Page navigation with direct page input

---

### 2. Vendor Detail
**URL:** `/vendor/[vendorID]`

**Purpose:** View and edit comprehensive vendor information.

---

#### 2.1 Vendor Header
- Vendor Name (large heading)
- "OSR" badge (if vendor is marked as Outside Repair)
- Search bar
- Action buttons (settings, options)

---

#### 2.2 Left Sidebar Navigation

**Information Group:**
| Tab | URL | Description |
|-----|-----|-------------|
| Main Info | `/vendor/[id]` | Primary vendor information |
| Tax Options | `/vendor/[id]/taxoverride` | Tax override settings |

**Related Records Group:**
| Tab | URL | Badge | Description |
|-----|-----|-------|-------------|
| Cores | `/vendor/[id]/cores` | - | Core returns for this vendor |

**Media Group:**
| Tab | URL | Badge | Description |
|-----|-----|-------|-------------|
| Media | `/vendor/[id]/media` | count | Photos, videos, documents |

**History Group:**
| Tab | URL | Description |
|-----|-----|-------------|
| P/O History | `/vendor/[id]/pohistory` | Purchase order history |
| OSR History | `/vendor/[id]/osrhistory` | Outside service repair history |
| Edit History | `/vendor/[id]/edithistory` | Audit trail of changes |

---

### 3. Main Info Tab

#### 3.1 Contact Info Section (Collapsible)
| Field | Type | Character Limit | Description |
|-------|------|-----------------|-------------|
| Contact | text | - | Primary contact name |
| Customer Code | text | - | Code used by vendor for this customer |
| Account | text | - | Account number with vendor |
| GL Account Number | text | - | General ledger account number |
| Email | text | - | Primary email address |
| Url | text | - | Vendor website URL (with link button) |
| Currency | combobox-search | - | Currency for transactions |
| Vendor Class | combobox-search | - | Vendor classification |
| Phone | text | - | Primary phone number |
| Phone Type | combobox-search | - | Phone type (Work, Mobile, etc.) |
| Phone 2 | text | - | Secondary phone number |
| Phone Type 2 | combobox-search | - | Phone 2 type |
| Phone 3 | text | - | Third phone number |
| Phone Type 3 | combobox-search | - | Phone 3 type |
| Phone 4 | text | - | Fourth phone number |
| Phone Type 4 | combobox-search | - | Phone 4 type (Fax, etc.) |
| Address | text | - | Street address line 1 |
| Address 2 | text | - | Street address line 2 |
| City | text | - | City |
| State | text | - | State/Province |
| Zip | text | - | Postal/ZIP code |
| Country | text | - | Country name |
| Use Country | checkbox | - | Include country on address labels |
| Notes | text-limited | 4000 | General notes |

#### 3.2 Ship Section (Collapsible)
| Field | Type | Description |
|-------|------|-------------|
| Ship Method | combobox-search | Default shipping method |
| Ship Address | text | Shipping street address |
| Ship Address 2 | text | Shipping address line 2 |
| Ship City | text | Shipping city |
| Ship State | text | Shipping state |
| Ship Zip | text | Shipping postal code |
| Ship Country | text | Shipping country |
| Ship Country (Use) | checkbox | Include country on shipping labels |

#### 3.3 Approval Section (Collapsible)
| Field | Type | Description |
|-------|------|-------------|
| Approve Type | dropdown | Approval status (Yes, Open) |
| Approval Expires | date (disabled) | Expiration date (MM/DD/YYYY) |
| Approval by | text (disabled) | User who approved the vendor |
| Approved on | datetime (disabled) | Date and time of approval |

**Note:** Approval Expires, Approval by, and Approved on fields are automatically populated when Approve Type is changed to "Yes".

#### 3.4 Other Section (Collapsible)
| Field | Type | Description |
|-------|------|-------------|
| Do not create P/O | checkbox | Prevent P/O creation for this vendor |
| Limit P/O to City | combobox-search | Restrict P/Os to specific city |
| Is OSR | checkbox | Vendor provides Outside Service Repairs |
| Is Supplier | checkbox | Vendor is a parts supplier |
| Is Tools | checkbox | Vendor provides tool services/calibration |
| Supplier Site Name | text | Supplier site identifier |
| Tax ID | text | Vendor's tax identification number |
| Has Warranty Claims | checkbox | Vendor handles warranty claims |
| Terms | combobox-search | Payment terms (Net 30 days, etc.) |
| Has Contract Pricing | checkbox | Vendor has contract pricing agreements |

---

### 4. Tax Options Tab
**URL:** `/vendor/[vendorID]/taxoverride`

**Purpose:** Configure work order tax override options for this vendor.

#### 4.1 Main Info Section
| Field | Type | Description |
|-------|------|-------------|
| Use Tax Override | checkbox | Enable tax override settings |
| Taxable | checkbox | Vendor transactions are taxable |
| Tax Method | combobox-search | Tax calculation method (Standard) |
| Tax Rate | percentage | Tax rate percentage |

#### 4.2 Taxable Items Section
| Field | Type | Description |
|-------|------|-------------|
| Use Tax Items | checkbox | Enable individual tax item settings |
| Tax Labor | checkbox | Tax labor charges |
| Tax OSR Labor | checkbox | Tax outside repair labor |
| Tax Parts | checkbox | Tax parts |
| Tax OSR Parts | checkbox | Tax outside repair parts |
| Tax Shipping Out | checkbox | Tax outbound shipping |
| Tax Shipping In | checkbox | Tax inbound shipping |
| Tax OSR Shipping In | checkbox | Tax OSR inbound shipping |
| Tax OSR Shipping Out | checkbox | Tax OSR outbound shipping |
| Tax Shop Supplies | checkbox | Tax shop supplies |
| Tax Misc Charges | checkbox | Tax miscellaneous charges |
| Tax Credit Card Fee | checkbox | Tax credit card fees |

---

### 5. P/O History Tab
**URL:** `/vendor/[vendorID]/pohistory`

**Purpose:** View purchase order history for this vendor.

#### 5.1 Filter Controls
| Control | Type | Description |
|---------|------|-------------|
| City | combobox-search | Filter by city (e.g., KTYS) |
| Status | combobox-search | Filter by P/O status (All, Ordered, etc.) |
| Type | combobox-search | Filter by type (Parts, Service) |

#### 5.2 Table Columns
| Column | Type | Description |
|--------|------|-------------|
| Created Date | date | P/O creation date (sortable) |
| City | text | City/location code |
| Purchase Order | text | P/O number (link to P/O detail) |
| Status | text | P/O status |
| Lead User | text | Responsible user |
| Part Number | text | Part number |
| Description | text | Part description |
| Qty Ordr | numeric | Quantity ordered |
| Qty Outst | numeric | Quantity outstanding |
| Destination | text | Stock room or work order |
| Eta | date | Expected arrival date |
| Part Cost | currency | Part cost |

#### 5.3 List Features
- Pagination: Fit the Screen, 25, 50 per page
- Sortable columns
- Export functionality

---

### 6. OSR History Tab
**URL:** `/vendor/[vendorID]/osrhistory`

**Purpose:** View outside service repair history for this vendor.

#### 6.1 Filter Controls
| Control | Type | Description |
|---------|------|-------------|
| City | combobox-search | Filter by city (e.g., KTYS) |
| Status | combobox-search | Filter by status (All, specific statuses) |
| Type | combobox-search | Filter by type (All, specific types) |

#### 6.2 Table Columns
| Column | Type | Description |
|--------|------|-------------|
| (checkbox) | selection | Row selection checkbox |
| Work Order | text | Work order number (link, sortable) |
| Status | text | OSR status |
| Item Number | text | Work order item number |
| Part Number | text | Part number |
| Description | text | Part/service description |
| Registration No. | text | Aircraft registration number |
| Vendor | text | Vendor name |
| Labor | currency | Labor charges |
| Parts | currency | Parts charges |
| Shipping In | currency | Inbound shipping charges |
| Shipping Out | currency | Outbound shipping charges |

#### 6.3 List Features
- Pagination: 25/50/100 per page
- Sortable columns
- Row selection for bulk actions

---

### 7. Media Tab
**URL:** `/vendor/[vendorID]/media`

**Purpose:** Manage media attachments for the vendor record.

**Media Categories:**
| Category | Description |
|----------|-------------|
| Photos | Image files |
| Videos | Video files |
| Documents | Document files (PDFs, etc.) |

**Features:**
- Upload files via "Choose File" button
- View counts by category
- Organize by media type

---

### 8. Edit History Tab
**URL:** `/vendor/[vendorID]/edithistory`

**Purpose:** View the audit trail of changes made to the vendor record.

**Displayed Information:**
- Action type (Insert, Update)
- Changed fields and values
- User who made the change
- Date/time of change
- IP address

---

### 9. User Actions

| Action | Description |
|--------|-------------|
| Search Vendors | Use advanced search with 30 filter options |
| Add Vendor | Quick create via modal or full detail entry |
| View Vendor Detail | Double-click row to open vendor record |
| Edit Vendor Fields | Modify any editable field and auto-save |
| Set Approval Status | Configure vendor approval and expiration |
| Configure Tax Options | Set tax override settings for vendor transactions |
| View P/O History | Review all purchase orders for this vendor |
| View OSR History | Review outside repair history for this vendor |
| Upload Media | Attach photos, videos, documents |
| View Edit History | Review audit trail of changes |
| Export List | Export vendor list data |

---

### 10. Business Rules Summary

#### Vendor Types:
- **Supplier**: Provides parts for purchase orders (Is Supplier checkbox)
- **OSR Provider**: Provides outside service repairs (Is OSR checkbox)
- **Tools Provider**: Provides tool services and calibration (Is Tools checkbox)
- A vendor can be multiple types simultaneously

#### Approval Workflow:
- Vendors can be "Open" (pending approval) or "Yes" (approved)
- Approved vendors have an expiration date
- Approval metadata (by, on) is automatically recorded
- "Approval Expiring (Days)" filter helps identify vendors needing renewal

#### P/O Restrictions:
- "Do not create P/O" prevents automatic P/O generation for vendor
- "Limit P/O to City" restricts P/O creation to specific locations

#### Vendor Classification:
- Vendor Class categorizes vendors by service type
- Examples: Propeller Repair & Overhaul, Tool Calibrations, Oxygen System Testing, etc.

#### Tax Override:
- Tax settings can be customized per vendor
- Overrides apply to work orders involving this vendor
- Individual tax items can be enabled/disabled

---

### 11. Integration Points

- **Purchase Order Module**: Vendor selection on P/Os; P/O history from vendor record
- **Work Order Module**: OSR vendor selection on work items; OSR history from vendor record
- **Master Parts Module**: Default supplier assignment on parts
- **Cores Module**: Vendor linked to core returns
- **Tools Module**: Vendor for tool calibration services
- **Warranty Claims Module**: Vendor for warranty processing (Has Warranty Claims)
- **Accounting System**: GL Account Number, Terms, Tax ID for financial integration

---

## Tools Module

### Overview
The Tools module manages certified, reference, and consumable tools used in aircraft maintenance operations. It provides tool tracking, transfer management between locations/work orders/users, calibration tracking for certified tools, and tool room inventory management across multiple facilities.

---

### 1. Tools List
**URL:** `/tool`

**Purpose:** View and manage the inventory of tools across tool rooms and cities.

---

#### 1.1 Header Controls

**City Filter:**
| Control | Type | Description |
|---------|------|-------------|
| City | dropdown | Filter tools by city/location (e.g., KTYS, KTKI, DLH) |
| Tool Room | dropdown | Filter by specific tool room within the city |

**Tool Room Options:**
- (All)
- BEH
- DLH
- EBIS
- ISM
- KTKI
- KTYS
- MSU

**Toolbar Buttons:**
| Button | Function |
|--------|----------|
| Add Tool | Quick create modal for new tool records |

**Add Tool Modal:**
| Field | Type | Description |
|-------|------|-------------|
| Tool Name | text (required) | Tool identifier/name |
| Tool Type | dropdown (required) | Certified, Consumable, Kit, Reference Only |
| Tool Room | lookup (required) | Assigned tool room location |
| Description | text-limited | Tool description (255 char max) |

**Actions:**
- Add: Create tool and stay on list
- Add and Goto: Create tool and navigate to detail view
- Cancel: Close modal without creating

---

#### 1.2 Left Sidebar Navigation

| Tab | Description |
|-----|-------------|
| List | Main tool inventory list (shows count badge) |
| Transfer | Transfer tools between locations |
| History | View all tool transfer history |
| Reports | Generate tool reports |

---

#### 1.3 List View Filters

**Status Filter:**
| Option | Description |
|--------|-------------|
| All | Show all tools |
| All Outstanding (Transfer) | Tools currently transferred out |
| All Outstanding (W/O Only) | Tools assigned to work orders |
| Overdue (Transfer) | Tools past their return date |
| Due within 3 Days (Transfer) | Tools due back within 3 days |
| Due within 7 Days (Transfer) | Tools due back within 7 days |
| Tool Available (No Open Transfer) | Tools in the tool room |
| Calib. Due Next 60 Days | Certified tools needing calibration soon |
| Calib. Due Next 90 Days | Certified tools needing calibration within 90 days |
| Returned Today | Tools returned today |
| Returned Last 7 Days | Tools returned in past week |

**Kit Filter:**
| Option | Description |
|--------|-------------|
| Hide Tools in Kits | Exclude tools that are part of tool kits |
| Show Tools in Kits | Include tools that are part of tool kits |

---

#### 1.4 List View Columns

| Column | Type | Description |
|--------|------|-------------|
| (checkbox) | checkbox | Row selection for bulk actions |
| Tool Name | text | Tool identifier/name |
| Type | text | Tool type (Ref, Cert, Cons, Kit) |
| Description | text | Detailed tool description |
| Make | text | Tool manufacturer |
| Model | text | Tool model number |
| Serial | text | Tool serial number |
| Tool Room | text | Current assigned tool room |
| Status | button | Current status (Tool Room, transferred location) |
| Return ETA | date | Expected return date if transferred |
| Calibr. Due | text | Days until calibration due (certified tools only) |
| Media | button | Count of attached media files |
| Transfer | button | Quick transfer action |

---

#### 1.5 List Features

- **Pagination:** 25/50/100 records per page
- **Total Records:** 735 tools (sample data)
- **Sorting:** Click column headers to sort
- **Row Selection:** Checkbox for bulk operations
- **Double-click:** Opens tool detail view
- **Status Button:** Shows current tool location status
- **Media Button:** Shows count and opens media viewer
- **Transfer Button:** Quick access to transfer the tool

---

### 2. Tool Detail View
**URL:** `/tool/[toolID]`

**Purpose:** View and edit detailed information for a specific tool.

---

#### 2.1 Detail Page Tabs

| Tab | URL | Description |
|-----|-----|-------------|
| Main Info | `/tool/[toolID]` | Core tool information |
| Media | `/tool/[toolID]/media` | Attached photos, videos, documents |
| Certifications | `/tool/[toolID]/certification` | Calibration history (Certified tools only) |
| Transfer History | `/tool/[toolID]/transfer` | History of tool transfers |
| Edit History | `/tool/[toolID]/edithistory` | Audit trail of changes |

---

#### 2.2 Main Info Fields

| Field | Type | Description |
|-------|------|-------------|
| Tool Type | dropdown | Certified, Consumable, Kit, Reference Only |
| Description | text-limited | Tool description (255 char max) |
| Details | text-limited | Additional details (255 char max) |
| Tool Room | lookup | Assigned tool room location |
| Tool Group | dropdown | Tool categorization group (e.g., In Service) |
| Make | text | Manufacturer name |
| Model | text | Model number |
| Serial | text | Serial number |
| Vendor | lookup | Calibration/service vendor |
| Tool Cost | text-numeric | Purchase cost ($) |
| Purchase Date | date | Date purchased (MM/DD/YYYY) |
| Location | text | Physical location within tool room |
| Location Notes | text-limited | Additional location details (255 char max) |
| Date Labeled | date | Date tool was labeled |

---

#### 2.3 Certification Fields (Certified Tools Only)

| Field | Type | Description |
|-------|------|-------------|
| Calibration Days | text-numeric | Days between calibrations |
| Calibration Notes | text-limited | Calibration schedule notes (4000 char max) |
| Calibration Cost | text-numeric (disabled) | Cost of calibration ($) |
| Calibration (Last Date) | date (disabled) | Last calibration date |
| Calibration Next Due Date | date (disabled) | Next calibration due |

---

#### 2.4 Tool Types

| Type | Code | Description |
|------|------|-------------|
| Certified | Cert | Tools requiring periodic calibration |
| Reference Only | Ref | Standard tools, no calibration required |
| Consumable | Cons | Single-use or limited-life tools |
| Kit | Kit | Collection of tools grouped together |

---

### 3. Certification History Tab
**URL:** `/tool/[toolID]/certification`

**Purpose:** View the calibration/certification history for certified tools.

---

#### 3.1 Certification History Columns

| Column | Type | Description |
|--------|------|-------------|
| (checkbox) | checkbox | Row selection |
| Date | date | Calibration date |
| Purchase Order | text | Associated P/O number |
| Vendor | text | Calibration service provider |
| Was Calibr. | text | Yes/No - was calibration performed |
| Due Next | date | Next calibration due date |
| Media | button | Attached calibration certificates |

---

### 4. Transfer History Tab
**URL:** `/tool/[toolID]/transfer`

**Purpose:** View the transfer history for a specific tool.

---

#### 4.1 Transfer History Columns

| Column | Type | Description |
|--------|------|-------------|
| Transfer Date | datetime | Date and time of transfer |
| From | text | Previous location (Tool Room, W/O, User) |
| To | text | New location |
| Notes | text | Transfer notes |
| Return ETA | date | Expected return date |
| Transfer By | text | User who performed transfer |

---

### 5. Tool Transfer
**URL:** `/tool/transfer`

**Purpose:** Transfer tools between tool rooms, work orders, users, or vendors.

---

#### 5.1 Transfer Wizard - Step 1: Main Info

| Field | Type | Description |
|-------|------|-------------|
| Tool Type | dropdown | Tool or Tool Kit |
| Tool | combobox-search | Select tool to transfer |

---

#### 5.2 Transfer Destinations

Tools can be transferred to:
- **Tool Room:** Different tool room location
- **Work Order Item:** Assigned to a specific work order item
- **User:** Temporary assignment to a technician
- **Vendor:** Sent out for calibration/repair

---

### 6. Transfer History (Global)
**URL:** `/tool/transfer/history`

**Purpose:** View all tool transfers across the selected city and tool room.

---

#### 6.1 Transfer History Columns

| Column | Type | Description |
|--------|------|-------------|
| Transfer Date | datetime | Date and time of transfer |
| Tool Name | text (link) | Name of transferred tool |
| From | text (link) | Previous location |
| To | text (link) | New location |
| Notes | text | Transfer notes |
| Return ETA | date | Expected return date |
| Transfer By | text | User who performed transfer |

---

#### 6.2 Transfer History Features

- **Pagination:** 25/50/100 per page
- **Total Records:** 17,620 transfers (sample data)
- **Clickable Links:** Tool name and locations link to related records
- **Date Sorting:** Sorted by most recent first

---

### 7. Reports
**URL:** `/tool/reports`

**Purpose:** Generate and export tool-related reports.

---

#### 7.1 Available Reports

| Report | Description |
|--------|-------------|
| Certified Tool List | Detailed list of certified tools with calibration status |

---

### 8. User Actions

| Action | Description |
|--------|-------------|
| Add Tool | Create a new tool via quick-create modal |
| View Tool List | Browse all tools by city and tool room |
| Filter Tools | Use status and kit filters to find specific tools |
| View Tool Detail | Double-click to open detailed tool information |
| Edit Tool | Modify tool information (auto-save) |
| Transfer Tool | Move tool to different location, W/O, user, or vendor |
| View Transfer History | Track where tools have been |
| View Certifications | See calibration history for certified tools |
| Attach Media | Upload photos, documents, calibration certificates |
| Generate Reports | Export tool lists and reports |

---

### 9. Business Rules Summary

#### Tool Types:
- **Certified Tools:** Require periodic calibration, track calibration due dates
- **Reference Tools:** Standard tools, no calibration tracking
- **Consumable Tools:** Limited-life tools
- **Tool Kits:** Groups of tools treated as a unit

#### Transfer Workflow:
- Tools can be in one location at a time
- Transfer creates history record with timestamp and user
- Return ETA can be set for temporary transfers
- Tools can transfer between: Tool Rooms, Work Orders, Users, Vendors

#### Calibration Tracking:
- Calibration Days defines interval between calibrations
- System calculates next due date automatically
- "Calib. Due" column shows days until calibration needed
- Filters help identify tools needing calibration

#### Tool Room Management:
- Tools are assigned to a primary Tool Room
- City filter narrows to tools at specific location
- Each location can have multiple tool rooms

---

### 10. Integration Points

- **Work Order Module:** Tools transferred to work order items; Tools tab on work order items
- **Purchase Order Module:** P/O linked to calibration certifications
- **Vendors Module:** Calibration service vendors linked to tools
- **Media System:** Photos, documents, calibration certificates attached to tools

---

## Warranty Claims Module

### Overview
The Warranty Claims module manages warranty claim submissions to manufacturers and vendors for aircraft maintenance work. It tracks work order items that are eligible for warranty reimbursement, organizes claims by vendor and status, and provides submission and reporting capabilities. Warranty claims are linked directly to work order items, enabling traceability between maintenance performed and reimbursement requests.

---

### 1. Warranty Claims List
**URL:** `/warranty`

**Purpose:** View and manage warranty claims across all vendors, filter by status, and initiate claim submissions.

---

#### 1.1 Left Sidebar Navigation

**City Filter:**
| Control | Type | Description |
|---------|------|-------------|
| City | dropdown | Filter claims by service center (e.g., KTYS, or "All") |

**Status Tabs:**
| Tab | Description |
|-----|-------------|
| Open | Claims awaiting submission (default view) |
| Sent | Claims submitted to vendor |
| Credited | Claims fully credited by vendor |
| Partial Credited | Claims partially credited |
| Rejected | Claims rejected by vendor |
| Void | Voided/cancelled claims |

**Actions:**
| Button | Description |
|--------|-------------|
| Submit | Navigate to claim submission page |
| Reports | Navigate to warranty reports |

---

#### 1.2 List View Columns
| Column | Type | Description |
|--------|------|-------------|
| (selection) | button | Row selection for batch operations |
| Vendor | text | Manufacturer/vendor name (e.g., "Cirrus Aircraft SR2X", "Jetstream") |
| City Abbreviation | text | Service center code (e.g., "KTYS") |
| Claim Number | button | Unique claim identifier - clickable to navigate to work order |
| Completed | checkbox/date | Completion status indicator |
| Reading | numeric | Aircraft hours/cycles at time of claim |
| Discrepancy | text | Description of the maintenance issue |
| Last Updated | date | Date of last modification |

**Claim Number Format:** `CQ[CITY][WORKORDER]-[ITEM]`
- Example: `CQKTYS1000-10-2021-1` = City KTYS, Work Order 1000-10-2021, Item 1

---

#### 1.3 List Features

**Pagination:**
- Options: 25, 50, 100 per page
- Page navigation with first/prev/next/last controls
- Total count displayed (e.g., "31550 Total")
- Go to specific page input

**Sorting:**
- Sortable by Vendor, City, Claim Number, Completed, Discrepancy, Last Updated
- Default sort: Vendor ascending

**Row Interactions:**
- Click Claim Number button to navigate to associated Work Order
- Selection buttons for batch operations

---

### 2. Claim Submission
**URL:** `/warranty/submit`

**Purpose:** Submit warranty claims to vendors for reimbursement.

---

#### 2.1 Submission Page Controls

| Control | Type | Description |
|---------|------|-------------|
| Vendor | combobox-search | Search and select vendor for claim submission |
| Export | button | Export claim data |
| Go to Vendor | button | Navigate to vendor detail page |

**Vendor Search:**
- Requires minimum 3 characters to search
- Shows matching vendors from warranty-enabled vendor list
- Vendors must have "Has Warranty Claims" enabled in vendor settings

---

### 3. Reports
**URL:** `/warranty/reports`

**Purpose:** Generate warranty claim reports and exports.

---

#### 3.1 Available Reports

| Report | Description |
|--------|-------------|
| City/Vendor Monthly Summary | Export breakdown by city and vendor, summarized by month |
| Export Warranty Totals | Export individual warranty claims with their individual totals |

---

### 4. User Actions

| Action | Description |
|--------|-------------|
| View claims by status | Filter claims using status tabs (Open, Sent, Credited, etc.) |
| Filter by city | Narrow claims to specific service center |
| Navigate to Work Order | Click claim number to view associated work order item |
| Submit claims | Use Submit page to send claims to vendors |
| Export claims | Generate reports and exports for vendor submission |
| Track claim status | Monitor claim progression through status tabs |

---

### 5. Business Rules Summary

#### Claim Generation:
- Warranty claims are generated from work order items
- Claims are linked to specific vendors/manufacturers
- Each claim references a single work order item

#### Claim Number Structure:
- Format: CQ + City Code + Work Order Number + Item Number
- Provides full traceability to source work order

#### Status Workflow:
```
Open → Sent → Credited/Partial Credited/Rejected
                    ↓
                   Void (can occur at any stage)
```

#### Vendor Requirements:
- Vendors must have "Has Warranty Claims" checkbox enabled
- Vendors can be associated with specific aircraft makes for warranty purposes

#### Reading Tracking:
- Aircraft hours/cycles recorded at time of claim
- Supports warranty period validation based on usage

---

### 6. Integration Points

- **Work Order Module:** Source of warranty claims; claim numbers link directly to work order items
- **Vendors Module:** Warranty claims submitted to vendors; "Has Warranty Claims" setting enables vendor for warranty
- **Aircraft Module:** Aircraft readings (hours/cycles) tracked for warranty validation
- **Billing:** Warranty claims may affect billing (e.g., "Flat Rate", "No Charge" items)

---

## Time Clock Module

### Overview
The Time Clock module enables employee time tracking for technicians and other staff. It provides clock in/out functionality, monitors currently active employees, and offers various views for analyzing time worked versus time logged on work orders (efficiency tracking). The module supports both real-time monitoring of who is clocked in and historical reporting of time data.

---

### 1. Log In & Out
**URL:** `/timeclock`

**Purpose:** Allow employees to clock in and out of the time tracking system.

---

#### 1.1 Clock Status Display

**Display Elements:**
| Element | Description |
|---------|-------------|
| Status Message | Shows whether the user's time clock is "ACTIVE" or "NOT active" |
| Timestamp | When active, displays the clock-in date and time (format: YYYY-MM-DD HH:MM:SS) |
| Action Button | "Log In" when not active, "Log Out" when active |

**User Actions:**
| Action | Description |
|--------|-------------|
| Log In | Clock in to the time tracking system; records current timestamp |
| Log Out | Clock out of the time tracking system; records duration worked |

**Notifications:**
- "You are now logged in." - Displayed after successful clock-in
- "You are now logged out." - Displayed after successful clock-out

---

### 2. Active Time Clocks
**URL:** `/timeclock/active`

**Purpose:** Monitor all employees currently clocked in across the organization.

---

#### 2.1 Header Controls

**Filter Controls:**
| Control | Type | Options | Description |
|---------|------|---------|-------------|
| Status Filter | dropdown | All, Logged In, Logged Out, Logged In Today, Not Logged in Today | Filter employees by clock status |
| User Group | dropdown | (All), [configured groups] | Filter by user group |

---

#### 2.2 List View Columns
| Column | Type | Description |
|--------|------|-------------|
| Employee | text | Employee name |
| User Group | text | Assigned user group (if applicable) |
| City | text | City/location code (e.g., KTYS) |
| Logged In | datetime | Date and time employee clocked in |
| Hrs. (In) | numeric | Total hours logged in (cumulative) |
| First Login | datetime | First login timestamp of the session |
| Hrs/Day | numeric | Hours worked today |
| Hrs (WO) | numeric | Hours logged on work orders |
| Work Order | button | Link to view work order activity ("Active W/O" or "Last W/O") |
| Action | button | Additional row actions |

---

#### 2.3 List Features
- Pagination: 25/50/100 per page
- Total record count displayed
- Column sorting
- Row actions for individual employee management

---

### 3. Summary
**URL:** `/timeclock/summary`

**Purpose:** View aggregated time clock and work order hours for employees over a date range.

**URL Parameters:**
- `startDate` - Start of date range (YYYY-MM-DD)
- `endDate` - End of date range (YYYY-MM-DD)

---

#### 3.1 Header Controls

**Filter Controls:**
| Control | Type | Options | Description |
|---------|------|---------|-------------|
| User Group | dropdown | (All Groups), [configured groups] | Filter by user group |

---

#### 3.2 List View Columns
| Column | Type | Description |
|--------|------|-------------|
| Employee | text | Employee name |
| User Group | text | Assigned user group |
| City | text | City/location code |
| Hrs (WO) | numeric | Hours logged on work orders |
| Hrs (TC) | numeric | Hours on time clock |
| Effcy. % | numeric | Efficiency percentage (WO hours / TC hours × 100) |

---

#### 3.3 List Features
- Pagination: 25/50/100 per page
- Total record count displayed
- Sortable by Efficiency % (ascending/descending indicator)
- Date range filtering via URL parameters

---

### 4. Summary by Day
**URL:** `/timeclock/day`

**Purpose:** View time data broken down by individual days and employees.

**URL Parameters:**
- `startDate` - Start of date range (YYYY-MM-DD)
- `endDate` - End of date range (YYYY-MM-DD)
- `sortBy` - Sort field and direction (e.g., "ForDate ASC")

---

#### 4.1 Header Controls

**Filter Controls:**
| Control | Type | Options | Description |
|---------|------|---------|-------------|
| User Group | dropdown | (All Groups), [configured groups] | Filter by user group |
| Employee | dropdown | (All Employees), [employee list] | Filter by specific employee |

---

#### 4.2 List View Columns
| Column | Type | Description |
|--------|------|-------------|
| Date | date | Date of record (MM/DD/YYYY format) |
| Employee | text | Employee name |
| User Group | text | Assigned user group |
| City | text | City/location code |
| W/O Hrs | numeric | Work order hours for that day |
| T/C Hrs | numeric | Time clock hours for that day |
| Efficiency % | numeric | Daily efficiency percentage |

---

#### 4.3 List Features
- Pagination: 25/50/100 per page
- Total record count displayed
- Sortable columns
- Date range filtering via URL parameters

---

### 5. Detail
**URL:** `/timeclock/detail`

**Purpose:** View individual clock in/out records with full timestamp detail.

**URL Parameters:**
- `startDate` - Start of date range (YYYY-MM-DD)
- `endDate` - End of date range (YYYY-MM-DD)

---

#### 5.1 Header Controls

**Filter Controls:**
| Control | Type | Options | Description |
|---------|------|---------|-------------|
| User Group | dropdown | (All Groups), [configured groups] | Filter by user group |
| Employee | dropdown | (All Employees), [employee list] | Filter by specific employee |

---

#### 5.2 List View Columns
| Column | Type | Description |
|--------|------|-------------|
| Employee | text | Employee name |
| User Group | text | Assigned user group |
| City | text | City/location code |
| Logged In | datetime | Clock-in timestamp (YYYY-MM-DD HH:MM:SS) |
| Logged Out | datetime | Clock-out timestamp (YYYY-MM-DD HH:MM:SS) |
| Hours | numeric | Duration of the time clock session |
| Manual Entry | indicator | Flag indicating if record was manually entered |
| Edited | indicator | Flag indicating if record was modified after creation |

---

#### 5.3 List Features
- Pagination: 25/50/100 per page
- Total record count displayed
- Audit indicators for manual/edited records
- Date range filtering via URL parameters

---

### 6. Breakdown
**URL:** `/timeclock/breakdown`

**Purpose:** View detailed breakdown of time worked (specific breakdown view).

**URL Parameters:**
- `startDate` - Start of date range (YYYY-MM-DD)
- `endDate` - End of date range (YYYY-MM-DD)

---

#### 6.1 Header Controls

**Filter Controls:**
| Control | Type | Options | Description |
|---------|------|---------|-------------|
| User Group | dropdown | (All Groups), [configured groups] | Filter by user group |
| Employee | dropdown | (All Employees), [employee list] | Filter by specific employee |

---

#### 6.2 List Features
- Pagination: 25/50/100 per page
- Date range filtering via URL parameters

---

### 7. Reports
**URL:** `/timeclock/reports`

**Purpose:** Access time clock-related reports for analysis and management.

---

#### 7.1 Available Reports

| Report | Description |
|--------|-------------|
| Technician Comparison | View Time Clock and W/O time worked for technicians |
| Technician Comparison (My Logs for Today) | Quickly view the technician comparison report for today for this current user account |
| Time Clock Summary | View time clock data summarized by day and employee, grouped by either each date or employee |

---

### 8. User Actions Summary
| Action | Location | Description |
|--------|----------|-------------|
| Clock In | Log In & Out | Record start of work shift |
| Clock Out | Log In & Out | Record end of work shift |
| View Active Clocks | Active Time Clocks | Monitor employees currently clocked in |
| Filter by Status | Active Time Clocks | Filter employees by login status |
| Filter by User Group | All views | Narrow results to specific user groups |
| Filter by Employee | Summary/Detail views | View data for specific employees |
| Filter by Date Range | Summary/Detail views | View data for specific time periods |
| View W/O Activity | Active Time Clocks | Navigate to employee's work order activity |
| Generate Reports | Reports | Access time-related reports |

---

### 9. Business Rules Summary

#### Clock In/Out:
- Each user can only have one active time clock session at a time
- Clock-in records the current timestamp
- Clock-out calculates the duration and closes the session
- System tracks both manual entries and edits for audit purposes

#### Efficiency Calculation:
- Efficiency % = (Work Order Hours / Time Clock Hours) × 100
- Used to measure productive vs. total clocked-in time
- Helps identify utilization patterns

#### Time Tracking:
- Time is tracked at the city/location level
- User groups can be used to organize and filter employees
- Historical data is accessible via date range parameters

#### Audit Trail:
- Manual Entry flag indicates records not from clock in/out action
- Edited flag indicates records modified after initial creation
- Provides transparency for payroll and compliance purposes

---

### 10. Integration Points

- **Work Order Module:** Time logged against work orders for efficiency calculation
- **Technician Activity Module:** Related tracking of technician work activities
- **Scheduler Module:** Coordination with scheduled work assignments
- **User Management:** User groups control filtering and reporting access
- **Payroll Systems:** Time data may export for payroll processing (via reports)

---

---

## Scheduler Module

### Overview
The Scheduler module provides a calendar-based interface for managing and viewing scheduled events related to aircraft maintenance operations. It supports multiple calendar views (Month, Week, Day, Agenda) and allows users to schedule events associated with customers, aircraft, employees, or other activities. The module integrates with work order services and departments for comprehensive scheduling.

---

### 1. Scheduler Calendar
**URL:** `/scheduler`

**Purpose:** View and manage scheduled events in a calendar format with multiple view options.

---

#### 1.1 Header Controls

**Filter Dropdowns:**
| Filter | Type | Options | Description |
|--------|------|---------|-------------|
| City | combobox-search | (All Cities), KTYS, etc. | Filter events by city/location |
| Type | combobox-search | (All Types), Customer, Aircraft, Employee, Other | Filter by event type |
| Department | combobox-search | (All Departments), Field Services, FSC 1st Shift, FSC 2nd Shift, FSC 3rd Shift, FSC Mechanics, FSC Paint & Detail 1-6, FSC Wknd Shift, etc. | Filter by work department |
| Service Group | combobox-search | (All Service Groups), Customer, Customer Service, Internal | Filter by service group category |

**Navigation Controls:**
| Control | Type | Description |
|---------|------|-------------|
| Today | button | Navigate to current date |
| Previous | button (arrow) | Navigate to previous period |
| Next | button (arrow) | Navigate to next period |
| Date Display | text | Shows current period (e.g., "January 2026", "January 25 – 31", "Friday Jan 30") |

**View Controls:**
| Control | Type | Description |
|---------|------|-------------|
| Month | button | Switch to month view |
| Week | button | Switch to week view |
| Day | button | Switch to day view |
| Agenda | button | Switch to agenda/list view |
| Add Event | button (+ icon) | Open Add New Event dialog |
| Print | button (printer icon) | Open Print Scheduler dialog |

---

#### 1.2 Calendar Views

**Month View:**
- Displays full month calendar grid (Sun-Sat)
- Shows 5-6 weeks depending on month
- Clicking a date navigates to Day view for that date
- Events displayed within day cells

**Week View:**
- Displays 7 consecutive days (Sunday through Saturday)
- Shows hourly time slots from 7:00 AM to 5:00 PM
- Date range shown in header (e.g., "January 25 – 31")
- Column headers show day number and day name (e.g., "30 Fri")

**Day View:**
- Displays single day with hourly breakdown
- Time slots from 7:00 AM to 5:00 PM
- Shows date in header (e.g., "Friday Jan 30")
- Events displayed in time slots

**Agenda View:**
- Displays list of events for a date range
- Default range approximately 30 days from current date
- Shows message "There are no events in this range" when empty
- Date range shown in header (e.g., "01/30/2026 – 03/01/2026")

---

### 2. Add New Event Dialog

**Purpose:** Create new scheduled events in the calendar.

#### 2.1 Event Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| City | combobox-search | Yes | Select city/location for event |
| Type | combobox-search | Yes | Event type (Customer, Aircraft, Employee, Other) |
| [Dynamic Field] | combobox-search | Conditional | Appears based on Type selection (see below) |
| Service | combobox-search | No | Select service type (searchable, with lookup button) |
| Name | text | No | Event name/title |
| Department | combobox-search | No | Work department assignment |
| All Day | checkbox | No | Toggle for all-day event (checked by default) |
| Start | date | Yes | Start date (MM/DD/YYYY format) |
| End | date | Yes | End date (MM/DD/YYYY format) |
| Notes | text-limited | No | Additional notes (4000 characters max) |
| Time Zone | combobox-search | Yes | Time zone selection (defaults to Central Standard Time) |

**Dynamic Fields by Type:**
| Type Selected | Dynamic Field | Field Type | Description |
|---------------|---------------|------------|-------------|
| Customer | Customer | combobox-search | Search for customer (min 3 characters) |
| Aircraft | Aircraft | combobox-search | Search for aircraft |
| Employee | User | combobox-search | Search for employee/user |
| Other | (none) | - | No additional field |

**Dialog Actions:**
| Button | Description |
|--------|-------------|
| Save | Create the event |
| Cancel | Close dialog without saving |

---

### 3. Print Scheduler Dialog

**Purpose:** Generate printable scheduler reports with filtering options.

#### 3.1 Print Report Fields

| Field | Type | Description |
|-------|------|-------------|
| Grouping | dropdown | Report grouping: Detail, Event Type, City |
| Start Date | date | Report start date (MM/DD/YYYY) |
| End Date | date | Report end date (MM/DD/YYYY) |
| City | combobox-search | Filter by city (clearable) |
| Record Type | combobox-search | Filter by event type |
| Service Group | combobox-search | Filter by service group |
| Service | combobox-search | Filter by specific service |
| Department | combobox-search | Filter by department |

**Dialog Actions:**
| Button | Description |
|--------|-------------|
| Continue | Generate the report |
| Cancel | Close dialog without printing |

---

### 4. Event Types

| Type | Description | Associated Field |
|------|-------------|------------------|
| Customer | Customer-related appointments | Links to Customer record |
| Aircraft | Aircraft maintenance scheduling | Links to Aircraft record |
| Employee | Employee scheduling (time off, training, etc.) | Links to User record |
| Other | General/miscellaneous events | No linked record |

---

### 5. User Actions

| Action | Description |
|--------|-------------|
| View Calendar | Display scheduled events in Month/Week/Day/Agenda format |
| Filter Events | Narrow displayed events by City, Type, Department, Service Group |
| Navigate Calendar | Move between dates using Today, Previous, Next controls |
| Switch View | Toggle between Month, Week, Day, and Agenda views |
| Click Date | Navigate from Month view to Day view for selected date |
| Add Event | Create new scheduled event via Add New Event dialog |
| Print Schedule | Generate printable report via Print Scheduler dialog |

---

### 6. Business Rules Summary

#### Calendar Navigation:
- Today button always returns to current date in current view
- Clicking a date in Month view navigates to Day view for that date
- Date range adjusts automatically based on selected view

#### Event Creation:
- City is pre-populated based on user's default/current selection
- Type selection dynamically shows/hides associated record search field
- All Day events only require date, not time
- Start and End dates default to the currently viewed date
- Notes field limited to 4000 characters
- Time Zone defaults to Central Standard Time

#### Filtering:
- All filters default to "All" (no filtering)
- Multiple filters can be combined
- Filters persist when switching between calendar views

#### Work Hours Display:
- Week and Day views show business hours: 7:00 AM to 5:00 PM
- Events scheduled outside these hours may require scrolling

---

### 7. Integration Points

- **Customer Module:** Customer events link to customer records for appointment tracking
- **Aircraft Module:** Aircraft events link to aircraft records for maintenance scheduling
- **User Management:** Employee events link to user records; department filtering uses user group data
- **Work Order Module:** Services available for scheduling align with work order service types
- **Time Clock Module:** Employee scheduling coordinates with time clock entries
- **Technician Activity Module:** Scheduled work relates to technician activity tracking

---

## Technician Activity Module

### Overview
The Technician Activity module provides real-time visibility into technician work assignments and productivity metrics. It displays which technicians are currently active, what work orders and tasks they are assigned to, and tracks their hours worked. This module serves as a dashboard for supervisors and managers to monitor workforce utilization and activity status across the maintenance operation.

---

### 1. Technician Activity List
**URL:** `/techactivity`

**Purpose:** Monitor technician assignments, activity status, and productivity metrics in real-time.

---

#### 1.1 Header Controls

| Control | Type | Description |
|---------|------|-------------|
| Tech Group | combobox-search | Filter by technician group/role (53 options available) |

**Tech Group Filter Options (partial list):**
- (All Tech Groups) - default, shows all technicians
- A&P
- AMT
- AMT Inspector
- AMT/Inspector
- Chief Inspector
- Continuous Improvement
- Detail / Detailer
- Director of Maintenance
- Engineering
- Exterior Finisher / Exterior Finisher Lead
- Field Tech
- Flight Ops
- Information Technology
- Inspector / Inspector/Lead
- Lead / Lead/Insp
- Line Tech
- Manager
- Paint & Detail Supervisor
- Parts & Warranty
- Repairman
- Scheduler / Service Advisor
- Shop Supervisor
- Sr. Crew Chief
- Tech / Technician / Technician-Inspector
- Warranty
- Weekend Lead

---

#### 1.2 List View Columns

| Column | Type | Description |
|--------|------|-------------|
| (expand) | button | Expand to view technician's time log detail |
| Tech Group | text | Technician's assigned group/role |
| Technician | text (link) | Technician name - clickable to view detail |
| Active | text | Current active status (Yes/No) |
| Last Worked | date | Date of most recent activity (MM/DD/YYYY) |
| Reg. No. | text | Aircraft registration number currently assigned |
| Work Order | text (link) | Current work order number and item - clickable to open W/O |
| Discrepancy | text | Description of current work item/task |
| Hrs (Today) | numeric | Hours logged today (decimal format: 0.00) |
| Avg Hrs (Last 7) | numeric | Average hours over last 7 days (decimal format: 0.00) |

**Column Visibility:**
- Click column header button to open "Columns" dialog
- Toggle visibility of any column
- Drag to reorder columns

---

#### 1.3 List Features

**Pagination:**
- Options: 25, 50, 100 per page
- Page navigation: Previous, Next, direct page entry
- Total record count displayed

**Sorting:**
- Default sort: Technician (alphabetical, ascending)
- Click column headers to sort
- Sort indicator icon shown on active sort column

**Row Actions:**
- Click expand button: Opens technician time log detail view
- Click Work Order link: Navigates to work order detail page
- Click Technician name: Opens technician activity detail

---

### 2. Technician Activity Detail
**URL:** `/techactivity/[technicianId]?startDate=[date]&endDate=[date]`

**Purpose:** View detailed time log entries for a specific technician within a date range.

---

#### 2.1 Detail View Columns

| Column | Type | Description |
|--------|------|-------------|
| (expand) | button | Expand row for additional details |
| Logged In | datetime | Clock-in timestamp |
| Logged Out | datetime | Clock-out timestamp |
| Total Hrs. | numeric | Total hours for the entry |
| Timer Type | text | Type of time tracking entry |
| Work Order | text (link) | Associated work order number |
| Item | text | Work order item number |
| Discrepancy | text | Task/item description |
| Added | datetime | When the entry was created |

**Features:**
- Date range filter controlled by URL parameters (startDate, endDate)
- Pagination: 25, 50, 100 per page
- Sortable columns (default: Logged In, descending)

---

### 3. User Actions

| Action | Description |
|--------|-------------|
| Filter by Tech Group | Narrow list to specific technician role/group |
| View Technician Detail | Click expand button or technician name to see time logs |
| Navigate to Work Order | Click work order link to view full work order details |
| Customize Columns | Show/hide and reorder list columns |
| Change Pagination | Adjust records per page (25/50/100) |
| Sort List | Click column headers to sort ascending/descending |

---

### 4. Business Rules Summary

#### Activity Tracking:
- Technicians are listed based on their most recent work activity
- "Active" status indicates technician is currently clocked into a work item
- Hours metrics update in real-time as technicians log time

#### Work Order Association:
- Each technician row shows their current/last work order assignment
- Work order format: [W/O Number], #[Item Number] (e.g., "KTYS43571-09-2025, #4")
- Clicking work order navigates to the work order item detail page

#### Time Metrics:
- "Hrs (Today)" shows cumulative hours logged for current date
- "Avg Hrs (Last 7)" calculates average daily hours over rolling 7-day period
- Hours displayed in decimal format (e.g., 8.50 = 8 hours 30 minutes)

#### Tech Group Classification:
- Technicians are assigned to groups based on their role/certification
- Groups include various levels: AMT, Inspector, Lead, Supervisor, etc.
- Filter enables supervisors to focus on specific team segments

---

### 5. Integration Points

- **Work Order Module:** Direct navigation to work order detail; displays current W/O assignment
- **Time Clock Module:** Time entries synchronized with technician time clock records
- **User Management:** Tech Groups align with user role/certification classifications
- **Scheduler Module:** Scheduled work relates to technician availability and assignments
- **Aircraft Module:** Displays aircraft registration number for current assignment

---

*Document Version: 2.4*
*Generated: 2026-01-30*
*Source: EBIS Platform Analysis*
