export type TransactionType = 'INCOME' | 'EXPENSE';

export type IncomeCategory = 'CONSULTATION' | 'PROCEDURE' | 'EXAM' | 'OTHER_INCOME';
export type ExpenseCategory = 'SALARY' | 'RENT' | 'UTILITIES' | 'SUPPLIES' | 'EQUIPMENT' | 'MARKETING' | 'OTHER_EXPENSE';
export type TransactionCategory = IncomeCategory | ExpenseCategory;

export type ServiceCategory = 'CONSULTATION' | 'PROCEDURE' | 'EXAM' | 'OTHER';

export type PaymentMethod = 'CASH' | 'CARD_CREDIT' | 'CARD_DEBIT' | 'PIX' | 'INSURANCE' | 'BANK_TRANSFER' | 'CHECK';

export type TransactionStatus = 'PENDING' | 'PAID' | 'CANCELED';

export interface FinancialService {
    id: string;
    clinic_id: string;
    name: string;
    description: string | null;
    category: ServiceCategory;
    default_price: number;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface FinancialTransaction {
    id: string;
    clinic_id: string;
    type: TransactionType;
    category: TransactionCategory;
    description: string;
    amount: number;
    payment_method: PaymentMethod | null;
    status: TransactionStatus;
    competency_date: string;
    due_date: string | null;
    paid_at: string | null;
    consultation_id: string | null;
    patient_id: string | null;
    doctor_id: string | null;
    financial_service_id: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    patient?: { name: string } | null;
    doctor?: { name: string } | null;
    financial_service?: { name: string } | null;
}

export interface CreateTransactionInput {
    type: TransactionType;
    category: TransactionCategory;
    description: string;
    amount: number;
    payment_method?: PaymentMethod;
    status?: TransactionStatus;
    competency_date?: string;
    due_date?: string;
    consultation_id?: string;
    patient_id?: string;
    doctor_id?: string;
    financial_service_id?: string;
    notes?: string;
}

export interface CreateServiceInput {
    name: string;
    description?: string;
    category: ServiceCategory;
    default_price: number;
    active?: boolean;
}

export interface UpdateServiceInput {
    name?: string;
    description?: string;
    category?: ServiceCategory;
    default_price?: number;
    active?: boolean;
}

export interface FinancialSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    pendingIncome: number;
    pendingExpense: number;
    byCategory: Record<string, number>;
    byPaymentMethod: Record<string, number>;
}

export interface TransactionFilters {
    type?: TransactionType;
    status?: TransactionStatus;
    category?: TransactionCategory;
    startDate?: string;
    endDate?: string;
    patientId?: string;
}

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
    CONSULTATION: 'Consulta',
    PROCEDURE: 'Procedimento',
    EXAM: 'Exame',
    OTHER_INCOME: 'Outra Entrada',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    SALARY: 'Salário',
    RENT: 'Aluguel',
    UTILITIES: 'Utilidades',
    SUPPLIES: 'Suprimentos',
    EQUIPMENT: 'Equipamento',
    MARKETING: 'Marketing',
    OTHER_EXPENSE: 'Outra Saída',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: 'Dinheiro',
    CARD_CREDIT: 'Cartão de Crédito',
    CARD_DEBIT: 'Cartão de Débito',
    PIX: 'PIX',
    INSURANCE: 'Convênio',
    BANK_TRANSFER: 'Transferência',
    CHECK: 'Cheque',
};

export const STATUS_LABELS: Record<TransactionStatus, string> = {
    PENDING: 'Pendente',
    PAID: 'Pago',
    CANCELED: 'Cancelado',
};

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
    CONSULTATION: 'Consulta',
    PROCEDURE: 'Procedimento',
    EXAM: 'Exame',
    OTHER: 'Outro',
};
