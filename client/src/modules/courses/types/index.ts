// Course Types and Enrollment Types

export interface CourseType {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  imageUrl: string | null;
  isActive: boolean;
  comingSoonMessage: string | null;
  features: string[] | null;
  displayOrder: number;
}

export interface FeePlan {
  id: string;
  name: string;
  registrationFee: number;
  tuitionFee: number;
  materialFee: number;
  examFee: number;
  discountAmount: number;
  discountLabel: string | null;
  totalAmount: number;
  validityMonths: number;
}

export interface AcademicClass {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  duration: string | null;
  imageUrl: string | null;
  features: string[] | null;
  syllabus: string[] | null;
  targetBoard: string | null;
  targetExam: string | null;
  maxStudents: number | null;
  currentStudents: number;
  enrollmentOpen: boolean;
  isEnrolled: boolean;
  enrollmentStatus: string | null;
  feePlan: FeePlan | null;
}

export interface ClassesResponse {
  courseType: {
    id: string;
    slug: string;
    name: string;
    isActive: boolean;
  };
  classes: AcademicClass[];
}

export interface EnrollmentInitiateResponse {
  enrollmentId: string;
  orderId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  keyId: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  notes: Record<string, string>;
}

export type PaymentType = 'razorpay' | 'cash' | 'bank_transfer' | 'cheque' | 'upi_direct';

export interface Enrollment {
  id: string;
  enrollmentNumber: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'refunded';
  enrolledAt: string | null;
  expiresAt: string | null;
  className: string;
  courseTypeName: string;
  feePlanName: string;
  totalAmount: number;
  amountPaid: number | null;
  payment: {
    id: string;
    paymentType: PaymentType;
    razorpayPaymentId: string | null;
    receiptNumber: string | null;
    amount: number;
    status: string;
    paidAt: string | null;
    paymentMethod: string | null;
  } | null;
}
