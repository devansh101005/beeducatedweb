# Courses & Enrollment System Design

## Overview

A complete courses enrollment system with Razorpay payment integration for BeEducated LMS.

---

## 1. High-Level System Design

### 1.1 Frontend Flow

```
/courses
    │
    ├── [Coaching Online]     → Coming Soon badge
    ├── [Coaching Offline]    → ACTIVE → /courses/coaching-offline
    ├── [Test Series]         → Coming Soon badge
    └── [Home Tuition]        → Coming Soon badge

/courses/coaching-offline
    │
    ├── Class 9 Card  → [Enroll Now] → Payment Flow
    ├── Class 10 Card → [Enroll Now] → Payment Flow
    ├── Class 11 Card → [Enroll Now] → Payment Flow
    └── Class 12 Card → [Enroll Now] → Payment Flow

Payment Flow:
    1. Click "Enroll Now"
    2. Frontend calls POST /api/v2/enrollments/initiate
    3. Backend creates Razorpay order
    4. Frontend opens Razorpay checkout
    5. On success: Frontend calls POST /api/v2/enrollments/verify
    6. Backend verifies signature → Creates enrollment
    7. Student gets access
```

### 1.2 Backend Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  GET /courses              → List course types               │
│  GET /courses/:type/classes → List classes for course type  │
│  GET /classes/:id          → Get class details + fees       │
│  POST /enrollments/initiate → Create Razorpay order         │
│  POST /enrollments/verify   → Verify payment + enroll       │
│  GET /enrollments/my        → Get student's enrollments     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  CourseService   → Course & class management                │
│  EnrollmentService → Enrollment lifecycle                   │
│  PaymentService  → Razorpay integration                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (Supabase)                       │
├─────────────────────────────────────────────────────────────┤
│  course_types → courses → classes → fee_plans               │
│  enrollments → payments                                      │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Payment Flow (Critical)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │     │ Backend  │     │ Razorpay │     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ 1. Initiate    │                │                │
     │───────────────>│                │                │
     │                │ 2. Create Order│                │
     │                │───────────────>│                │
     │                │                │                │
     │                │ 3. Order ID    │                │
     │                │<───────────────│                │
     │                │                │                │
     │                │ 4. Save pending│                │
     │                │────────────────────────────────>│
     │                │                │                │
     │ 5. Order data  │                │                │
     │<───────────────│                │                │
     │                │                │                │
     │ 6. Open checkout                │                │
     │────────────────────────────────>│                │
     │                │                │                │
     │ 7. Payment done│                │                │
     │<────────────────────────────────│                │
     │                │                │                │
     │ 8. Verify      │                │                │
     │───────────────>│                │                │
     │                │ 9. Verify sig  │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │ 10. Confirmed  │                │
     │                │<───────────────│                │
     │                │                │                │
     │                │ 11. Update payment + create enrollment
     │                │────────────────────────────────>│
     │                │                │                │
     │ 12. Success    │                │                │
     │<───────────────│                │                │
     │                │                │                │
```

### 1.4 Enrollment Lifecycle

```
States:
  PENDING   → Payment initiated, awaiting completion
  ACTIVE    → Payment successful, enrolled
  EXPIRED   → Enrollment period ended
  CANCELLED → Manually cancelled/refunded

Transitions:
  [New] ──────────────> PENDING (on initiate)
  PENDING ─────────────> ACTIVE (on payment success)
  PENDING ─────────────> CANCELLED (on payment failure/timeout)
  ACTIVE ──────────────> EXPIRED (on expiry date)
```

---

## 2. Database Schema

### 2.1 Tables

```sql
-- Course Types (the 4 main categories)
CREATE TABLE course_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,        -- 'coaching_offline', 'coaching_online', etc.
  name VARCHAR(100) NOT NULL,              -- 'Coaching (Offline)'
  description TEXT,
  icon VARCHAR(50),                        -- Icon name for frontend
  is_active BOOLEAN DEFAULT false,         -- Only coaching_offline is true
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes within each course type
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_type_id UUID NOT NULL REFERENCES course_types(id),
  name VARCHAR(100) NOT NULL,              -- 'Class 9', 'Class 10'
  description TEXT,
  duration VARCHAR(50),                    -- '1 Year', '6 Months'
  syllabus TEXT[],                         -- Array of topics
  features TEXT[],                         -- Array of features
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  max_students INTEGER,                    -- Optional capacity limit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fee Plans for each class
CREATE TABLE fee_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id),
  name VARCHAR(100) NOT NULL,              -- 'Standard Plan', 'Premium Plan'
  registration_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  tuition_fee DECIMAL(10,2) NOT NULL,
  material_fee DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_label VARCHAR(100),             -- 'Early Bird Discount'
  total_amount DECIMAL(10,2) NOT NULL,     -- Calculated total
  validity_months INTEGER DEFAULT 12,      -- Enrollment validity
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,        -- Default plan for class
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments (student-class relationship)
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  fee_plan_id UUID NOT NULL REFERENCES fee_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, active, expired, cancelled
  enrolled_at TIMESTAMPTZ,                 -- When payment completed
  expires_at TIMESTAMPTZ,                  -- When enrollment expires
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, class_id)             -- One enrollment per class per student
);

-- Payments (linked to enrollments)
CREATE TABLE enrollment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id),

  -- Razorpay fields
  razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(500),

  -- Amount details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, paid, failed, refunded

  -- Metadata
  payment_method VARCHAR(50),              -- card, upi, netbanking, etc.
  error_code VARCHAR(100),
  error_description TEXT,

  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_classes_course_type ON classes(course_type_id);
CREATE INDEX idx_fee_plans_class ON fee_plans(class_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_payments_order ON enrollment_payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON enrollment_payments(status);
```

### 2.2 Initial Seed Data

```sql
-- Insert course types
INSERT INTO course_types (slug, name, description, icon, is_active, display_order) VALUES
('coaching_offline', 'Coaching (Offline)', 'In-person classroom coaching with experienced faculty', 'School', true, 1),
('coaching_online', 'Coaching (Online)', 'Live online classes from anywhere', 'Monitor', false, 2),
('test_series', 'Test Series', 'Practice tests and mock exams', 'FileText', false, 3),
('home_tuition', 'Home Tuition', 'Personalized one-on-one tutoring at home', 'Home', false, 4);

-- Insert classes for coaching_offline
INSERT INTO classes (course_type_id, name, description, duration, features, display_order)
SELECT
  id,
  'Class 9',
  'Foundation course for Class 9 students covering all subjects',
  '1 Year',
  ARRAY['Expert Faculty', 'Study Materials', 'Weekly Tests', 'Doubt Sessions', 'Parent Meetings'],
  1
FROM course_types WHERE slug = 'coaching_offline';

-- (Similar inserts for Class 10, 11, 12)

-- Insert fee plans
INSERT INTO fee_plans (class_id, name, registration_fee, tuition_fee, material_fee, discount_amount, total_amount, is_default)
SELECT
  c.id,
  'Standard Plan',
  500,      -- Registration fee
  12000,    -- Tuition fee
  1500,     -- Material fee
  0,        -- No discount
  14000,    -- Total
  true
FROM classes c
JOIN course_types ct ON c.course_type_id = ct.id
WHERE ct.slug = 'coaching_offline' AND c.name = 'Class 9';
```

---

## 3. Backend API Design

### 3.1 Course Types API

```typescript
// GET /api/v2/courses
// Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "coaching_offline",
      "name": "Coaching (Offline)",
      "description": "In-person classroom coaching...",
      "icon": "School",
      "isActive": true,
      "displayOrder": 1
    },
    // ... other course types
  ]
}
```

### 3.2 Classes API

```typescript
// GET /api/v2/courses/:courseType/classes
// Example: GET /api/v2/courses/coaching_offline/classes

// Response:
{
  "success": true,
  "data": {
    "courseType": {
      "id": "uuid",
      "slug": "coaching_offline",
      "name": "Coaching (Offline)"
    },
    "classes": [
      {
        "id": "uuid",
        "name": "Class 9",
        "description": "Foundation course...",
        "duration": "1 Year",
        "features": ["Expert Faculty", "Study Materials", ...],
        "feePlan": {
          "id": "uuid",
          "name": "Standard Plan",
          "registrationFee": 500,
          "tuitionFee": 12000,
          "materialFee": 1500,
          "discountAmount": 0,
          "totalAmount": 14000
        },
        "isEnrolled": false,  // For authenticated users
        "enrollmentStatus": null
      }
    ]
  }
}
```

### 3.3 Enrollment Initiate API

```typescript
// POST /api/v2/enrollments/initiate
// Headers: Authorization: Bearer <clerk_token>

// Request:
{
  "classId": "uuid",
  "feePlanId": "uuid"
}

// Response (Success):
{
  "success": true,
  "data": {
    "enrollmentId": "uuid",
    "orderId": "order_xxxxx",
    "amount": 1400000,  // In paise (14000 * 100)
    "currency": "INR",
    "keyId": "rzp_test_xxxxx",
    "prefill": {
      "name": "John Doe",
      "email": "john@example.com",
      "contact": "9876543210"
    },
    "notes": {
      "enrollmentId": "uuid",
      "classId": "uuid",
      "studentId": "uuid"
    }
  }
}

// Response (Already Enrolled):
{
  "success": false,
  "message": "You are already enrolled in this class"
}
```

### 3.4 Payment Verification API

```typescript
// POST /api/v2/enrollments/verify
// Headers: Authorization: Bearer <clerk_token>

// Request:
{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature_hash"
}

// Response (Success):
{
  "success": true,
  "data": {
    "enrollment": {
      "id": "uuid",
      "status": "active",
      "enrolledAt": "2026-01-28T...",
      "expiresAt": "2027-01-28T..."
    },
    "message": "Successfully enrolled!"
  }
}

// Response (Verification Failed):
{
  "success": false,
  "message": "Payment verification failed"
}
```

### 3.5 My Enrollments API

```typescript
// GET /api/v2/enrollments/my
// Headers: Authorization: Bearer <clerk_token>

// Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "active",
      "enrolledAt": "2026-01-28T...",
      "expiresAt": "2027-01-28T...",
      "class": {
        "id": "uuid",
        "name": "Class 9",
        "courseType": "Coaching (Offline)"
      },
      "payment": {
        "amount": 14000,
        "paidAt": "2026-01-28T..."
      }
    }
  ]
}
```

### 3.6 Razorpay Signature Verification

```typescript
// Backend verification logic (CRITICAL)
import crypto from 'crypto';

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}
```

---

## 4. Frontend Component Structure

### 4.1 Folder Layout

```
client/src/
├── modules/
│   └── courses/
│       ├── index.ts                    # Barrel exports
│       ├── components/
│       │   ├── CourseTypeCard.tsx      # Card for course type
│       │   ├── ClassCard.tsx           # Card for individual class
│       │   ├── FeeBreakdown.tsx        # Fee details component
│       │   ├── EnrollButton.tsx        # Enroll/Payment button
│       │   ├── StatusBadge.tsx         # Active/Coming Soon badge
│       │   ├── EnrollmentCard.tsx      # For my-enrollments page
│       │   └── PaymentModal.tsx        # Razorpay integration modal
│       ├── pages/
│       │   ├── CoursesPage.tsx         # Main /courses page
│       │   ├── CoachingOfflinePage.tsx # /courses/coaching-offline
│       │   └── MyEnrollmentsPage.tsx   # Dashboard enrollments
│       ├── hooks/
│       │   ├── useCourseTypes.ts       # Fetch course types
│       │   ├── useClasses.ts           # Fetch classes
│       │   └── useEnrollment.ts        # Enrollment logic
│       └── types/
│           └── index.ts                # TypeScript types
```

### 4.2 Component Specifications

#### CourseTypeCard
```tsx
interface CourseTypeCardProps {
  slug: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  onClick?: () => void;
}
```

#### ClassCard
```tsx
interface ClassCardProps {
  id: string;
  name: string;
  description: string;
  duration: string;
  features: string[];
  feePlan: FeePlan;
  isEnrolled: boolean;
  enrollmentStatus?: string;
  onEnroll: () => void;
}
```

#### FeeBreakdown
```tsx
interface FeeBreakdownProps {
  registrationFee: number;
  tuitionFee: number;
  materialFee: number;
  discountAmount: number;
  discountLabel?: string;
  totalAmount: number;
}
```

### 4.3 State Management

```tsx
// Using React Query for server state
const { data: courseTypes, isLoading } = useQuery({
  queryKey: ['courseTypes'],
  queryFn: fetchCourseTypes
});

// Local state for UI
const [selectedClass, setSelectedClass] = useState<string | null>(null);
const [paymentInProgress, setPaymentInProgress] = useState(false);
```

---

## 5. Implementation Roadmap

### Phase 1: Database & Course Types (Day 1)

1. Create database migration with all tables
2. Seed course types and initial classes
3. Create backend CourseService
4. Create GET /api/v2/courses endpoint
5. Create frontend CoursesPage with 4 cards
6. Add Coming Soon badges for inactive types

### Phase 2: Classes Page (Day 1-2)

1. Create GET /api/v2/courses/:type/classes endpoint
2. Create frontend CoachingOfflinePage
3. Create ClassCard component
4. Create FeeBreakdown component
5. Add class listing with fee details
6. Add navigation from Courses page

### Phase 3: Payment Integration (Day 2-3)

1. Create EnrollmentService
2. Create PaymentService with Razorpay
3. Create POST /api/v2/enrollments/initiate endpoint
4. Create POST /api/v2/enrollments/verify endpoint
5. Create frontend EnrollButton with Razorpay SDK
6. Handle payment success/failure states
7. Implement signature verification (CRITICAL)

### Phase 4: Enrollment Management (Day 3)

1. Create GET /api/v2/enrollments/my endpoint
2. Create MyEnrollmentsPage for dashboard
3. Show enrollment status on class cards
4. Add "Enrolled" badge for enrolled classes
5. Handle enrollment expiry logic

### Phase 5: Testing & Polish (Day 4)

1. Test complete payment flow (test mode)
2. Handle edge cases (double payments, network failures)
3. Add loading states everywhere
4. Add error handling with user-friendly messages
5. Mobile responsiveness
6. Final UI polish

---

## 6. Security Checklist

- [ ] Razorpay signature verification on backend (MANDATORY)
- [ ] Never trust frontend amount - always fetch from database
- [ ] Check user is authenticated before enrollment
- [ ] Check user is a student before enrollment
- [ ] Prevent duplicate enrollments
- [ ] Use database transactions for payment+enrollment
- [ ] Log all payment attempts for audit
- [ ] Rate limit enrollment initiation
- [ ] Validate class exists and is active
- [ ] Validate fee plan exists and matches class

---

## 7. Environment Variables

```env
# Razorpay (already exists)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Frontend needs
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## 8. Error Handling

| Scenario | HTTP Code | Message |
|----------|-----------|---------|
| Class not found | 404 | "Class not found" |
| Class not active | 400 | "This class is not available for enrollment" |
| Already enrolled | 400 | "You are already enrolled in this class" |
| Payment verification failed | 400 | "Payment verification failed" |
| Razorpay error | 500 | "Payment gateway error. Please try again." |
| Not a student | 403 | "Only students can enroll in classes" |

---

## Ready for Implementation?

This design is production-ready and handles:
- Real money transactions safely
- Edge cases and error scenarios
- Scalability for future course types
- Clean separation of concerns
- Type safety throughout

**Next: Shall I proceed with implementation starting from Phase 1?**
