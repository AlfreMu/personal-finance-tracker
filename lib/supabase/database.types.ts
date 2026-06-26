export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Row<T> = T;
type Insert<TRequired, TOptional = Record<string, never>> = TRequired & Partial<TOptional>;
type Update<T> = Partial<T>;
type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type T<RowType, InsertType = RowType, UpdateType = RowType, Relationships extends Rel[] = Rel[]> = {
  Row: Row<RowType>;
  Insert: InsertType;
  Update: Update<UpdateType>;
  Relationships: Relationships;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      accounts: T<{
        id: string; user_id: string; name: string; kind: string; currency: string; is_active: boolean; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; name: string; kind: string; currency: string }, { id: string; is_active: boolean; created_at: string; updated_at: string }>>;
      cards: T<{
        id: string; user_id: string; payment_method_id: string; issuer: string; name: string; currency: string; closing_day: number | null; due_day: number | null; is_active: boolean; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; payment_method_id: string; issuer: string; name: string; currency: string }, { id: string; closing_day: number | null; due_day: number | null; is_active: boolean; created_at: string; updated_at: string }>>;
      categories: T<{
        id: string; user_id: string; name: string; scope: string; color: string | null; sort_order: number; is_active: boolean; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; name: string; scope: string }, { id: string; color: string | null; sort_order: number; is_active: boolean; created_at: string; updated_at: string }>>;
      imports: T<{
        id: string; user_id: string; source_file_name: string; source_hash: string; status: string; dry_run: boolean; summary_json: Json; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; source_file_name: string; source_hash: string }, { id: string; status: string; dry_run: boolean; summary_json: Json; created_at: string; updated_at: string }>>;
      income_sources: T<{
        id: string; user_id: string; name: string; default_type: string; is_active: boolean; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; name: string }, { id: string; default_type: string; is_active: boolean; created_at: string; updated_at: string }>>;
      installment_purchases: T<{
        id: string; user_id: string; description: string; category_id: string | null; payment_method_id: string | null; purchase_date: string; first_period_month: string; total_amount: number; installment_amount: number; installment_count: number; first_installment_number: number; currency: string; status: string; note: string | null; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; description: string; purchase_date: string; first_period_month: string; total_amount: number; installment_amount: number; installment_count: number; first_installment_number: number; currency: string }, { id: string; category_id: string | null; payment_method_id: string | null; status: string; note: string | null; created_at: string; updated_at: string }>>;
      installments: T<{
        id: string; user_id: string; installment_purchase_id: string; period_month: string; installment_number: number; amount: number; status: string; movement_id: string | null; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; installment_purchase_id: string; period_month: string; installment_number: number; amount: number }, { id: string; status: string; movement_id: string | null; created_at: string; updated_at: string }>>;
      investment_funds: T<{
        id: string; user_id: string; name: string; currency: string; provider: string | null; is_active: boolean; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; name: string; currency: string }, { id: string; provider: string | null; is_active: boolean; created_at: string; updated_at: string }>>;
      investment_movements: T<{
        id: string; user_id: string; occurred_on: string; type: string; fund_id: string | null; from_fund_id: string | null; to_fund_id: string | null; usd_amount: number | null; ars_amount: number | null; exchange_rate: number | null; status: string; note: string | null; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; occurred_on: string; type: string }, { id: string; fund_id: string | null; from_fund_id: string | null; to_fund_id: string | null; usd_amount: number | null; ars_amount: number | null; exchange_rate: number | null; status: string; note: string | null; created_at: string; updated_at: string }>>;
      movements: T<{
        id: string; user_id: string; occurred_on: string; type: string; nature: string; status: string; amount: number; currency: string; description: string; category_id: string | null; payment_method_id: string | null; account_id: string | null; counterparty_account_id: string | null; income_source_id: string | null; note: string | null; import_id: string | null; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; occurred_on: string; type: string; nature: string; amount: number; currency: string; description: string }, { id: string; status: string; category_id: string | null; payment_method_id: string | null; account_id: string | null; counterparty_account_id: string | null; income_source_id: string | null; note: string | null; import_id: string | null; created_at: string; updated_at: string }>>;
      payment_methods: T<{
        id: string; user_id: string; name: string; kind: string; default_account_id: string | null; is_default: boolean; is_active: boolean; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; name: string; kind: string }, { id: string; default_account_id: string | null; is_default: boolean; is_active: boolean; created_at: string; updated_at: string }>>;
      profiles: T<{
        id: string; display_name: string | null; base_currency: string; timezone: string; created_at: string; updated_at: string;
      }, Insert<{ id: string }, { display_name: string | null; base_currency: string; timezone: string; created_at: string; updated_at: string }>>;
      recurring_instances: T<{
        id: string; user_id: string; recurring_rule_id: string; period_month: string; planned_amount: number; status: string; movement_id: string | null; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; recurring_rule_id: string; period_month: string; planned_amount: number }, { id: string; status: string; movement_id: string | null; created_at: string; updated_at: string }>>;
      recurring_rules: T<{
        id: string; user_id: string; description: string; category_id: string | null; payment_method_id: string | null; current_amount: number; currency: string; frequency: string; start_month: string; end_month: string | null; is_active: boolean; note: string | null; created_at: string; updated_at: string;
      }, Insert<{ user_id: string; description: string; current_amount: number; currency: string; start_month: string }, { id: string; category_id: string | null; payment_method_id: string | null; frequency: string; end_month: string | null; is_active: boolean; note: string | null; created_at: string; updated_at: string }>>;
    };
    Views: { [_ in never]: never };
    Functions: {
      bootstrap_current_user_defaults: { Args: never; Returns: undefined };
      bootstrap_user_defaults: { Args: { target_user_id: string }; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<TName extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][TName]["Row"];
export type TablesInsert<TName extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][TName]["Insert"];
export type TablesUpdate<TName extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][TName]["Update"];
export type Enums<TName extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][TName];
export type CompositeTypes<TName extends keyof DefaultSchema["CompositeTypes"]> =
  DefaultSchema["CompositeTypes"][TName];

export const Constants = { public: { Enums: {} } } as const;
