import { getAdminSupabase } from '@/lib/supabase'
import type { UredajInfo } from '@/lib/types'
import PrijavaForm from './PrijavaForm'

interface Props {
  searchParams: Promise<{ sn?: string }>
}

export default async function PrijavaPage({ searchParams }: Props) {
  const { sn } = await searchParams

  let uredaj: UredajInfo | null = null

  if (sn) {
    const adminSupabase = getAdminSupabase()
    const { data } = await adminSupabase
      .from('instalirani_uredaji')
      .select('"Tip pisača", "S/N pisača", "Poduzeće"')
      .eq('"S/N pisača"', sn)
      .maybeSingle()

    if (data) {
      uredaj = {
        tip_sistema: data['Tip pisača'] ?? null,
        serijski_broj: data['S/N pisača'] ?? null,
        poduzece: data['Poduzeće'] ?? null,
      }
    }
  }

  return <PrijavaForm uredaj={uredaj} snPoslan={sn ?? null} />
}
