// BeEducated Shared Types
// Shared between frontend and backend
// Created in Phase 0

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export type UserRole = 'admin' | 'student' | 'parent' | 'teacher' | 'batch_manager';

export type StudentType = 'coaching_online' | 'coaching_offline' | 'test_series' | 'home_tuition';

export type AccessStatus = 'active' | 'blocked_fee_pending' | 'blocked_manual' | 'suspended';

export interface User {
  id: string;
  clerkId: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  accessStatus: AccessStatus;
  accessBlockedReason?: string;
  accessBlockedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Clerk public metadata structure
export interface ClerkPublicMetadata {
  role: UserRole;
  dbUserId: string;
  studentId?: string;
  parentId?: string;
  teacherId?: string;
  studentType?: StudentType;
  classId?: string;
  batchId?: string;
  managedBatchIds?: string[];
}

// Clerk private metadata structure
export interface ClerkPrivateMetadata {
  accessStatus: AccessStatus;
  accessBlockedReason?: string;
  createdByAdminId?: string;
  lastPasswordReset?: string;
}

// ============================================================================
// STUDENT TYPES
// ============================================================================

export interface Student {
  id: string;
  userId: string;
  studentId: string; // Custom ID like "BEE2024001"
  studentType: StudentType;
  classId?: string;
  batchId?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  schoolName?: string;
  board?: string;
  enrollmentDate: string;
  validUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Parent {
  id: string;
  userId: string;
  parentId: string; // Custom ID like "BEEP2024001"
  relation?: string;
  occupation?: string;
  alternatePhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  userId: string;
  teacherId: string; // Custom ID like "BEET001"
  specialization?: string[];
  qualification?: string;
  experienceYears?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CLASS & BATCH TYPES
// ============================================================================

export interface Class {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  classId: string;
  name: string;
  description?: string;
  timing?: string;
  batchManagerId?: string;
  maxStudents: number;
  currentStudents: number;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// FEE & PAYMENT TYPES
// ============================================================================

export type FeeType =
  | 'registration'
  | 'coaching_installment_1'
  | 'coaching_installment_2'
  | 'test_series_full'
  | 'home_tuition_monthly';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';

export type PaymentMode =
  | 'online'
  | 'offline_cash'
  | 'offline_cheque'
  | 'offline_upi'
  | 'offline_bank_transfer';

export interface FeePlan {
  id: string;
  name: string;
  studentType: StudentType;
  classId?: string;
  feeType: FeeType;
  amount: number;
  gstPercentage: number;
  dueDayOfMonth?: number;
  dueMonth?: number;
  installmentNumber?: number;
  description?: string;
  isActive: boolean;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFee {
  id: string;
  studentId: string;
  feePlanId?: string;
  feeType: FeeType;
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  finalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  dueDate: string;
  status: PaymentStatus;
  couponId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentId: string; // Internal ID like "PAY2024001"
  studentFeeId?: string;
  studentId: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  offlineReference?: string;
  offlineReceivedBy?: string;
  offlineReceivedDate?: string;
  status: PaymentStatus;
  failureReason?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  receiptGeneratedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  refundedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

export type ContentType = 'pdf' | 'video' | 'document' | 'link';

export interface Content {
  id: string;
  title: string;
  description?: string;
  contentType: ContentType;
  classId?: string;
  subjectId?: string;
  chapter?: string;
  topic?: string;
  fileUrl: string;
  fileSize?: number;
  fileName?: string;
  mimeType?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  isFree: boolean;
  accessibleTo?: StudentType[];
  displayOrder: number;
  viewCount: number;
  downloadCount: number;
  isActive: boolean;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// EXAM TYPES
// ============================================================================

export type QuestionType = 'mcq_single' | 'mcq_multiple' | 'numerical' | 'fill_blank';

export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';

export type AttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted' | 'evaluated';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  classId?: string;
  subjectId?: string;
  chapter?: string;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  totalMarks: number;
  passingMarks?: number;
  negativeMarking: boolean;
  negativeMarkValue: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  allowReview: boolean;
  maxAttempts: number;
  accessibleTo?: StudentType[];
  specificBatchIds?: string[];
  status: ExamStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  examId: string;
  questionType: QuestionType;
  questionText: string;
  questionImageUrl?: string;
  options?: QuestionOption[];
  correctOptions?: string[];
  correctAnswerMin?: number;
  correctAnswerMax?: number;
  correctAnswers?: string[];
  caseSensitive: boolean;
  marks: number;
  negativeMarks: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation?: string;
  explanationImageUrl?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  timeTakenSeconds?: number;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  marksObtained?: number;
  percentage?: number;
  status: AttemptStatus;
  tabSwitches: number;
  fullscreenExits: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ANNOUNCEMENT TYPES
// ============================================================================

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRoles?: UserRole[];
  targetClasses?: string[];
  targetBatches?: string[];
  isGlobal: boolean;
  publishAt: string;
  expireAt?: string;
  priority: number;
  isPinned: boolean;
  isActive: boolean;
  attachmentUrls?: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Make all properties optional except specified ones
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Make specified properties required
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Create input type (without id and timestamps)
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

// Create update input type (all optional except id)
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> & { id: string };
