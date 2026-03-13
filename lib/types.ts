export type KlijentskaPrijavaStatus = 'nova' | 'u_obradi' | 'zatvorena'

export interface KlijentskaPrijava {
  id: string
  sn_poslan: string | null
  tip_sistema: string | null
  serijski_broj: string | null
  poduzece: string | null
  ime_operatera: string
  prezime_operatera: string | null
  opis_problema: string
  slika_storage_path: string | null
  status: KlijentskaPrijavaStatus
  ip_address: string | null
  created_at: string
  updated_at: string
}

export interface UredajInfo {
  tip_sistema: string | null
  serijski_broj: string | null
  poduzece: string | null
}
