// Services barrel export

// User service
export { userService } from './userService.js';
export type { User, UserRole, CreateUserInput, UpdateUserInput } from './userService.js';

// Student service
export { studentService } from './studentService.js';
export type {
  Student,
  StudentType,
  SubscriptionStatus,
  CreateStudentInput,
  UpdateStudentInput,
} from './studentService.js';

// Teacher service
export { teacherService } from './teacherService.js';
export type { Teacher, CreateTeacherInput, UpdateTeacherInput } from './teacherService.js';

// Parent service
export { parentService } from './parentService.js';
export type {
  Parent,
  ParentStudent,
  CreateParentInput,
  UpdateParentInput,
} from './parentService.js';

// Batch service
export { batchService } from './batchService.js';

// Course service
export { courseService } from './courseService.js';

// Announcement service
export { announcementService } from './announcementService.js';

// Content service
export { contentService } from './contentService.js';

// Storage service
export { storageService } from './storageService.js';

// Question service
export { questionService } from './questionService.js';

// Exam Attempt service
export { examAttemptService } from './examAttemptService.js';

// Exam service
export { examService } from './examService.js';

// Dashboard service (Phase 6)
export { dashboardService } from './dashboardService.js';

// Report service (Phase 6)
export { reportService } from './reportService.js';

// Fee service (Phase 4)
export { feeService } from './feeService.js';

// Payment service (Phase 4)
export { paymentService } from './paymentService.js';

// Razorpay service (Phase 4)
export { razorpayService } from './razorpayService.js';
