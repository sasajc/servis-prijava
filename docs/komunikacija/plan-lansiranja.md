# Lansiranje servisne prijave: prijedlozi i koraci

Stanje (23. 11. 2026.): aplikacija radi na produkciji, QR tok je testiran, prijava bez QR-a (unos S/N-a) i praćenje u portalu rade. Nijedan uređaj još nema QR naljepnicu.

Materijali u ovoj mapi: `uputa-za-korisnike.html` (A4, ispis ili PDF), `newsletter.html` (predložak za e-mail).

## Tri načina lansiranja

| | A. Pilot, pa svi (preporuka) | B. Svi odjednom | C. Prvo QR naljepnice |
|---|---|---|---|
| Što | 3 do 5 klijenata s više uređaja dobije uputu osobno, tjedan-dva kasnije newsletter svima | Newsletter svim klijentima isti dan | Naljepnice na uređaje pri redovnim posjetima, newsletter tek kad ih je većina označena |
| Prednost | Greške i nejasnoće uočite na malom broju ljudi; imate stvarne primjere za newsletter | Najbrže; najviše pažnje odjednom | Najbolji prvi dojam: skeniraj i gotovo |
| Rizik | Sporije | Ako nešto zapne, vide svi; vrh opterećenja za servis | Naljepnice traju mjesecima, a novost stoji |
| Kad | Ima smisla gotovo uvijek | Ako je klijenata malo i dobro ih poznajete | Ako ionako obilazite uređaje |

Preporuka: A, a naljepnice postavljati paralelno (C) pri svakom servisnom posjetu. Newsletter ionako kaže da je dovoljan S/N.

## Koraci

**Prije slanja (1 do 2 dana)**
1. Pošaljite sami sebi `newsletter.html` i provjerite izgled u Outlooku i na mobitelu. Ubacite pravi link za odjavu umjesto `[ODJAVA]`.
2. Odlučite tko prima Telegram i e-mail prijave i tko se javlja klijentu (kome, u kojem roku). Aplikacija ne obećava vrijeme odgovora, pa ga ni newsletter ne obećava.
3. Provjerite da je lista primatelja točna i da imate pravni temelj za slanje (klijenti, odjava u svakoj poruci).
4. Ako šaljete preko Resenda: provjerite dnevnu i mjesečnu kvotu plana. Zapisi pokazuju vrlo male kvote (besplatni plan ima oko 100 poruka dnevno), pa veće slanje podijelite u dane ili koristite alat za newslettere.

**QR naljepnice**
5. Svaki uređaj dobije QR koji vodi na `https://servis-prijava.logokod.hr/prijava?sn=<S/N>`. S/N je u tablici `instalirani_uredaji`. Naljepnice se mogu generirati skupno iz te tablice (mogu to napraviti kao sljedeći korak). Otporan materijal, uz tipsku pločicu, s napisanim S/N-om ispod koda, jer nečitljiv QR ne smije značiti nečitljiv broj.
6. Prije tiska isprobajte 2 do 3 naljepnice na mobitelima (iOS i Android) i s udaljenosti na kojoj se uređaj stvarno skenira.

**Dan lansiranja**
7. Pilot klijentima pošaljite uputu (PDF ili ispis) i link, uz poziv: „Prijavite sljedeći kvar ovako i recite nam što je bilo nejasno.“
8. Nakon tjedan-dva ispravite što je zapelo, pa pošaljite newsletter svima.

**Poslije (prva 4 tjedna)**
9. Pratite tjedno: broj prijava, udio potvrđenih (`verified_at` nije prazan), udio prijava bez prepoznatog uređaja (`uredaj_opis_rucno` nije prazan), koliko ih je zatvoreno. Upite mogu pripremiti.
10. Ako je mnogo neidentificiranih uređaja, ispravite podatke u `instalirani_uredaji` ili dodajte naljepnice na te uređaje prve.
11. Nakon mjesec dana pošaljite kratki podsjetnik s linkom klijentima koji još nisu podnijeli nijednu prijavu.

## Prijedlozi naslova newslettera
- Kvar uređaja prijavite za dvije minute
- Novo: servisna prijava iz mobitela
- Skenirajte, snimite, gotovo: nova servisna prijava

## Rizici i što pratiti
- **Poslovne domene u portalu:** prijave s poslovne adrese vidi cijela tvrtka (ista domena). To je očekivano za tvrtke, ali upozorite klijente (piše u uputi).
- **Lažne ili slučajne prijave:** zaštita je potvrda e-mailom i ograničenje od 5 prijava po IP adresi na sat. Ako se pojave zloupotrebe, razmislite o CAPTCHA-i.
- **Neprepoznati S/N:** prijava ide s ručnim opisom i oznakom u Telegramu, a servis povezuje uređaj ručno. Nema admin ekrana za to, pa pratite broj takvih prijava.
- **Dostava e-maila:** verifikacijski e-mail je jedini korak kojim klijent potvrđuje prijavu. Ako završi u spamu, prijava „nestaje“. Zato uputa i newsletter to spominju.
