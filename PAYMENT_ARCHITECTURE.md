# 💰 BeEducated Payment Gateway Architecture & Implementation Guide

> **Complete guide from Database Design → Payment Integration → Interview Prep**

---

## 📋 Table of Contents
1. [Current Architecture Overview](#1-current-architecture-overview)
2. [Payment Flow & User Journey](#2-payment-flow--user-journey)
3. [Scalability Analysis](#3-scalability-analysis)
4. [Database Schema & Relationships](#4-database-schema--relationships)
5. [Payment Gateway Integration](#5-payment-gateway-integration)
6. [Code Implementation](#6-code-implementation)
7. [Payment Integration Tutorial](#7-payment-integration-tutorial)
8. [Interview Questions & Answers](#8-interview-questions--answers)

---

## 1. Current Architecture Overview

### 🏗️ **Three-Tier Payment System**

```
┌─────────────────────────────────────────────────────────────┐
│                    ENROLLMENT LAYER                         │
│  (New System - Class-based enrollment with fee plans)      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT LAYER                            │
│  (Razorpay Integration - Order → Payment → Verification)   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    ACCESS LAYER                             │
│  (Content Access, Batch Assignment, Student Status)        │
└─────────────────────────────────────────────────────────────┘
```

### **Key Tables & Their Roles**

| Table | Purpose | Scalability |
|-------|---------|-------------|
| `course_types` | Batch types (offline, online, test_series, home_tuition) | ✅ Add new types easily |
| `academic_classes` | Classes under each course type (6th-12th, JEE, NEET) | ✅ Unlimited classes per type |
| `class_fee_plans` | Multiple fee plans per class (Standard, Premium, etc.) | ✅ Flexible pricing |
| `class_enrollments` | Student enrollment records with payment link | ✅ One record per enrollment |
| `enrollment_payments` | Razorpay payment tracking | ✅ Handles all payment states |
| `batches` | Physical/virtual batches for scheduling | ✅ Independent of course types |
| `batch_students` | Student-batch assignment after enrollment | ✅ Many-to-many |

---

## 2. Payment Flow & User Journey

### 🎯 **Complete User Journey**

```
User Sign Up (Clerk) → Browse Course Types → Select Course Type (e.g., Offline)
                                                        ↓
                              Browse Classes (6th to 12th) → Select Class (e.g., Class 10)
                                                        ↓
                              View Fee Plans (Standard/Premium) → Select Plan
                                                        ↓
                              Initiate Payment (Create Razorpay Order)
                                                        ↓
                              ┌─────────────────────────────┐
                              │  RAZORPAY CHECKOUT MODAL    │
                              │  • Card / UPI / Netbanking  │
                              │  • Real-time validation     │
                              └─────────────────────────────┘
                                                        ↓
                              Payment Success → Verify Signature
                                                        ↓
                              Update Enrollment Status (pending → active)
                                                        ↓
                              Create Student Record (if not exists)
                                                        ↓
                              Assign to Batch (based on class + schedule)
                                                        ↓
                              Grant Content Access
                                                        ↓
                              Send Confirmation Email/SMS
                                                        ↓
                              ✅ Student Dashboard (Full Access)
```

### **Database State Changes**

```sql
-- STEP 1: Enrollment Initiated (Payment pending)
INSERT INTO class_enrollments (
  student_id, class_id, fee_plan_id, status
) VALUES (
  'student-uuid', 'class-10-uuid', 'standard-plan-uuid', 'pending'
);

-- STEP 2: Payment Created (Razorpay order)
INSERT INTO enrollment_payments (
  enrollment_id, razorpay_order_id, amount, status
) VALUES (
  'enrollment-uuid', 'order_xyz123', 5000.00, 'pending'
);

-- STEP 3: Payment Success (After Razorpay callback)
UPDATE enrollment_payments
SET status = 'completed',
    razorpay_payment_id = 'pay_abc456',
    razorpay_signature = 'signature_hash',
    payment_method = 'upi'
WHERE razorpay_order_id = 'order_xyz123';

-- STEP 4: Activate Enrollment
UPDATE class_enrollments
SET status = 'active',
    enrolled_at = NOW(),
    expires_at = NOW() + INTERVAL '12 months'
WHERE id = 'enrollment-uuid';

-- STEP 5: Assign to Batch (if batch-based course type)
INSERT INTO batch_students (batch_id, student_id)
VALUES ('batch-class10-2024-uuid', 'student-uuid');
```

---

## 3. Scalability Analysis

### ✅ **Question 1: Can offline batches scale from 6th-12th to more classes?**

**Answer: YES, 100% Scalable**

**Reason:**
- `academic_classes` table is NOT hardcoded
- Each class is a separate row linked to `course_types` via `course_type_id`
- Adding Class 13th, JEE Crash Course, or Dropper Batch is just **1 INSERT**

**Example: Adding JEE Foundation Class**
```sql
INSERT INTO academic_classes (
  course_type_id,  -- coaching_offline UUID
  name,
  slug,
  description,
  target_exam,
  duration
) VALUES (
  (SELECT id FROM course_types WHERE slug = 'coaching_offline'),
  'JEE Foundation (11th & 12th)',
  'jee-foundation',
  'Comprehensive 2-year program for JEE Main & Advanced',
  'JEE Main, JEE Advanced',
  '2 Years'
);

-- Then add fee plans for this class
INSERT INTO class_fee_plans (
  class_id,
  name,
  tuition_fee,
  total_amount
) VALUES (
  (SELECT id FROM academic_classes WHERE slug = 'jee-foundation'),
  'Standard Plan',
  50000.00,
  50000.00
);
```

**Result:** No code changes needed. Payment flow automatically works.

---

### ✅ **Question 2: Can other batch types (online, test_series, home_tuition) add classes?**

**Answer: YES, Same Architecture**

**Current State:**
```sql
-- Only coaching_offline has classes (6th-12th)
SELECT ct.slug, COUNT(ac.id) as class_count
FROM course_types ct
LEFT JOIN academic_classes ac ON ac.course_type_id = ct.id
GROUP BY ct.slug;

-- Result:
-- coaching_offline: 7 classes (6th-12th)
-- coaching_online: 0 classes
-- test_series: 0 classes
-- home_tuition: 0 classes
```

**Scaling Process:**
```sql
-- 1. Activate the course type
UPDATE course_types SET is_active = true WHERE slug = 'coaching_online';

-- 2. Add classes for online coaching
INSERT INTO academic_classes (course_type_id, name, slug, duration)
SELECT
  id,
  'Class ' || grade || ' (Online)',
  'online-class-' || grade,
  '1 Year'
FROM course_types,
     generate_series(6, 12) as grade
WHERE slug = 'coaching_online';

-- 3. Add fee plans (cheaper for online)
INSERT INTO class_fee_plans (class_id, name, tuition_fee, total_amount)
SELECT
  id,
  'Standard Plan',
  15000.00,  -- Lower price for online
  15000.00
FROM academic_classes
WHERE slug LIKE 'online-class-%';
```

**Result:**
- ✅ User sees "Coaching (Online)" card
- ✅ Selects "Class 10 (Online)"
- ✅ Pays ₹15,000
- ✅ Gets enrolled
- ✅ **SAME payment flow, ZERO code changes**

---

### ✅ **Question 3: Test Series Special Requirements**

**Current Challenge:** Test series needs:
1. Multiple exams per purchase
2. PDF/material access after exam completion
3. Performance tracking
4. Validity period (not perpetual access)

**Solution Architecture:**

```
Test Series Class → Multiple Exams (via exam targeting)
                                         ↓
                     Student enrolls → Gets test_series_access record
                                         ↓
                     Take Exam → Generate PDF result
                                         ↓
                     Access Materials → Time-bound (expires_at)
```

**Database Design:**

```sql
-- Step 1: Create test series class
INSERT INTO academic_classes (
  course_type_id,
  name,
  slug,
  description,
  duration
) VALUES (
  (SELECT id FROM course_types WHERE slug = 'test_series'),
  'JEE Mains Mock Test Series (20 Tests)',
  'jee-mains-test-series-2024',
  'Full-length mock tests with detailed analysis',
  '6 Months'
);

-- Step 2: Create exams targeting this class
INSERT INTO exams (
  title,
  exam_type,
  total_marks,
  passing_marks,
  target_class_id  -- ⚡ Links exam to test series class
) VALUES (
  'JEE Mains Mock Test 1',
  'mock',
  300,
  90,
  (SELECT id FROM academic_classes WHERE slug = 'jee-mains-test-series-2024')
);
-- Repeat for 20 exams

-- Step 3: Student enrolls in test series
INSERT INTO class_enrollments (student_id, class_id, status)
VALUES ('student-uuid', 'test-series-class-uuid', 'active');

-- Step 4: Student can now access all 20 exams
-- Backend checks: Is student enrolled in test series? → Show exams

-- Step 5: After taking exam, generate PDF
-- This is handled by exam results system (already exists)
```

**Access Control Logic:**
```typescript
// Backend: Check if student can access test series exam
async function canStudentAccessExam(studentId: string, examId: string): Promise<boolean> {
  // 1. Get exam's target class
  const exam = await db.query(`
    SELECT target_class_id FROM exams WHERE id = $1
  `, [examId]);

  // 2. Check if student is enrolled in that class
  const enrollment = await db.query(`
    SELECT * FROM class_enrollments
    WHERE student_id = $1
    AND class_id = $2
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  `, [studentId, exam.target_class_id]);

  return enrollment.rowCount > 0;
}
```

**PDF Generation (Already Implemented):**
```typescript
// After exam submission, generate PDF
async function generateExamResultPDF(attemptId: string): Promise<string> {
  const result = await examAttemptService.getDetailedResult(attemptId);

  // Use existing PDF library (e.g., pdfkit, puppeteer)
  const pdfBuffer = await generatePDF({
    studentName: result.student.name,
    examTitle: result.exam.title,
    score: result.attempt.marks_obtained,
    totalMarks: result.exam.total_marks,
    percentage: result.attempt.percentage,
    responses: result.responses  // Question-wise breakdown
  });

  // Upload to cloud storage
  const pdfUrl = await uploadToS3(pdfBuffer, `results/${attemptId}.pdf`);

  return pdfUrl;
}
```

---

## 4. Database Schema & Relationships

### **Complete ER Diagram**

```
┌──────────────────┐
│  course_types    │ (4 rows: offline, online, test_series, home_tuition)
│  - slug          │
│  - name          │
│  - is_active     │
└────────┬─────────┘
         │ 1:N
         ↓
┌──────────────────┐
│ academic_classes │ (Unlimited classes per type)
│  - name          │
│  - slug          │
│  - target_exam   │
│  - max_students  │
└────────┬─────────┘
         │ 1:N
         ↓
┌──────────────────┐
│ class_fee_plans  │ (Multiple pricing tiers per class)
│  - name          │
│  - tuition_fee   │
│  - discount      │
│  - total_amount  │
└────────┬─────────┘
         │
         │ Referenced by
         ↓
┌──────────────────┐      ┌─────────────────────┐
│ class_enrollments│ 1:N  │ enrollment_payments │
│  - student_id    │─────→│  - razorpay_order   │
│  - class_id      │      │  - razorpay_payment │
│  - fee_plan_id   │      │  - status           │
│  - status        │      │  - amount           │
│  - enrolled_at   │      └─────────────────────┘
│  - expires_at    │
└────────┬─────────┘
         │
         │ After successful payment
         ↓
┌──────────────────┐      ┌──────────────────┐
│ batch_students   │ N:M  │     batches      │
│  - student_id    │──────│  - batch_code    │
│  - batch_id      │      │  - batch_type    │
│  - enrolled_at   │      │  - schedule      │
└──────────────────┘      └──────────────────┘
```

### **Key Constraints**

1. **Enrollment must have valid fee plan:**
   ```sql
   FOREIGN KEY (fee_plan_id) REFERENCES class_fee_plans(id)
   ```

2. **Payment must link to enrollment:**
   ```sql
   FOREIGN KEY (enrollment_id) REFERENCES class_enrollments(id)
   ```

3. **Student can enroll in same class only once:**
   ```sql
   UNIQUE (student_id, class_id) -- Prevents duplicate enrollments
   ```

4. **Payment status must be completed before enrollment activation:**
   ```sql
   -- Business logic in code (not DB constraint)
   IF payment.status = 'completed' THEN
     UPDATE enrollments SET status = 'active'
   ```

---

## 5. Payment Gateway Integration

### **Razorpay Integration Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│                                                         │
│  1. User clicks "Pay Now"                              │
│  2. Call backend: POST /api/v2/enrollment/initiate     │
│  3. Receive: razorpay_order_id, amount, key            │
│  4. Open Razorpay Checkout Modal                       │
│  5. User completes payment                             │
│  6. Razorpay sends: payment_id, order_id, signature    │
│  7. Call backend: POST /api/v2/enrollment/verify       │
│  8. Redirect to success page                           │
└─────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                    │
│                                                         │
│  /initiate:                                            │
│    1. Create enrollment record (status: pending)       │
│    2. Create Razorpay order                            │
│    3. Store order_id in enrollment_payments            │
│    4. Return order details to frontend                 │
│                                                         │
│  /verify:                                              │
│    1. Verify Razorpay signature (CRITICAL!)            │
│    2. Update payment status → completed                │
│    3. Activate enrollment → status: active             │
│    4. Assign student to batch                          │
│    5. Send confirmation email                          │
└─────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────┐
│                    RAZORPAY API                         │
│                                                         │
│  • Create Order API                                    │
│  • Checkout.js (Modal)                                 │
│  • Payment Verification                                │
│  • Webhook (Optional, for async updates)              │
└─────────────────────────────────────────────────────────┘
```

### **Security Measures**

1. **Signature Verification (MANDATORY):**
   ```javascript
   const crypto = require('crypto');

   function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
     const message = `${orderId}|${paymentId}`;
     const generatedSignature = crypto
       .createHmac('sha256', secret)
       .update(message)
       .digest('hex');

     return generatedSignature === signature;
   }
   ```

2. **Amount Validation:**
   ```typescript
   // ALWAYS verify amount on backend
   const enrollmentAmount = await getEnrollmentAmount(enrollmentId);
   if (razorpayOrder.amount !== enrollmentAmount * 100) { // Paise
     throw new Error('Amount mismatch - possible tampering');
   }
   ```

3. **Idempotency:**
   ```sql
   -- Prevent double enrollment
   INSERT INTO class_enrollments (student_id, class_id, status)
   VALUES ($1, $2, 'pending')
   ON CONFLICT (student_id, class_id)
   DO UPDATE SET updated_at = NOW()
   RETURNING id;
   ```

---

## 6. Code Implementation

### **Backend API Endpoints**

**File: `server/src/modules/enrollment/enrollment.routes.ts`**

```typescript
import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * POST /api/v2/enrollment/initiate
 * Step 1: Create enrollment and Razorpay order
 */
router.post('/initiate', requireAuth, attachUser, async (req, res) => {
  try {
    const { classId, feePlanId } = req.body;
    const userId = req.user!.id;

    // 1. Get or create student
    let student = await studentService.getByUserId(userId);
    if (!student) {
      student = await studentService.create({ userId, /* other fields */ });
    }

    // 2. Validate class and fee plan
    const feePlan = await db.query(`
      SELECT cfp.*, ac.name as class_name
      FROM class_fee_plans cfp
      JOIN academic_classes ac ON ac.id = cfp.class_id
      WHERE cfp.id = $1 AND cfp.class_id = $2 AND cfp.is_active = true
    `, [feePlanId, classId]);

    if (feePlan.rows.length === 0) {
      return sendBadRequest(res, 'Invalid fee plan');
    }

    const plan = feePlan.rows[0];
    const amountInPaise = Math.round(plan.total_amount * 100);

    // 3. Check for existing pending enrollment
    const existingEnrollment = await db.query(`
      SELECT id FROM class_enrollments
      WHERE student_id = $1 AND class_id = $2 AND status = 'pending'
      LIMIT 1
    `, [student.id, classId]);

    let enrollmentId: string;

    if (existingEnrollment.rows.length > 0) {
      enrollmentId = existingEnrollment.rows[0].id;
    } else {
      // 4. Create new enrollment
      const enrollment = await db.query(`
        INSERT INTO class_enrollments (
          student_id, class_id, fee_plan_id, status
        ) VALUES ($1, $2, $3, 'pending')
        RETURNING id
      `, [student.id, classId, feePlanId]);

      enrollmentId = enrollment.rows[0].id;
    }

    // 5. Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `enrollment_${enrollmentId}`,
      notes: {
        enrollmentId,
        studentId: student.id,
        className: plan.class_name,
      },
    });

    // 6. Store payment record
    await db.query(`
      INSERT INTO enrollment_payments (
        enrollment_id,
        razorpay_order_id,
        amount,
        amount_paise,
        status
      ) VALUES ($1, $2, $3, $4, 'pending')
    `, [enrollmentId, razorpayOrder.id, plan.total_amount, amountInPaise]);

    // 7. Return order details to frontend
    sendSuccess(res, {
      orderId: razorpayOrder.id,
      amount: plan.total_amount,
      currency: 'INR',
      enrollmentId,
      className: plan.class_name,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error('Enrollment initiation failed:', error);
    sendError(res, 'Failed to initiate enrollment');
  }
});

/**
 * POST /api/v2/enrollment/verify
 * Step 2: Verify payment and activate enrollment
 */
router.post('/verify', requireAuth, attachUser, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      enrollmentId,
    } = req.body;

    // 1. CRITICAL: Verify signature
    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(message)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return sendBadRequest(res, 'Invalid payment signature');
    }

    // 2. Get payment details from Razorpay
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    // 3. Verify payment status
    if (razorpayPayment.status !== 'captured') {
      return sendBadRequest(res, 'Payment not captured');
    }

    // 4. Update payment record
    await db.query(`
      UPDATE enrollment_payments
      SET
        status = 'completed',
        razorpay_payment_id = $1,
        razorpay_signature = $2,
        payment_method = $3,
        card_last4 = $4,
        card_network = $5,
        bank = $6,
        wallet = $7,
        vpa = $8
      WHERE razorpay_order_id = $9
    `, [
      razorpay_payment_id,
      razorpay_signature,
      razorpayPayment.method,
      razorpayPayment.card?.last4,
      razorpayPayment.card?.network,
      razorpayPayment.bank,
      razorpayPayment.wallet,
      razorpayPayment.vpa,
      razorpay_order_id,
    ]);

    // 5. Get enrollment details
    const enrollment = await db.query(`
      SELECT
        ce.*,
        ac.name as class_name,
        ct.slug as course_type_slug,
        cfp.validity_months
      FROM class_enrollments ce
      JOIN academic_classes ac ON ac.id = ce.class_id
      JOIN course_types ct ON ct.id = ac.course_type_id
      JOIN class_fee_plans cfp ON cfp.id = ce.fee_plan_id
      WHERE ce.id = $1
    `, [enrollmentId]);

    const enroll = enrollment.rows[0];

    // 6. Activate enrollment
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + enroll.validity_months);

    await db.query(`
      UPDATE class_enrollments
      SET
        status = 'active',
        enrolled_at = NOW(),
        expires_at = $1,
        amount_paid = $2
      WHERE id = $3
    `, [expiresAt, razorpayPayment.amount / 100, enrollmentId]);

    // 7. Assign to batch (if batch-based course type)
    if (['coaching_offline', 'coaching_online'].includes(enroll.course_type_slug)) {
      // Find appropriate batch
      const batch = await db.query(`
        SELECT id FROM batches
        WHERE batch_type = $1
        AND is_active = true
        AND current_students < max_students
        ORDER BY start_date DESC
        LIMIT 1
      `, [enroll.course_type_slug === 'coaching_offline' ? 'coaching_offline' : 'coaching_online']);

      if (batch.rows.length > 0) {
        await db.query(`
          INSERT INTO batch_students (batch_id, student_id)
          VALUES ($1, $2)
          ON CONFLICT (batch_id, student_id) DO NOTHING
        `, [batch.rows[0].id, enroll.student_id]);

        // Update batch student count
        await db.query(`
          UPDATE batches
          SET current_students = current_students + 1
          WHERE id = $1
        `, [batch.rows[0].id]);
      }
    }

    // 8. Send confirmation email (async)
    sendEnrollmentConfirmationEmail(enroll.student_id, enrollmentId);

    sendSuccess(res, {
      message: 'Enrollment successful',
      enrollmentId,
      className: enroll.class_name,
      expiresAt,
    });

  } catch (error) {
    console.error('Payment verification failed:', error);
    sendError(res, 'Failed to verify payment');
  }
});

export default router;
```

---

### **Frontend Implementation**

**File: `client/src/modules/enrollment/components/PaymentPage.tsx`**

```typescript
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const classId = searchParams.get('classId');
  const feePlanId = searchParams.get('feePlanId');

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Step 1: Initiate enrollment
      const response = await fetch('/api/v2/enrollment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({ classId, feePlanId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      const { orderId, amount, currency, enrollmentId, razorpayKeyId } = data.data;

      // Step 2: Open Razorpay modal
      const options = {
        key: razorpayKeyId,
        amount: amount * 100, // Paise
        currency,
        order_id: orderId,
        name: 'BeEducated',
        description: `Enrollment Fee`,
        image: '/logo.png',
        handler: async (response: any) => {
          // Step 3: Verify payment
          try {
            const verifyResponse = await fetch('/api/v2/enrollment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await getToken()}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                enrollmentId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              navigate(`/enrollment/success?id=${enrollmentId}`);
            } else {
              throw new Error(verifyData.message);
            }
          } catch (error) {
            console.error('Verification failed:', error);
            navigate(`/enrollment/failed?id=${enrollmentId}`);
          }
        },
        prefill: {
          name: user.firstName + ' ' + user.lastName,
          email: user.email,
        },
        theme: {
          color: '#F59E0B', // Amber-500
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation failed:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handlePayment} isLoading={loading}>
        Pay Now
      </Button>
    </div>
  );
}
```

---

## 7. Payment Integration Tutorial (Senior Developer Level)

### **Lesson 1: Understanding Payment Gateways**

**What is a Payment Gateway?**
A payment gateway is a merchant service that processes credit card, UPI, and other electronic payments for online businesses. Think of it as a secure middleman between:
- **Your Application** ↔ **Gateway** ↔ **Bank/Payment Network**

**Key Players:**
1. **Customer**: Initiates payment
2. **Merchant (You)**: Receives payment
3. **Payment Gateway (Razorpay)**: Facilitates & secures transaction
4. **Acquiring Bank**: Merchant's bank
5. **Issuing Bank**: Customer's bank
6. **Payment Network**: Visa, Mastercard, UPI

---

### **Lesson 2: Razorpay Flow (Deep Dive)**

```
┌──────────────────────────────────────────────────────────────┐
│  PHASE 1: ORDER CREATION (Backend)                          │
│                                                              │
│  Backend calls Razorpay API:                                │
│    POST https://api.razorpay.com/v1/orders                  │
│    Authorization: Basic base64(key_id:key_secret)           │
│    Body: { amount: 50000, currency: "INR" }                │
│                                                              │
│  Razorpay Response:                                         │
│    {                                                         │
│      id: "order_xyz123",                                    │
│      amount: 50000,                                         │
│      status: "created"                                      │
│    }                                                         │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  PHASE 2: CHECKOUT (Frontend)                               │
│                                                              │
│  Frontend receives order_id from backend                    │
│  Loads Razorpay Checkout.js:                                │
│    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
│                                                              │
│  Opens modal with:                                          │
│    var options = {                                          │
│      key: "rzp_test_xxx",                                   │
│      order_id: "order_xyz123",                              │
│      handler: function(response) {                          │
│        // Payment success callback                          │
│      }                                                       │
│    };                                                        │
│    var rzp = new Razorpay(options);                         │
│    rzp.open();                                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  PHASE 3: PAYMENT (Customer Action)                         │
│                                                              │
│  Customer enters:                                           │
│    - Card details / UPI ID / Netbanking                     │
│  Razorpay:                                                  │
│    - Validates card/UPI                                     │
│    - Contacts issuing bank                                  │
│    - Gets OTP/PIN from customer                             │
│    - Debits amount from customer                            │
│    - Credits to merchant (after settlement)                 │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  PHASE 4: VERIFICATION (Backend) - CRITICAL!                │
│                                                              │
│  Frontend receives from Razorpay:                           │
│    {                                                         │
│      razorpay_order_id: "order_xyz123",                     │
│      razorpay_payment_id: "pay_abc456",                     │
│      razorpay_signature: "hash123..."                       │
│    }                                                         │
│                                                              │
│  Backend MUST verify signature:                             │
│    message = order_id + "|" + payment_id                    │
│    expected_signature = hmac_sha256(message, key_secret)    │
│    if (expected_signature === razorpay_signature) {         │
│      // ✅ Payment authentic, activate enrollment           │
│    } else {                                                  │
│      // ❌ Possible fraud, reject                           │
│    }                                                         │
└──────────────────────────────────────────────────────────────┘
```

---

### **Lesson 3: Security Best Practices**

#### **1. NEVER Trust Frontend**

❌ **Wrong (Insecure):**
```typescript
// Frontend
fetch('/api/enroll', {
  body: JSON.stringify({
    amount: 5000,  // ⚠️ User can modify this!
    isPaid: true   // ⚠️ User can fake this!
  })
});

// Backend
app.post('/api/enroll', (req, res) => {
  if (req.body.isPaid) {  // ❌ Trusting client
    activateEnrollment();
  }
});
```

✅ **Correct (Secure):**
```typescript
// Frontend
fetch('/api/enrollment/verify', {
  body: JSON.stringify({
    razorpay_payment_id,
    razorpay_signature  // Verifiable proof
  })
});

// Backend
app.post('/api/enrollment/verify', async (req, res) => {
  // 1. Verify signature (crypto proof)
  const isValid = verifySignature(req.body);

  // 2. Fetch payment from Razorpay directly (not from client)
  const payment = await razorpay.payments.fetch(razorpay_payment_id);

  // 3. Check amount matches database
  const dbAmount = await getEnrollmentAmount(enrollmentId);
  if (payment.amount !== dbAmount * 100) {
    throw new Error('Amount mismatch');
  }

  // 4. Only then activate
  activateEnrollment();
});
```

---

#### **2. Idempotency (Prevent Duplicate Payments)**

**Problem:** User clicks "Pay" twice → Charged twice

**Solution:** Use Razorpay's `receipt` field + database constraints

```typescript
// Backend
const receipt = `enrollment_${enrollmentId}_${Date.now()}`;

const order = await razorpay.orders.create({
  amount: 50000,
  currency: 'INR',
  receipt: receipt  // Unique identifier
});

// Database: Ensure one active enrollment per student-class
CREATE UNIQUE INDEX idx_one_active_enrollment
ON class_enrollments (student_id, class_id)
WHERE status = 'active';
```

---

#### **3. Webhook vs Polling**

**Polling (Current Implementation):**
```
Frontend → Backend (/verify) → Razorpay API (fetch payment)
```
✅ Simple, synchronous
❌ Misses delayed success (rare)

**Webhook (Production Recommendation):**
```
Razorpay → POST /api/webhook → Backend updates DB
```
✅ Catches all events (success, failure, refund)
✅ Async, no frontend dependency

**Webhook Implementation:**
```typescript
// Backend
router.post('/webhook', async (req, res) => {
  // 1. Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (req.headers['x-razorpay-signature'] !== expectedSignature) {
    return res.status(400).send('Invalid signature');
  }

  // 2. Handle event
  const event = req.body.event;  // e.g., "payment.captured"
  const payment = req.body.payload.payment.entity;

  if (event === 'payment.captured') {
    await handlePaymentSuccess(payment);
  } else if (event === 'payment.failed') {
    await handlePaymentFailure(payment);
  }

  res.json({ status: 'ok' });
});
```

---

### **Lesson 4: Error Handling**

**Payment can fail at multiple stages:**

1. **Order Creation Fails:**
   ```typescript
   try {
     const order = await razorpay.orders.create({...});
   } catch (error) {
     if (error.statusCode === 401) {
       // Invalid API keys
       logger.error('Razorpay authentication failed');
     }
     // Notify user: "Payment system temporarily unavailable"
   }
   ```

2. **User Cancels Payment:**
   ```javascript
   // Frontend
   const options = {
     modal: {
       ondismiss: () => {
         // User closed modal
         showMessage('Payment cancelled');
       }
     }
   };
   ```

3. **Payment Fails (Insufficient funds, OTP wrong):**
   ```typescript
   // Backend webhook
   if (event === 'payment.failed') {
     const reason = payment.error_description;
     // Store in DB, notify user
     await sendEmail(user, 'Payment failed', reason);
   }
   ```

4. **Signature Verification Fails:**
   ```typescript
   if (signature !== expectedSignature) {
     // Possible fraud attempt
     logger.critical('Signature mismatch', { payment_id, user_id });
     // DO NOT activate enrollment
     // Alert admin
   }
   ```

---

### **Lesson 5: Testing Strategy**

#### **Test Mode (Razorpay)**

Use test credentials:
```
Key ID: rzp_test_xxxxxx
Key Secret: xxxxxxx

Test Cards:
- Success: 4111 1111 1111 1111, CVV: any, Expiry: future
- Failure: 4000 0000 0000 0002
- Authentication Required: 4000 0025 0000 3155

Test UPI: success@razorpay, failure@razorpay
```

#### **Test Scenarios:**

1. **Happy Path:** User pays, signature valid, enrollment activated
2. **Signature Mismatch:** Tampered response, payment rejected
3. **Amount Mismatch:** User modifies amount, caught in verification
4. **Duplicate Enrollment:** User tries enrolling twice, caught by UNIQUE constraint
5. **Payment Timeout:** User doesn't complete payment, enrollment stays pending
6. **Refund:** Admin initiates refund, webhook updates status

---

## 8. Interview Questions & Answers

### **🎯 L1: Junior Developer (0-2 years)**

**Q1: What is Razorpay and why use it?**

**A:** Razorpay is a payment gateway that allows businesses to accept online payments (cards, UPI, netbanking, wallets) without directly integrating with banks.

**Why use it:**
- PCI-DSS compliant (security handled)
- Multi-payment methods (cards, UPI, wallets)
- Quick integration (SDK + API)
- Webhooks for async updates
- Dashboard for reconciliation

**Alternative:** Stripe (international), PayU, CCAvenue, Instamojo

---

**Q2: Explain the payment flow in 5 steps.**

**A:**
1. **Frontend:** User clicks "Pay", call backend `/initiate`
2. **Backend:** Create Razorpay order, return `order_id` to frontend
3. **Frontend:** Open Razorpay modal with `order_id`, user completes payment
4. **Razorpay:** Returns `payment_id`, `order_id`, `signature` to frontend
5. **Backend:** Verify signature, activate enrollment

---

**Q3: What is signature verification and why is it important?**

**A:** Signature verification ensures that the payment response came from Razorpay and wasn't tampered with by a malicious user.

**How it works:**
```javascript
// Razorpay generates signature using HMAC-SHA256
message = order_id + "|" + payment_id
signature = HMAC_SHA256(message, your_secret_key)

// You regenerate and compare
your_signature = HMAC_SHA256(message, your_secret_key)
if (signature === your_signature) {
  // Authentic payment
}
```

**Why important:** Without verification, a user could fake a payment response and get free access.

---

### **🎯 L2: Mid-Level Developer (2-4 years)**

**Q4: How do you handle race conditions in payment verification?**

**A:** Race conditions can occur when:
- User clicks "Pay" multiple times
- Webhook and frontend verification hit backend simultaneously

**Solutions:**

1. **Database-level locking:**
   ```sql
   SELECT * FROM enrollment_payments
   WHERE razorpay_order_id = $1
   FOR UPDATE;  -- Row-level lock

   UPDATE enrollment_payments
   SET status = 'completed'
   WHERE razorpay_order_id = $1
   AND status = 'pending';  -- Only update if still pending
   ```

2. **Idempotency key:**
   ```typescript
   // Store in Redis
   const key = `payment_verification:${payment_id}`;
   const acquired = await redis.set(key, '1', 'EX', 60, 'NX');

   if (!acquired) {
     return { message: 'Already processing' };
   }

   // Process payment
   await verifyAndActivate(payment_id);

   await redis.del(key);
   ```

3. **UNIQUE constraint:**
   ```sql
   ALTER TABLE enrollment_payments
   ADD CONSTRAINT unique_razorpay_payment
   UNIQUE (razorpay_payment_id);
   ```

---

**Q5: What happens if the backend crashes after payment but before enrollment activation?**

**A:** This is called **payment-enrollment inconsistency**.

**Problem:**
- User paid successfully
- Backend crashes before updating `enrollment.status = 'active'`
- User is charged but not enrolled

**Solutions:**

1. **Database Transaction:**
   ```typescript
   await db.transaction(async (trx) => {
     // Step 1: Update payment
     await trx.query(`
       UPDATE enrollment_payments SET status = 'completed'
     `);

     // Step 2: Activate enrollment
     await trx.query(`
       UPDATE class_enrollments SET status = 'active'
     `);

     // If any step fails, entire transaction rolls back
   });
   ```

2. **Webhook as Backup:**
   - Even if frontend verification fails, webhook will retry
   - Razorpay sends webhook up to 24 hours with exponential backoff

3. **Reconciliation Job:**
   ```typescript
   // Run daily cron job
   async function reconcilePayments() {
     // Find payments that are completed but enrollment is pending
     const orphaned = await db.query(`
       SELECT ep.*, ce.id as enrollment_id
       FROM enrollment_payments ep
       JOIN class_enrollments ce ON ce.id = ep.enrollment_id
       WHERE ep.status = 'completed'
       AND ce.status = 'pending'
       AND ep.created_at < NOW() - INTERVAL '1 hour'
     `);

     // Activate these enrollments
     for (const payment of orphaned.rows) {
       await activateEnrollment(payment.enrollment_id);
     }
   }
   ```

---

**Q6: How do you handle refunds?**

**A:**

**Scenario 1: User requests refund within 7 days**

```typescript
async function processRefund(paymentId: string, amount: number, reason: string) {
  // 1. Initiate refund via Razorpay
  const refund = await razorpay.payments.refund(paymentId, {
    amount: amount * 100,  // Full or partial refund
    speed: 'normal',  // 'normal' or 'optimum' (instant, extra cost)
  });

  // 2. Update payment record
  await db.query(`
    UPDATE enrollment_payments
    SET
      refund_amount = $1,
      refund_status = 'processing',
      refund_id = $2
    WHERE razorpay_payment_id = $3
  `, [amount, refund.id, paymentId]);

  // 3. Deactivate enrollment
  await db.query(`
    UPDATE class_enrollments
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE id = (
      SELECT enrollment_id FROM enrollment_payments
      WHERE razorpay_payment_id = $1
    )
  `, [paymentId]);

  // 4. Listen for webhook: refund.processed
  // Update refund_status = 'completed' when money reaches user
}
```

**Refund Timeline:**
- Normal speed: 5-7 business days
- Instant (optimum): 30 minutes - 2 hours (extra fee)

---

### **🎯 L3: Senior Developer (4+ years)**

**Q7: Design a scalable payment system for 10,000+ concurrent users.**

**A:**

**Challenges:**
1. Database bottleneck (100s of writes/sec)
2. Razorpay API rate limits (100 req/sec)
3. Race conditions (duplicate enrollments)
4. Webhook processing delays

**Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│  LOAD BALANCER (Nginx / AWS ALB)                            │
│  - Distribute requests across 5 backend instances           │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  BACKEND INSTANCES (Node.js x5)                             │
│  - Stateless (no in-memory state)                           │
│  - Each handles 2000 concurrent requests                    │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  MESSAGE QUEUE (Redis / RabbitMQ)                           │
│  - Queue: enrollment_verification                           │
│  - Queue: email_notifications                               │
│  - Decouple payment verification from API response          │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  WORKER PROCESSES (Node.js x10)                             │
│  - Process: verifyPaymentWorker                             │
│  - Process: emailWorker                                     │
│  - Process: webhookWorker                                   │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  DATABASE (PostgreSQL)                                      │
│  - Connection pool: 100 connections                         │
│  - Read replicas for analytics                              │
│  - Partitioning: payments table by month                    │
└──────────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// API Endpoint (Fast response)
router.post('/verify', async (req, res) => {
  const { payment_id, order_id, signature } = req.body;

  // 1. Quick signature verification
  const isValid = verifySignature(order_id, payment_id, signature);
  if (!isValid) {
    return sendBadRequest(res, 'Invalid signature');
  }

  // 2. Enqueue verification job (async)
  await redisQueue.add('enrollment_verification', {
    payment_id,
    order_id,
    timestamp: Date.now(),
  });

  // 3. Immediately respond to user (don't wait for DB)
  sendSuccess(res, {
    message: 'Payment verification in progress',
    status: 'processing',
  });
});

// Worker (Processes queue)
async function verifyPaymentWorker() {
  const queue = new Queue('enrollment_verification', { connection: redis });

  queue.process(async (job) => {
    const { payment_id, order_id } = job.data;

    try {
      // 1. Fetch payment from Razorpay
      const payment = await razorpay.payments.fetch(payment_id);

      // 2. Update database (with retry logic)
      await db.transaction(async (trx) => {
        await trx.query(`UPDATE enrollment_payments ...`);
        await trx.query(`UPDATE class_enrollments ...`);
      });

      // 3. Enqueue email notification
      await emailQueue.add('send_enrollment_email', {
        enrollment_id: job.data.enrollment_id,
      });

    } catch (error) {
      // Retry 3 times with exponential backoff
      if (job.attemptsMade < 3) {
        throw error;  // Will be retried
      }
      // After 3 failures, send alert
      logger.critical('Payment verification failed', { payment_id });
    }
  });
}
```

**Benefits:**
- ✅ API responds in <100ms (doesn't wait for DB)
- ✅ Queue absorbs traffic spikes
- ✅ Automatic retries for failed verifications
- ✅ Horizontal scaling (add more workers)

---

**Q8: How do you handle partial payments and installments?**

**A:**

**Scenario:** User wants to pay ₹50,000 in 3 installments of ₹18,000 each.

**Database Design:**

```sql
-- Main enrollment (total amount)
INSERT INTO class_enrollments (
  student_id, class_id, fee_plan_id,
  total_amount, amount_paid, status
) VALUES (
  'student-uuid', 'class-uuid', 'plan-uuid',
  50000, 0, 'pending'
);

-- Installment 1
INSERT INTO enrollment_payments (
  enrollment_id,
  razorpay_order_id,
  amount,
  installment_number,
  total_installments,
  status
) VALUES (
  'enrollment-uuid',
  'order_installment1',
  18000,
  1,
  3,
  'pending'
);

-- When installment 1 is paid
UPDATE enrollment_payments SET status = 'completed'
WHERE id = 'installment1-uuid';

UPDATE class_enrollments
SET amount_paid = amount_paid + 18000
WHERE id = 'enrollment-uuid';

-- Status logic
IF (amount_paid >= total_amount) THEN
  enrollment.status = 'active'
ELSE
  enrollment.status = 'partially_paid'
```

**Access Control:**

```typescript
async function canStudentAccessContent(studentId: string): Promise<boolean> {
  const enrollment = await db.query(`
    SELECT
      total_amount,
      amount_paid,
      CASE
        WHEN amount_paid >= total_amount THEN 'full_access'
        WHEN amount_paid >= total_amount * 0.5 THEN 'limited_access'
        ELSE 'no_access'
      END as access_level
    FROM class_enrollments
    WHERE student_id = $1 AND status IN ('active', 'partially_paid')
  `, [studentId]);

  return enrollment.rows[0]?.access_level !== 'no_access';
}
```

---

**Q9: How do you audit payments for compliance?**

**A:**

**Requirements:**
- Track every payment state change
- Immutable audit log
- Daily reconciliation with Razorpay

**Implementation:**

```sql
-- Audit log table
CREATE TABLE payment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES enrollment_payments(id),

  -- State change
  old_status payment_status,
  new_status payment_status NOT NULL,

  -- Who triggered
  triggered_by VARCHAR(50), -- 'user', 'webhook', 'admin', 'cron'
  user_id UUID REFERENCES users(id),

  -- Details
  razorpay_event VARCHAR(50), -- 'payment.captured', 'payment.failed'
  razorpay_response JSONB,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamp (immutable)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger on status change
CREATE OR REPLACE FUNCTION log_payment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO payment_audit_log (
      payment_id, old_status, new_status, triggered_by
    ) VALUES (
      NEW.id, OLD.status, NEW.status, current_setting('app.user', true)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_status_change
AFTER UPDATE ON enrollment_payments
FOR EACH ROW EXECUTE FUNCTION log_payment_change();
```

**Daily Reconciliation:**

```typescript
async function reconcileWithRazorpay() {
  // 1. Get all completed payments from our DB
  const ourPayments = await db.query(`
    SELECT razorpay_payment_id, amount
    FROM enrollment_payments
    WHERE status = 'completed'
    AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  `);

  // 2. Fetch same payments from Razorpay
  const razorpayPayments = await razorpay.payments.all({
    from: yesterday,
    to: today,
  });

  // 3. Compare
  const mismatches = [];
  for (const ourPayment of ourPayments.rows) {
    const rzpPayment = razorpayPayments.items.find(
      p => p.id === ourPayment.razorpay_payment_id
    );

    if (!rzpPayment) {
      mismatches.push({ payment_id: ourPayment.razorpay_payment_id, issue: 'not_found_in_razorpay' });
    } else if (rzpPayment.amount !== ourPayment.amount * 100) {
      mismatches.push({ payment_id: ourPayment.razorpay_payment_id, issue: 'amount_mismatch' });
    }
  }

  // 4. Alert if mismatches
  if (mismatches.length > 0) {
    await sendSlackAlert('Payment Reconciliation Failed', mismatches);
  }
}
```

---

**Q10: Explain PCI-DSS compliance and how Razorpay helps.**

**A:**

**PCI-DSS (Payment Card Industry Data Security Standard):**
- Global security standard for handling credit card data
- Required if you store, process, or transmit cardholder data

**12 Requirements (Summary):**
1. Install firewalls
2. Don't use default passwords
3. Protect stored cardholder data (encrypt)
4. Encrypt data in transit (HTTPS/TLS)
5. Use antivirus
6. Develop secure systems
7. Restrict access to cardholder data (need-to-know)
8. Assign unique IDs to users
9. Restrict physical access to servers
10. Track all access to cardholder data
11. Test security systems regularly
12. Maintain security policy

**How Razorpay Helps:**

✅ **You DON'T handle card data:**
- Card details never touch your server
- Entered directly in Razorpay's iframe (checkout modal)
- Razorpay stores encrypted card data

✅ **You DON'T need Level 1 PCI certification:**
- Without Razorpay: ₹50 lakhs+ compliance cost
- With Razorpay: ₹0 (they handle it)

❌ **What you STILL must do:**
- HTTPS on your site (TLS 1.2+)
- Secure your database (encrypt sensitive data)
- Access controls (who can see payment data)
- Regular security audits

**Interview Tip:** Mention that even with Razorpay, you should:
- Never log full card numbers
- Mask payment IDs in frontend (show last 4 digits only)
- Implement role-based access (only finance team sees payments)

---

## 🎯 Summary: Your Architecture is Scalable ✅

### **Scalability Checklist**

| Feature | Scalable? | Reason |
|---------|-----------|--------|
| Add new classes (6th → 13th+) | ✅ YES | `academic_classes` table, just INSERT |
| Add new course types | ✅ YES | `course_types` table, just INSERT + activate |
| Test series with exams | ✅ YES | Link exams to class via `target_class_id` |
| Multiple fee plans per class | ✅ YES | `class_fee_plans` one-to-many |
| Handle 10,000 concurrent payments | ✅ YES | Add load balancer + message queue |
| Installments | ✅ YES | `installment_number` in payments table |
| Refunds | ✅ YES | Razorpay API + `refund_amount` tracking |

### **What Makes It Scalable**

1. **Normalized Database:** No hardcoded classes/types
2. **Generic Payment Flow:** Works for all course types
3. **Decoupled Architecture:** Payment verification via queue
4. **Razorpay Handles Load:** They scale payment processing
5. **Immutable Audit Log:** Never lose payment history

### **Future Enhancements**

1. **Subscription Model:** For test series (recurring payments)
   ```sql
   ALTER TABLE class_fee_plans
   ADD COLUMN subscription_type VARCHAR(20); -- 'one_time', 'monthly', 'yearly'
   ```

2. **Dynamic Pricing:** Based on demand
   ```sql
   ALTER TABLE class_fee_plans
   ADD COLUMN dynamic_pricing JSONB; -- { "peak_season": 1.2, "off_season": 0.8 }
   ```

3. **Coupon Codes:** For discounts
   ```sql
   CREATE TABLE coupon_codes (
     code VARCHAR(20) PRIMARY KEY,
     discount_type VARCHAR(10), -- 'percentage', 'fixed'
     discount_value DECIMAL(10,2),
     valid_until TIMESTAMPTZ
   );
   ```

---

## 📚 Additional Resources

**Documentation:**
- [Razorpay API Docs](https://razorpay.com/docs/api)
- [Payment Gateway Best Practices](https://stripe.com/docs/security)
- [PCI-DSS Compliance Guide](https://www.pcisecuritystandards.org)

**Books:**
- *Building Microservices* by Sam Newman (Chapter on Transactions)
- *Designing Data-Intensive Applications* by Martin Kleppmann (Chapter on Consistency)

**Practice:**
- Implement webhook handling
- Write unit tests for signature verification
- Load test with 1000 concurrent payments (use tools like k6, Artillery)

---

**🎉 You're now ready to handle production payments!**
