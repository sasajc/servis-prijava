export type KlijentskaPrijavaStatus = 'nova' | 'u_obradi' | 'zatvorena' | 'na_cekanju'

export interface KlijentskaPrijava {
  id: string
  sn_poslan: string | null
  tip_sistema: string | null
  serijski_broj: string | null
  poduzece: string | null
  ime_operatera: string
  prezime_operatera: string | null
  email: string
  telefon: string
  opis_problema: string
  slika_storage_path: string | null
  status: KlijentskaPrijavaStatus
  zeljeno_vrijeme: string | null
  verification_token: string | null
  verified_at: string | null
  ip_address: string | null
  created_at: string
  updated_at: string
}

export interface UredajInfo {
  tip_sistema: string | null
  serijski_broj: string | null
  poduzece: string | null
}
