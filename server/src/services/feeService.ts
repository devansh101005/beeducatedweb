// Fee Service
// Handles fee structures, student fees, and invoicing

import { getSupabase } from '../config/supabase.js';

// Types
export type FeeType = 'tuition' | 'registration' | 'exam' | 'material' | 'library' | 'lab' | 'transport' | 'hostel' | 'other';
export type FeeFrequency = 'one_time' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'void';

export interface FeeStructure {
  id: string;
  name: string;
  description: string | null;
  fee_type: FeeType;
  course_id: string | null;
  batch_id: string | null;
  amount: number;
  currency: string;
  frequency: FeeFrequency;
  duration_months: number | null;
  valid_from: string | null;
  valid_until: string | null;
  tax_percentage: number;
  max_discount_percentage: number;
  early_bird_discount_percentage: number;
  early_bird_deadline: string | null;
  late_fee_percentage: number;
  late_fee_fixed: number;
  grace_period_days: number;
  allow_installments: boolean;
  max_installments: number;
  installment_fee_percentage: number;
  is_active: boolean;
  is_mandatory: boolean;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentFee {
  id: string;
  student_id: string;
  fee_structure_id: string | null;
  fee_type: FeeType;
  description: string | null;
  base_amount: number;
  discount_amount: number;
  discount_reason: string | null;
  tax_amount: number;
  late_fee_amount: number;
  total_amount: number;
  currency: string;
  amount_paid: number;
  amount_due: number;
  due_date: string;
  is_installment: boolean;
  installment_number: number | null;
  total_installments: number | null;
  parent_fee_id: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  academic_year: string | null;
  academic_term: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  student_id: string;
  payment_id: string | null;
  title: string | null;
  description: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  line_items: LineItem[];
  status: InvoiceStatus;
  invoice_date: string;
  due_date: string | null;
  paid_date: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  billing_address: string | null;
  billing_gstin: string | null;
  institute_gstin: string | null;
  institute_address: string | null;
  pdf_url: string | null;
  notes: string | null;
  terms: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount: number | null;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  max_uses_per_student: number;
  applicable_courses: string[] | null;
  applicable_batches: string[] | null;
  applicable_fee_types: FeeType[] | null;
  min_purchase_amount: number | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFeeStructureInput {
  name: string;
  description?: string;
  fee_type: FeeType;
  course_id?: string;
  batch_id?: string;
  amount: number;
  currency?: string;
  frequency?: FeeFrequency;
  duration_months?: number;
  valid_from?: string;
  valid_until?: string;
  tax_percentage?: number;
  max_discount_percentage?: number;
  early_bird_discount_percentage?: number;
  early_bird_deadline?: string;
  late_fee_percentage?: number;
  late_fee_fixed?: number;
  grace_period_days?: number;
  allow_installments?: boolean;
  max_installments?: number;
  installment_fee_percentage?: number;
  is_mandatory?: boolean;
  created_by?: string;
}

export interface CreateStudentFeeInput {
  student_id: string;
  fee_structure_id?: string;
  fee_type: FeeType;
  description?: string;
  base_amount: number;
  discount_amount?: number;
  discount_reason?: string;
  tax_amount?: number;
  late_fee_amount?: number;
  due_date: string;
  is_installment?: boolean;
  installment_number?: number;
  total_installments?: number;
  parent_fee_id?: string;
  academic_year?: string;
  academic_term?: string;
  notes?: string;
  created_by?: string;
}

export interface StudentFeeListOptions {
  page?: number;
  limit?: number;
  studentId?: string;
  status?: PaymentStatus;
  feeType?: FeeType;
  academicYear?: string;
  overdue?: boolean;
  search?: string;
}

export interface InvoiceListOptions {
  page?: number;
  limit?: number;
  studentId?: string;
  status?: InvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
}

class FeeService {
  private supabase = getSupabase();

  // ============================================
  // FEE STRUCTURES
  // ============================================

  /**
   * Create fee structure
   */
  async createFeeStructure(input: CreateFeeStructureInput): Promise<FeeStructure> {
    const { data, error } = await this.supabase
      .from('fee_structures')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create fee structure: ${error.message}`);
    }

    return data as FeeStructure;
  }

  /**
   * Get fee structure by ID
   */
  async getFeeStructureById(id: string): Promise<FeeStructure | null> {
    const { data, error } = await this.supabase
      .from('fee_structures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get fee structure: ${error.message}`);
    }

    return data as FeeStructure;
  }

  /**
   * Update fee structure
   */
  async updateFeeStructure(id: string, updates: Partial<FeeStructure>): Promise<FeeStructure> {
    const { data, error } = await this.supabase
      .from('fee_structures')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update fee structure: ${error.message}`);
    }

    return data as FeeStructure;
  }

  /**
   * Delete fee structure
   */
  async deleteFeeStructure(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('fee_structures')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete fee structure: ${error.message}`);
    }
  }

  /**
   * List fee structures
   */
  async listFeeStructures(options: {
    page?: number;
    limit?: number;
    courseId?: string;
    batchId?: string;
    feeType?: FeeType;
    isActive?: boolean;
  } = {}): Promise<{ feeStructures: FeeStructure[]; total: number }> {
    const { page = 1, limit = 20, courseId, batchId, feeType, isActive } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('fee_structures')
      .select('*', { count: 'exact' });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (batchId) {
      query = query.eq('batch_id', batchId);
    }

    if (feeType) {
      query = query.eq('fee_type', feeType);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list fee structures: ${error.message}`);
    }

    return {
      feeStructures: data as FeeStructure[],
      total: count || 0,
    };
  }

  /**
   * Get applicable fee structures for a student
   */
  async getApplicableFeeStructures(studentId: string): Promise<FeeStructure[]> {
    // Get student's batches and courses
    const { data: batchData } = await this.supabase
      .from('batch_students')
      .select('batch_id')
      .eq('student_id', studentId)
      .eq('status', 'active');

    const batchIds = batchData?.map((b) => b.batch_id) || [];

    const { data: courseData } = await this.supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('student_id', studentId)
      .eq('status', 'active');

    const courseIds = courseData?.map((c) => c.course_id) || [];

    // Get applicable fee structures
    let query = this.supabase
      .from('fee_structures')
      .select('*')
      .eq('is_active', true);

    // Build filter for applicable fees
    const filters: string[] = ['course_id.is.null,batch_id.is.null']; // Global fees

    if (batchIds.length > 0) {
      filters.push(`batch_id.in.(${batchIds.join(',')})`);
    }

    if (courseIds.length > 0) {
      filters.push(`course_id.in.(${courseIds.join(',')})`);
    }

    query = query.or(filters.join(','));

    // Check validity
    const now = new Date().toISOString().split('T')[0];
    query = query.or(`valid_from.is.null,valid_from.lte.${now}`);
    query = query.or(`valid_until.is.null,valid_until.gte.${now}`);

    const { data, error } = await query.order('name');

    if (error) {
      throw new Error(`Failed to get applicable fee structures: ${error.message}`);
    }

    return data as FeeStructure[];
  }

  // ============================================
  // STUDENT FEES
  // ============================================

  /**
   * Create student fee
   */
  async createStudentFee(input: CreateStudentFeeInput): Promise<StudentFee> {
    // Calculate total amount
    const total_amount =
      input.base_amount -
      (input.discount_amount || 0) +
      (input.tax_amount || 0) +
      (input.late_fee_amount || 0);

    const { data, error } = await this.supabase
      .from('student_fees')
      .insert({
        ...input,
        total_amount,
        amount_due: total_amount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create student fee: ${error.message}`);
    }

    return data as StudentFee;
  }

  /**
   * Create student fee from fee structure
   */
  async createStudentFeeFromStructure(
    studentId: string,
    feeStructureId: string,
    options: {
      dueDate: string;
      discountAmount?: number;
      discountReason?: string;
      academicYear?: string;
      academicTerm?: string;
      createInstallments?: boolean;
      createdBy?: string;
    }
  ): Promise<StudentFee | StudentFee[]> {
    const feeStructure = await this.getFeeStructureById(feeStructureId);
    if (!feeStructure) {
      throw new Error('Fee structure not found');
    }

    const baseAmount = feeStructure.amount;
    const taxAmount = baseAmount * (feeStructure.tax_percentage / 100);
    const discountAmount = options.discountAmount || 0;

    // Check early bird discount
    let earlyBirdDiscount = 0;
    if (feeStructure.early_bird_deadline && feeStructure.early_bird_discount_percentage > 0) {
      const deadline = new Date(feeStructure.early_bird_deadline);
      if (new Date() <= deadline) {
        earlyBirdDiscount = baseAmount * (feeStructure.early_bird_discount_percentage / 100);
      }
    }

    const totalDiscount = discountAmount + earlyBirdDiscount;

    // Create installments if requested
    if (options.createInstallments && feeStructure.allow_installments && feeStructure.max_installments > 1) {
      const installments: StudentFee[] = [];
      const installmentAmount = (baseAmount - totalDiscount + taxAmount) / feeStructure.max_installments;
      const installmentFee = installmentAmount * (feeStructure.installment_fee_percentage / 100);

      // Create parent fee record
      const parentFee = await this.createStudentFee({
        student_id: studentId,
        fee_structure_id: feeStructureId,
        fee_type: feeStructure.fee_type,
        description: feeStructure.name,
        base_amount: baseAmount,
        discount_amount: totalDiscount,
        discount_reason: options.discountReason || (earlyBirdDiscount > 0 ? 'Early bird discount' : undefined),
        tax_amount: taxAmount,
        due_date: options.dueDate,
        is_installment: false,
        total_installments: feeStructure.max_installments,
        academic_year: options.academicYear,
        academic_term: options.academicTerm,
        created_by: options.createdBy,
      });

      // Create installment records
      const dueDate = new Date(options.dueDate);
      for (let i = 1; i <= feeStructure.max_installments; i++) {
        const installmentDueDate = new Date(dueDate);
        installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));

        const installmentRecord = await this.createStudentFee({
          student_id: studentId,
          fee_structure_id: feeStructureId,
          fee_type: feeStructure.fee_type,
          description: `${feeStructure.name} - Installment ${i}/${feeStructure.max_installments}`,
          base_amount: installmentAmount + installmentFee,
          due_date: installmentDueDate.toISOString().split('T')[0],
          is_installment: true,
          installment_number: i,
          total_installments: feeStructure.max_installments,
          parent_fee_id: parentFee.id,
          academic_year: options.academicYear,
          academic_term: options.academicTerm,
          created_by: options.createdBy,
        });

        installments.push(installmentRecord);
      }

      return installments;
    }

    // Create single fee
    return this.createStudentFee({
      student_id: studentId,
      fee_structure_id: feeStructureId,
      fee_type: feeStructure.fee_type,
      description: feeStructure.name,
      base_amount: baseAmount,
      discount_amount: totalDiscount,
      discount_reason: options.discountReason || (earlyBirdDiscount > 0 ? 'Early bird discount' : undefined),
      tax_amount: taxAmount,
      due_date: options.dueDate,
      academic_year: options.academicYear,
      academic_term: options.academicTerm,
      created_by: options.createdBy,
    });
  }

  /**
   * Get student fee by ID
   */
  async getStudentFeeById(id: string): Promise<StudentFee | null> {
    const { data, error } = await this.supabase
      .from('student_fees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get student fee: ${error.message}`);
    }

    return data as StudentFee;
  }

  /**
   * Update student fee
   */
  async updateStudentFee(id: string, updates: Partial<StudentFee>): Promise<StudentFee> {
    const { data, error } = await this.supabase
      .from('student_fees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update student fee: ${error.message}`);
    }

    return data as StudentFee;
  }

  /**
   * Delete student fee
   */
  async deleteStudentFee(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('student_fees')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete student fee: ${error.message}`);
    }
  }

  /**
   * List student fees
   */
  async listStudentFees(options: StudentFeeListOptions = {}): Promise<{ fees: StudentFee[]; total: number }> {
    const { page = 1, limit = 20, studentId, status, feeType, academicYear, overdue, search } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('student_fees')
      .select('*', { count: 'exact' });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (feeType) {
      query = query.eq('fee_type', feeType);
    }

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    if (overdue) {
      const today = new Date().toISOString().split('T')[0];
      query = query.lt('due_date', today).eq('status', 'pending');
    }

    if (search) {
      query = query.ilike('description', `%${search}%`);
    }

    const { data, error, count } = await query
      .order('due_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list student fees: ${error.message}`);
    }

    return {
      fees: data as StudentFee[],
      total: count || 0,
    };
  }

  /**
   * Get student fee summary
   */
  async getStudentFeeSummary(studentId: string): Promise<{
    totalFees: number;
    totalPaid: number;
    totalDue: number;
    pendingCount: number;
    overdueCount: number;
  }> {
    const { data, error } = await this.supabase
      .from('student_fees')
      .select('total_amount, amount_paid, amount_due, status, due_date')
      .eq('student_id', studentId)
      .eq('is_installment', false);

    if (error) {
      throw new Error(`Failed to get fee summary: ${error.message}`);
    }

    const today = new Date().toISOString().split('T')[0];

    return {
      totalFees: data.reduce((sum, f) => sum + Number(f.total_amount), 0),
      totalPaid: data.reduce((sum, f) => sum + Number(f.amount_paid), 0),
      totalDue: data.reduce((sum, f) => sum + Number(f.amount_due), 0),
      pendingCount: data.filter((f) => f.status === 'pending').length,
      overdueCount: data.filter((f) => f.status === 'pending' && f.due_date < today).length,
    };
  }

  /**
   * Apply late fee
   */
  async applyLateFees(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    // Get overdue fees
    const { data: overdueFees, error } = await this.supabase
      .from('student_fees')
      .select(`
        *,
        fee_structure:fee_structures(
          late_fee_percentage,
          late_fee_fixed,
          grace_period_days
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', today)
      .eq('late_fee_amount', 0);

    if (error || !overdueFees) return 0;

    let updatedCount = 0;

    for (const fee of overdueFees) {
      const feeStructureArr = fee.fee_structure as { late_fee_percentage: number; late_fee_fixed: number; grace_period_days: number }[] | null;
      const feeStructure = Array.isArray(feeStructureArr) ? feeStructureArr[0] : feeStructureArr;
      if (!feeStructure) continue;

      // Check grace period
      const dueDate = new Date(fee.due_date);
      const graceDays = feeStructure.grace_period_days || 0;
      dueDate.setDate(dueDate.getDate() + graceDays);

      if (new Date() <= dueDate) continue;

      // Calculate late fee
      const lateFeePercentage = feeStructure.late_fee_percentage || 0;
      const lateFeeFixed = feeStructure.late_fee_fixed || 0;
      const lateFeeAmount = (fee.base_amount * lateFeePercentage / 100) + lateFeeFixed;

      if (lateFeeAmount <= 0) continue;

      // Update fee
      await this.supabase
        .from('student_fees')
        .update({
          late_fee_amount: lateFeeAmount,
          total_amount: fee.total_amount + lateFeeAmount,
          amount_due: fee.amount_due + lateFeeAmount,
        })
        .eq('id', fee.id);

      updatedCount++;
    }

    return updatedCount;
  }

  // ============================================
  // INVOICES
  // ============================================

  /**
   * Create invoice
   */
  async createInvoice(input: {
    student_id: string;
    payment_id?: string;
    title?: string;
    description?: string;
    line_items: LineItem[];
    discount_amount?: number;
    tax_amount?: number;
    due_date?: string;
    billing_name?: string;
    billing_email?: string;
    billing_phone?: string;
    billing_address?: string;
    billing_gstin?: string;
    notes?: string;
    terms?: string;
    created_by?: string;
  }): Promise<Invoice> {
    // Generate invoice number
    const { data: invoiceNumberData } = await this.supabase
      .rpc('generate_invoice_number');

    const invoiceNumber = invoiceNumberData || `INV-${Date.now()}`;

    // Calculate totals
    const subtotal = input.line_items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = input.discount_amount || 0;
    const taxAmount = input.tax_amount || 0;
    const totalAmount = subtotal - discountAmount + taxAmount;

    const { data, error } = await this.supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        student_id: input.student_id,
        payment_id: input.payment_id,
        title: input.title,
        description: input.description,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        line_items: input.line_items,
        status: 'draft',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: input.due_date,
        billing_name: input.billing_name,
        billing_email: input.billing_email,
        billing_phone: input.billing_phone,
        billing_address: input.billing_address,
        billing_gstin: input.billing_gstin,
        notes: input.notes,
        terms: input.terms,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    return data as Invoice;
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get invoice: ${error.message}`);
    }

    return data as Invoice;
  }

  /**
   * Get invoice by number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get invoice: ${error.message}`);
    }

    return data as Invoice;
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await this.supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update invoice: ${error.message}`);
    }

    return data as Invoice;
  }

  /**
   * List invoices
   */
  async listInvoices(options: InvoiceListOptions = {}): Promise<{ invoices: Invoice[]; total: number }> {
    const { page = 1, limit = 20, studentId, status, dateFrom, dateTo } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('invoices')
      .select('*', { count: 'exact' });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('invoice_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('invoice_date', dateTo);
    }

    const { data, error, count } = await query
      .order('invoice_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list invoices: ${error.message}`);
    }

    return {
      invoices: data as Invoice[],
      total: count || 0,
    };
  }

  /**
   * Send invoice
   */
  async sendInvoice(id: string): Promise<Invoice> {
    return this.updateInvoice(id, { status: 'sent' });
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(id: string, paymentId: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'paid',
      payment_id: paymentId,
      paid_date: new Date().toISOString().split('T')[0],
    });
  }

  // ============================================
  // DISCOUNT CODES
  // ============================================

  /**
   * Create discount code
   */
  async createDiscountCode(input: {
    code: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_discount_amount?: number;
    valid_from?: string;
    valid_until?: string;
    max_uses?: number;
    max_uses_per_student?: number;
    applicable_courses?: string[];
    applicable_batches?: string[];
    applicable_fee_types?: FeeType[];
    min_purchase_amount?: number;
    created_by?: string;
  }): Promise<DiscountCode> {
    const { data, error } = await this.supabase
      .from('discount_codes')
      .insert({
        ...input,
        code: input.code.toUpperCase(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create discount code: ${error.message}`);
    }

    return data as DiscountCode;
  }

  /**
   * Get discount code by code
   */
  async getDiscountCode(code: string): Promise<DiscountCode | null> {
    const { data, error } = await this.supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get discount code: ${error.message}`);
    }

    return data as DiscountCode;
  }

  /**
   * Validate and calculate discount
   */
  async validateDiscount(
    code: string,
    studentId: string,
    amount: number,
    options?: {
      courseId?: string;
      batchId?: string;
      feeType?: FeeType;
    }
  ): Promise<{
    valid: boolean;
    discountAmount: number;
    message?: string;
  }> {
    const discountCode = await this.getDiscountCode(code);

    if (!discountCode) {
      return { valid: false, discountAmount: 0, message: 'Invalid discount code' };
    }

    if (!discountCode.is_active) {
      return { valid: false, discountAmount: 0, message: 'Discount code is inactive' };
    }

    // Check validity period
    const now = new Date();
    if (discountCode.valid_from && new Date(discountCode.valid_from) > now) {
      return { valid: false, discountAmount: 0, message: 'Discount code is not yet valid' };
    }

    if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
      return { valid: false, discountAmount: 0, message: 'Discount code has expired' };
    }

    // Check usage limits
    if (discountCode.max_uses && discountCode.current_uses >= discountCode.max_uses) {
      return { valid: false, discountAmount: 0, message: 'Discount code usage limit reached' };
    }

    // Check per-student usage
    const { count } = await this.supabase
      .from('discount_code_usage')
      .select('*', { count: 'exact', head: true })
      .eq('discount_code_id', discountCode.id)
      .eq('student_id', studentId);

    if (discountCode.max_uses_per_student && (count || 0) >= discountCode.max_uses_per_student) {
      return { valid: false, discountAmount: 0, message: 'You have already used this discount code' };
    }

    // Check minimum purchase
    if (discountCode.min_purchase_amount && amount < discountCode.min_purchase_amount) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Minimum purchase of ${discountCode.min_purchase_amount} required`,
      };
    }

    // Check applicability
    if (options?.courseId && discountCode.applicable_courses?.length) {
      if (!discountCode.applicable_courses.includes(options.courseId)) {
        return { valid: false, discountAmount: 0, message: 'Discount code not applicable for this course' };
      }
    }

    if (options?.batchId && discountCode.applicable_batches?.length) {
      if (!discountCode.applicable_batches.includes(options.batchId)) {
        return { valid: false, discountAmount: 0, message: 'Discount code not applicable for this batch' };
      }
    }

    if (options?.feeType && discountCode.applicable_fee_types?.length) {
      if (!discountCode.applicable_fee_types.includes(options.feeType)) {
        return { valid: false, discountAmount: 0, message: 'Discount code not applicable for this fee type' };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (discountCode.discount_type === 'percentage') {
      discountAmount = amount * (discountCode.discount_value / 100);
      if (discountCode.max_discount_amount) {
        discountAmount = Math.min(discountAmount, discountCode.max_discount_amount);
      }
    } else {
      discountAmount = discountCode.discount_value;
    }

    // Ensure discount doesn't exceed amount
    discountAmount = Math.min(discountAmount, amount);

    return {
      valid: true,
      discountAmount,
      message: `Discount of ${discountAmount} applied`,
    };
  }

  /**
   * Record discount code usage
   */
  async recordDiscountUsage(
    discountCodeId: string,
    studentId: string,
    paymentId: string,
    studentFeeId: string,
    discountAmount: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('discount_code_usage')
      .insert({
        discount_code_id: discountCodeId,
        student_id: studentId,
        payment_id: paymentId,
        student_fee_id: studentFeeId,
        discount_amount: discountAmount,
      });

    if (error) {
      throw new Error(`Failed to record discount usage: ${error.message}`);
    }
  }

  /**
   * List discount codes
   */
  async listDiscountCodes(options: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  } = {}): Promise<{ codes: DiscountCode[]; total: number }> {
    const { page = 1, limit = 20, isActive } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('discount_codes')
      .select('*', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list discount codes: ${error.message}`);
    }

    return {
      codes: data as DiscountCode[],
      total: count || 0,
    };
  }

  /**
   * Update discount code
   */
  async updateDiscountCode(id: string, updates: Partial<DiscountCode>): Promise<DiscountCode> {
    const { data, error } = await this.supabase
      .from('discount_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update discount code: ${error.message}`);
    }

    return data as DiscountCode;
  }

  /**
   * Delete discount code
   */
  async deleteDiscountCode(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete discount code: ${error.message}`);
    }
  }
}

// Export singleton instance
export const feeService = new FeeService();
