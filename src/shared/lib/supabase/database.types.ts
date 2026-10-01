// Mirrors supabase/migrations. Regenerate with `supabase gen types typescript` when the schema changes.

export type DebtType = "owed_to_me" | "i_owe";

export type Database = {
  public: {
    Tables: {
      debts: {
        Row: {
          id: string;
          user_id: string;
          type: DebtType;
          counterpart_name: string;
          amount: number;
          note: string | null;
          due_date: string | null;
          settled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          type: DebtType;
          counterpart_name: string;
          amount: number;
          note?: string | null;
          due_date?: string | null;
          settled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type?: DebtType;
          counterpart_name?: string;
          amount?: number;
          note?: string | null;
          due_date?: string | null;
          settled_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { debt_type: DebtType };
    CompositeTypes: { [_ in never]: never };
  };
};
