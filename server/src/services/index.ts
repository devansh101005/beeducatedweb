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
