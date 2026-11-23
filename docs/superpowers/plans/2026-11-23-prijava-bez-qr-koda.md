# Prijava bez QR koda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bez QR-a (današnje stanje: nijedan uređaj ga nema) klijent identificira uređaj upisom S/N-a; QR samo unaprijed popuni S/N i preskoči taj korak.

**Architecture:** `/prijava` je jedini ulaz. Novi korak "Uređaj" je početni korak kad uređaj nije identificiran (nema `?sn=` ili S/N nije u bazi). Provjera ide preko GET `/api/uredaj`. Ako S/N ne postoji, klijent može poslati slobodan opis; prijava se sprema s `serijski_broj = NULL` i tekstom u `uredaj_opis_rucno`.

**Tech Stack:** Next.js 16 (App Router), Supabase, Resend, Telegram. Nema test frameworka i ne dodajemo ga; provjera je `npx tsc --noEmit`, `npm run build` i ručni primjer na dev serveru.

**Spec:** razgovor od 2026-11-23 (dizajn odobren; prioritet: bez QR-a je zadano stanje).

## Global Constraints
- UI tekst na hrvatskom; kod, identifikatori, komentari i commit poruke na engleskom (osim postojećih hrvatskih naziva polja/stupaca).
- Nema novih ovisnosti.
- SQL migracija se samo zapisuje u `supabase/klijentske_prijave.sql`; ne primjenjuje se na bazu bez odobrenja korisnika.
- Lookup vraća samo `tip_sistema` i `poduzece`.
- QR tok (`?sn=` valjan) ne smije prikazati novi korak.

## Review Focus
- S/N s razmacima ili malim slovima ("sn 123 " ) mora pronaći uređaj (trim + upper-case, usporedba kao u bazi).
- Nepoznat `?sn=` u URL-u ne smije ostati tihi: prikazuje se korak "Uređaj" s upisanim S/N-om.
- Ručni opis bez S/N-a: prazan unos blokira "Dalje".
- Brzo ponavljanje lookupa s iste IP adrese vraća 429, a forma to prikaže.
- Ručni opis se escapea u e-mailu (`esc`), a ne ubacuje sirov.

---

### Task 1: Baza i lookup endpoint

**Files:**
- Modify: `supabase/klijentske_prijave.sql` (CREATE TABLE + migracija)
- Modify: `lib/types.ts` (`KlijentskaPrijava`)
- Create: `app/api/uredaj/route.ts`

**Interfaces:**
- Produces: stupac `uredaj_opis_rucno text` (nullable); `KlijentskaPrijava.uredaj_opis_rucno: string | null`; `GET /api/uredaj?sn=<string>` → `200 { uredaj: { tip_sistema: string|null, poduzece: string|null, serijski_broj: string } | null }`, `400` ako `sn` prazan, `429 { error }` ako IP prijeđe 30 upita/sat.

- [ ] **Step 1:** U `CREATE TABLE` dodaj `uredaj_opis_rucno text`; u blok MIGRACIJA dodaj `ALTER TABLE klijentske_prijave ADD COLUMN IF NOT EXISTS uredaj_opis_rucno text;`. Dodaj polje u `KlijentskaPrijava`.
- [ ] **Step 2:** Implementiraj `GET` u `app/api/uredaj/route.ts` (`export const dynamic = 'force-dynamic'`). Normalizacija: `sn.trim().toUpperCase()`, max 64 znaka. Upit isti kao u [page.tsx](app/prijava/page.tsx) (`instalirani_uredaji`, `.eq('"S/N pisača"', sn)`, `maybeSingle`). Rate limit: modulni `Map<ip, number[]>` s prozorom 1 h i limitom 30; komentar `shortcut: in-memory per instance, move to DB/Upstash if enumeration is observed`.
- [ ] **Step 3:** Provjera: `npx tsc --noEmit` → bez grešaka. Dev server, `curl "http://localhost:3000/api/uredaj?sn="` → 400; `?sn=NEPOSTOJI` → `{"uredaj":null}`; stvaran S/N iz baze → tip i poduzeće (traži se S/N od korisnika; ne čitamo bazu sami).
- [ ] **Step 4:** Commit `feat: add device lookup endpoint and manual device column`.

### Task 2: Korak "Uređaj" u formi

**Files:**
- Modify: `app/prijava/PrijavaForm.tsx`
- Modify: `app/prijava/page.tsx` (samo ako treba proslijediti početni S/N; `snPoslan` već ide)

**Interfaces:**
- Consumes: `GET /api/uredaj` iz Task 1.
- Produces: u `FormData` šalju se `sn` (potvrđeni ili upisani S/N) i `uredajOpisRucno` (samo kad uređaj nije pronađen).

- [ ] **Step 1:** Proširi `type Korak` s `0`. Početno stanje: `useState<Korak>(uredaj ? 1 : 0)`; stanja `snUnos` (početno `snPoslan ?? ''`), `uredajLokalni` (početno `uredaj`), `uredajOpis`, `lookupLoading`, `lookupMsg`. Stepper "Foto/Opis/Podaci/Pregled" ostaje, a korak 0 ga ne prikazuje.
- [ ] **Step 2:** Korak 0 UI: polje "Serijski broj (S/N s pločice uređaja)", gumb "Provjeri" → `fetch('/api/uredaj?sn=…')`. Pronađen → kartica s tipom i poduzećem i gumbi "Da, to je moj uređaj" (postavi `uredajLokalni`, korak 1) / "Ne, upiši ponovo". Nije pronađen → poruka i polje "Poduzeće / naziv uređaja / lokacija" (obavezno) s gumbom "Nastavi bez identifikacije" (korak 1). 429 → postojeći stil greške.
- [ ] **Step 3:** Zamijeni `uredaj` s `uredajLokalni` u zaglavlju, sažetku i `uredajNaziv`. Dodaj `fd.append('uredajOpisRucno', …)` kad je `!uredajLokalni`; `sn` je `uredajLokalni?.serijski_broj ?? snUnos.trim()`. U koraku 1 dodaj "← Nazad" na korak 0 samo ako je korak 0 bio prikazan.
- [ ] **Step 4:** Provjera: `npm run build` prolazi; u pregledniku (dev server) tri puta: `/prijava` (korak 0 prvi), `/prijava?sn=<nepoznat>` (korak 0 s upisanim S/N-om), `/prijava?sn=<valjan>` (odmah korak 1, bez koraka 0). Screenshot ili tekstualni ispis kao dokaz.
- [ ] **Step 5:** Commit `feat: add manual device identification step to prijava form`.

### Task 3: API i obavijesti

**Files:**
- Modify: `app/api/prijava/route.ts`
- Modify: `app/verify/page.tsx` (select + `notifPayload`)
- Modify: `lib/notifications.ts` (`NotifPayload`, `VerificationEmailPayload`, Telegram, e-mail servisu, verifikacijski e-mail)

**Interfaces:**
- Consumes: `uredajOpisRucno` iz FormData-e; stupac iz Task 1.
- Produces: `NotifPayload.uredaj_opis_rucno: string | null` i `NotifPayload.sn_poslan: string | null`; isto polje `uredaj_opis_rucno` u `VerificationEmailPayload`.

- [ ] **Step 1:** U `route.ts` pročitaj `uredajOpisRucno` (trim, max 300 znakova, `|| null`); `sn` normaliziraj `trim().toUpperCase()` prije lookupa. Spremi `uredaj_opis_rucno` samo kad lookup nije našao uređaj; ako nije našao uređaj i opis je prazan → 400 "Opišite uređaj." Insert i `sendVerificationEmail` dobivaju novo polje.
- [ ] **Step 2:** U `verify/page.tsx` dodaj `sn_poslan, uredaj_opis_rucno` u select (redak 55) i u `notifPayload` (oko redaka 113-114).
- [ ] **Step 3:** U `notifications.ts`: kad je `serijski_broj` null, Telegram redak uređaja i redak u e-mailu servisu prikazuju `⚠️ Uređaj nije identificiran — S/N: <sn_poslan ?? '—'>, opis: <uredaj_opis_rucno ?? '—'>`; verifikacijski e-mail prikazuje isto u retku "Uređaj" kroz `esc`. Naslov e-maila servisu dobiva `[NEIDENTIFICIRAN UREĐAJ]` umjesto tipa.
- [ ] **Step 4:** Provjera: `npx tsc --noEmit` i `npm run build` bez grešaka. Za stvarnu prijavu potrebna je primijenjena migracija i Supabase/Resend ključevi; ako ih nema, to se izričito navodi kao neprovjereno, a e-mail se provjerava pozivom funkcije s lažnim Resend ključem samo ako korisnik odobri.
- [ ] **Step 5:** Commit `feat: store and notify manually described devices`.

### Task 4: README

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** Kratko opiši dva ulaza: `/prijava` (S/N ručno) i `/prijava?sn=<S/N>` (QR, preskače korak), plus upozorenje o migraciji. QR format: URL s `?sn=` je već podržan; dodavanje QR-a uređajima ne traži izmjenu koda.
- [ ] **Step 2:** Commit `docs: describe entry without QR code`.

---

# Faza 2 — praćenje prijava (zajednička baza, work-order-app-next)

Odluka: evidenciju ne dupliciramo. Osoblje već radi u `/admin/prijave`, klijenti u `/portal` (OTP, filter po e-mailu ili domeni). Faza 2 proširuje to, a servis-prijava samo vodi klijenta na portal. Tasks 5-6 dira repozitorij `D:\DOKUMENTI\CLAUDE CODE\Projects\work-order-app-next` i zajedničku produkcijsku bazu: prije početka treba izričito odobrenje korisnika; migracije se pišu kao datoteke, a primjenu odobrava korisnik.

**Neprovjereno prije starta:** `src/app/portal/dashboard/page.tsx` nije pročitan; `admin/portal-preview` dohvaća samo `radni_nalozi`. Task 5 počinje čitanjem tog fajla.

### Task 5: Povijest statusa (log tablica + trigger)

**Files (work-order-app-next):**
- Create: `supabase/migrations/046_klijentske_prijave_log.sql`
- Modify: `src/lib/types/database.ts` (tip `KlijentskaPrijavaLog`)

**Interfaces:**
- Produces: tablica `klijentske_prijave_log(id uuid pk, prijava_id uuid fk, created_at timestamptz, dogadaj text, stari_status text, novi_status text, serviser_id uuid null)`; `dogadaj` ∈ `kreirana | potvrdjena | status_promijenjen | dodijeljena | zakazana | zatvorena`.

- [ ] **Step 1:** Napiši migraciju: tablica, indeks `(prijava_id, created_at)`, RLS uključen s politikom SELECT samo za `serviseri`, trigger funkcija `log_klijentska_prijava()` (AFTER INSERT OR UPDATE na `klijentske_prijave`): INSERT → `kreirana`; promjena `verified_at` iz NULL → `potvrdjena`; promjena `status` → `status_promijenjen` (ili `zatvorena` kad je novi status `zatvorena`); `serviser_id = auth.uid()` (NULL za service role). Točan naziv stupaca za dodjelu servisera i termin čita se iz [sinkronizacija.ts](D:/DOKUMENTI/CLAUDE CODE/Projects/work-order-app-next/src/app/admin/prijave/sinkronizacija.ts) i `[id]/actions.ts`; `dodijeljena`/`zakazana` se bilježe pri promjeni tih stupaca.
- [ ] **Step 2:** Opcionalni backfill u istoj datoteci, zakomentiran: po jedan `kreirana` red iz `created_at` i `potvrdjena` iz `verified_at` za postojeće prijave.
- [ ] **Step 3:** Provjera: migracija se primjenjuje na lokalnu/test bazu ako postoji; ako ne postoji, izričito se navodi kao neprovjereno. Na produkciju ne ide bez odobrenja.
- [ ] **Step 4:** Commit u work-order repou: `feat: add klijentske_prijave_log with trigger`.

### Task 6: Prijave i vremenska crta u `/portal`

**Files (work-order-app-next):** `src/app/portal/dashboard/page.tsx`, `DashboardClient.tsx`, `actions.ts` (točne izmjene nakon čitanja).

**Interfaces:**
- Consumes: `getPortalSession()` i `buildFilter` iz `@/lib/portal/auth`; tablice `klijentske_prijave`, `klijentske_prijave_log`; bucket `prijave-slike` (potpisani linkovi, 1 h, kao za `nalog-slike`).
- Produces: sekcija "Moje prijave" s: datum, uređaj (tip, S/N), status, termin, fotografija, vremenska crta događaja iz loga.

- [ ] **Step 1:** Dohvaćaj prijave istim filterom kao za naloge (točan e-mail za privatne domene, inače `@domena`), samo preko service-role upita iza portal sesije. Nikad ne vraćaj `ip_address`, `verification_token`, `serviser_id` ni imena servisera.
- [ ] **Step 2:** UI: lista prijava s bedževima statusa i vremenskom crtom (datum + događaj); ako prijava ima radni nalog, link na nalog.
- [ ] **Step 3:** Provjera: `npx tsc --noEmit` i `npm run build` u work-order repou; u pregledniku `/admin/portal-preview?email=<testni>` prikazuje prijave i crtu; potvrđeno da korisnik jedne domene ne vidi prijave druge (ručni test s dva e-maila).
- [ ] **Step 5:** Commit: `feat: show client reports and timeline in portal`.

### Task 7: Link na portal iz servis-prijave

**Files (servis-prijava):** `app/success/page.tsx`, `app/verify/page.tsx`, `lib/notifications.ts` (verifikacijski e-mail ne mijenjamo, link ide u potvrdu nakon verifikacije).

- [ ] **Step 1:** Na ekranu nakon uspješne potvrde dodaj gumb "Pratite prijavu" na `${process.env.NEXT_PUBLIC_PORTAL_URL}/portal` (env varijabla; nova vrijednost ide u `.env.example`, a `.env` se ne dira). Ako varijabla nije postavljena, gumb se ne prikazuje.
- [ ] **Step 2:** Provjera: `npx tsc --noEmit`, `npm run build`; ekran uspjeha s i bez varijable.
- [ ] **Step 3:** Commit `feat: link to client portal after verification`.

Redoslijed: Faza 1 (Tasks 1-4) → Task 5 → Task 6 → Task 7. Faza 1 je neovisna i može ići sama.

## Self-review
- Pokriveno: korak za S/N (T2), potvrda uređaja (T2), rezerva (T1-T3), neidentificirano u obavijestima (T3), rate limit lookupa (T1), QR tok netaknut (T2 korak 4), README (T4).
- Imena konzistentna: `uredaj_opis_rucno` (DB/payload), `uredajOpisRucno` (FormData), `/api/uredaj`.
- Izostavljeno: admin sučelje za povezivanje prijave s uređajem, ispis S/N-a uz QR.
