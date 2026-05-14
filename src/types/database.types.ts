export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      albaranes: {
        Row: {
          cliente_direccion: string | null
          cliente_email: string | null
          cliente_nif: string | null
          cliente_nombre: string | null
          created_at: string | null
          datos_json: Json | null
          descripcion: string | null
          estado: string | null
          fecha: string | null
          id: string
          notas: string | null
          numero: string | null
          user_id: string
        }
        Insert: {
          cliente_direccion?: string | null
          cliente_email?: string | null
          cliente_nif?: string | null
          cliente_nombre?: string | null
          created_at?: string | null
          datos_json?: Json | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          notas?: string | null
          numero?: string | null
          user_id: string
        }
        Update: {
          cliente_direccion?: string | null
          cliente_email?: string | null
          cliente_nif?: string | null
          cliente_nombre?: string | null
          created_at?: string | null
          datos_json?: Json | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          notas?: string | null
          numero?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          contenido: string
          created_at: string
          extracto: string
          id: string
          published_at: string | null
          slug: string
          status: string
          tags: string[]
          titulo: string
          updated_at: string
        }
        Insert: {
          contenido?: string
          created_at?: string
          extracto?: string
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[]
          titulo: string
          updated_at?: string
        }
        Update: {
          contenido?: string
          created_at?: string
          extracto?: string
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      clientes_frecuentes: {
        Row: {
          ciudad: string
          cliente_exterior: boolean
          cp: string
          created_at: string
          direccion: string
          email: string | null
          id: string
          nif: string
          nombre: string
          notas: string | null
          pais: string | null
          provincia: string
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ciudad?: string
          cliente_exterior?: boolean
          cp?: string
          created_at?: string
          direccion?: string
          email?: string | null
          id?: string
          nif?: string
          nombre: string
          notas?: string | null
          pais?: string | null
          provincia?: string
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ciudad?: string
          cliente_exterior?: boolean
          cp?: string
          created_at?: string
          direccion?: string
          email?: string | null
          id?: string
          nif?: string
          nombre?: string
          notas?: string | null
          pais?: string | null
          provincia?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          cliente_nombre: string | null
          created_at: string | null
          datos: Json | null
          datos_json: Json | null
          estado: string | null
          fecha: string | null
          id: string
          notas: string | null
          numero: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          cliente_nombre?: string | null
          created_at?: string | null
          datos?: Json | null
          datos_json?: Json | null
          estado?: string | null
          fecha?: string | null
          id?: string
          notas?: string | null
          numero?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          cliente_nombre?: string | null
          created_at?: string | null
          datos?: Json | null
          datos_json?: Json | null
          estado?: string | null
          fecha?: string | null
          id?: string
          notas?: string | null
          numero?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      document_sequences: {
        Row: {
          anio: number
          created_at: string
          last_value: number
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anio: number
          created_at?: string
          last_value?: number
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anio?: number
          created_at?: string
          last_value?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      empresa: {
        Row: {
          ciudad: string
          cp: string
          created_at: string
          direccion: string
          email: string
          id: string
          nif: string
          nombre: string
          provincia: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          ciudad?: string
          cp?: string
          created_at?: string
          direccion?: string
          email?: string
          id: string
          nif?: string
          nombre?: string
          provincia?: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          ciudad?: string
          cp?: string
          created_at?: string
          direccion?: string
          email?: string
          id?: string
          nif?: string
          nombre?: string
          provincia?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      facturas: {
        Row: {
          base_imponible: number | null
          cliente_direccion: string | null
          cliente_email: string | null
          cliente_nif: string | null
          cliente_nombre: string | null
          concepto: string | null
          created_at: string | null
          datos: Json | null
          datos_json: Json | null
          estado: string | null
          fecha: string | null
          id: string
          notas: string | null
          numero: string | null
          tipo_irpf: number | null
          tipo_iva: number | null
          total: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_imponible?: number | null
          cliente_direccion?: string | null
          cliente_email?: string | null
          cliente_nif?: string | null
          cliente_nombre?: string | null
          concepto?: string | null
          created_at?: string | null
          datos?: Json | null
          datos_json?: Json | null
          estado?: string | null
          fecha?: string | null
          id?: string
          notas?: string | null
          numero?: string | null
          tipo_irpf?: number | null
          tipo_iva?: number | null
          total?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_imponible?: number | null
          cliente_direccion?: string | null
          cliente_email?: string | null
          cliente_nif?: string | null
          cliente_nombre?: string | null
          concepto?: string | null
          created_at?: string | null
          datos?: Json | null
          datos_json?: Json | null
          estado?: string | null
          fecha?: string | null
          id?: string
          notas?: string | null
          numero?: string | null
          tipo_irpf?: number | null
          tipo_iva?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      herramientas: {
        Row: {
          activa: boolean
          anon_available: boolean
          categoria: string
          created_at: string
          descripcion: string
          id: string
          mantenimiento: boolean
          nombre: string
          orden: number
          plan_required: string
          proximamente: boolean
          ruta: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          activa?: boolean
          anon_available?: boolean
          categoria: string
          created_at?: string
          descripcion?: string
          id: string
          mantenimiento?: boolean
          nombre: string
          orden?: number
          plan_required?: string
          proximamente?: boolean
          ruta: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          activa?: boolean
          anon_available?: boolean
          categoria?: string
          created_at?: string
          descripcion?: string
          id?: string
          mantenimiento?: boolean
          nombre?: string
          orden?: number
          plan_required?: string
          proximamente?: boolean
          ruta?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      ndas: {
        Row: {
          created_at: string | null
          datos: Json | null
          datos_json: Json | null
          estado: string | null
          fecha: string | null
          id: string
          notas: string | null
          numero: string | null
          otra_parte_nombre: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          datos?: Json | null
          datos_json?: Json | null
          estado?: string | null
          fecha?: string | null
          id?: string
          notas?: string | null
          numero?: string | null
          otra_parte_nombre?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          datos?: Json | null
          datos_json?: Json | null
          estado?: string | null
          fecha?: string | null
          id?: string
          notas?: string | null
          numero?: string | null
          otra_parte_nombre?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      presupuestos: {
        Row: {
          base_imponible: number | null
          cliente_direccion: string | null
          cliente_email: string | null
          cliente_nif: string | null
          cliente_nombre: string | null
          concepto: string | null
          created_at: string | null
          datos: Json | null
          datos_json: Json | null
          estado: string | null
          factura_id: string | null
          fecha: string | null
          fue_aprobado: boolean
          id: string
          notas: string | null
          numero: string | null
          tipo_irpf: number | null
          tipo_iva: number | null
          total: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_imponible?: number | null
          cliente_direccion?: string | null
          cliente_email?: string | null
          cliente_nif?: string | null
          cliente_nombre?: string | null
          concepto?: string | null
          created_at?: string | null
          datos?: Json | null
          datos_json?: Json | null
          estado?: string | null
          factura_id?: string | null
          fecha?: string | null
          fue_aprobado?: boolean
          id?: string
          notas?: string | null
          numero?: string | null
          tipo_irpf?: number | null
          tipo_iva?: number | null
          total?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_imponible?: number | null
          cliente_direccion?: string | null
          cliente_email?: string | null
          cliente_nif?: string | null
          cliente_nombre?: string | null
          concepto?: string | null
          created_at?: string | null
          datos?: Json | null
          datos_json?: Json | null
          estado?: string | null
          factura_id?: string | null
          fecha?: string | null
          fue_aprobado?: boolean
          id?: string
          notas?: string | null
          numero?: string | null
          tipo_irpf?: number | null
          tipo_iva?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          plan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      reclamaciones: {
        Row: {
          created_at: string | null
          datos: Json | null
          datos_json: Json | null
          deudor_nombre: string | null
          estado: string | null
          fecha: string | null
          id: string
          importe: number | null
          notas: string | null
          numero: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          datos?: Json | null
          datos_json?: Json | null
          deudor_nombre?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          importe?: number | null
          notas?: string | null
          numero?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          datos?: Json | null
          datos_json?: Json | null
          deudor_nombre?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          importe?: number | null
          notas?: string | null
          numero?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_document_number: {
        Args: {
          p_fecha?: string
          p_prefijo: string
          p_tipo: string
          p_user_id?: string
        }
        Returns: {
          numero: string
          secuencia: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
