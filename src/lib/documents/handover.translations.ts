export const handoverTranslations: Record<string, DocumentGenerator.HandoverDocumentTranslations> = {
    pl: {
        title: 'PROTOKÓŁ ZDAWCZO-ODBIORCZY',
        handoverSubtitle: 'Wydanie pojazdu',
        returnSubtitle: 'Zwrot pojazdu',
        unilateralSubtitle: 'Jednostronne przejęcie pojazdu',
        recoveryLocation: 'Dokładne miejsce odzyskania pojazdu (adres/opis)',
        witness: 'Świadek odbioru (Imię i Nazwisko)',
        reasonForRecovery: 'Powód jednostronnego przejęcia', // np. brak kontaktu, koniec umowy, porzucenie

        section1Header: '1. DATA I STRONY UMOWY',
        place: 'Miejsce',
        date: 'Data',
        manager: 'Przekazujący',
        retriever: 'Menedżer floty (Przejmujący)',
        driver: 'Odbierający',

        section2Header: '2. POJAZD I STAN LICZNIKA',
        model: 'Marka i model',
        plate: 'Nr rejestracyjny',
        mileage: 'Przebieg [km]',
        fuel: 'Poziom paliwa (%)',
        battery: 'Stan baterii (%)',

        section3Header: '3. WYPOSAŻENIE I DOKUMENTY FLOTOWE',
        equipmentKey: 'Kluczyk główny',
        equipmentSpareKey: 'Kluczyk zapasowy',
        equipmentRegistration: 'Dowód rejestracyjny',
        equipmentRoofSign: 'Lampa dachowa TAXI',
        equipmentTire: 'Koło zapasowe i zestaw naprawczy',
        equipmentFuelCard: 'Karta paliwowa',
        equipmentCarWashCard: 'Karta myjni',
        equipmentExtinguisher: 'Gaśnica',
        equipmentTriangle: 'Trójkąt ostrzegawczy',
        equipmentVest: 'Kamizelka odblaskowa',
        equipmentFirstAidKit: 'Apteczka',
        equipmentMats: 'Dywaniki',
        equipmentPhoneHolder: 'Uchwyt na telefon',
        equipmentPhoneCharger: 'Ładowarka samochodowa',

        section4Header: '4. STAN WIZUALNY, TECHNICZNY I UWAGI',
        section4Paragraph: 'Zarysowania, uszkodzenia powłoki lakierniczej, uszkodzenia szyb, uwagi do wnętrza',

        section5Header: '5. OŚWIADCZENIA I KLAUZULE KOŃCOWE',
        signatureDriver: 'Podpis przyjmującego',
        signatureManager: 'Podpis wydającego',
        signatureWitness: 'Podpis świadka',
        signatureRetriever: 'Podpis menadżera floty (Przejmujący)',

        imagesAttachment: 'Do protokołu dołączono Załącznik nr 1 – Dokumentację fotograficzną stanu pojazdu',
        imagesAttachmentHeader: 'ZAŁĄCZNIK NR 1 DO PROTOKOŁU ZDAWCZO-ODBIORCZEGO POJAZDU',
        imagesAttachmentText: 'Sporządzony w dniu: {date} w {place} Dotyczy pojazdu marki {model}, nr rejestracyjny: {registrationNumber}, nr VIN: {vin}.',
        imageNumer: 'Zdjęcie numer #{i}',

        handoverClauses: [
            'Odbierający potwierdza odbiór pojazdu wraz z wyposażeniem wymienionym w Sekcji 3, zapoznał się z jego stanem faktycznym i technicznym oraz nie wnosi zastrzeżeń poza uwagami wymienionymi w Sekcji 4.',
            'Pracownik przyjmuje pojazd z obowiązkiem zwrotu i potwierdza przyjęcie pełnej odpowiedzialności materialnej za powierzone mienie z obowiązkiem zwrotu zgodnie z art. 124 Kodeksu Pracy, na podstawie odrębnej umowy o odpowiedzialności materialnej.',
            'Zobowiązuje się do użytkowania pojazdu zgodnie z jego przeznaczeniem, przestrzegania przepisów ruchu drogowego oraz zwrotu pojazdu w stanie niepogorszonym ponad normalne zużycie eksploatacyjne, z takim samym poziomem paliwa / naładowania jak przy wydaniu.',
        ],
        returnClauses: [
            'Kierowca zwraca pojazd wraz z wyposażeniem wymienionym w Sekcji 3.',
            'Menedżer floty potwierdza odbiór pojazdu. Ewentualne braki, różnice w poziomie paliwa i naładowania oraz niezgodności w wyposażeniu i stanie wizualnym z Sekcji 4 zostaną ujęte w polu Uwagi i podlegają rozliczeniu finansowemu.',
            'Z dniem podpisania niniejszego protokołu zwrotu ustaje odpowiedzialność materialna Pracownika za powierzone mienie, z zastrzeżeniem odpowiedzialności za szkody i braki stwierdzone przy zwrocie oraz szkody ukryte ujawnione w toku weryfikacji.',
        ],
        unilateralClauses: [
            'Pojazd został przejęty jednostronnie przez Menedżera floty z powodu braku zwrotu pojazdu przez Kierowcę w wyznaczonym terminie.',
            'Odbiór pojazdu oraz weryfikacja jego stanu nastąpiły komisyjnie, w obecności wyżej wymienionego Świadka. Świadek potwierdza własnoręcznym podpisem zgodność wpisów w Sekcjach 2, 3 i 4 ze stanem faktycznym w momencie otwarcia pojazdu.',
            'Rzeczy osobiste należące do Kierowcy znajdujące się we wnętrzu pojazdu: [ ] Brak / [ ] Znaleziono i zabezpieczono (szczegóły w odrębnym Protokole zabezpieczenia rzeczy).',
            'Brakujące elementy wyposażenia (w tym np. kluczyk główny, dowód rejestracyjny), których Kierowca nie zwrócił, oraz ewentualne uszkodzenia nieudokumentowane przy wydaniu pojazdu, zostaną wycenione i będą podlegać rozliczeniu finansowemu lub procedurze windykacyjnej.',
        ],
    },
    en: {
        title: 'HANDOVER AND ACCEPTANCE FORM',
        handoverSubtitle: 'Handover of Vehicle',
        returnSubtitle: 'Return of Vehicle',
        unilateralSubtitle: 'Unilateral Acquisition of Vehicle',
        recoveryLocation: 'Exact location of vehicle recovery (address/description)',
        witness: 'Recovery witness (Name and Surname)',
        reasonForRecovery: 'Reason for unilateral acquisition', // e.g., no contact, contract ended, abandonment

        section1Header: '1. DATE & PARTIES',
        place: 'Place',
        date: 'Date',
        manager: 'Fleet manager',
        retriever: 'Fleet manager (Recipient)',
        driver: 'Driver',

        section2Header: '2. VEHICLE & MILEAGE',
        model: 'Make & Model',
        plate: 'Plate No',
        mileage: 'Mileage',
        fuel: 'Fuel level (%)',
        battery: 'Battery level (%)',

        section3Header: '3. EQUIPMENT & FLEET DOCUMENTS',
        equipmentKey: 'Primary key',
        equipmentSpareKey: 'Spare key',
        equipmentRegistration: 'Registration certificate',
        equipmentRoofSign: 'TAXI roof sign',
        equipmentTire: 'Spare tire and repair kit',
        equipmentFuelCard: 'Fuel card',
        equipmentCarWashCard: 'Car wash card',
        equipmentExtinguisher: 'Fire extinguisher',
        equipmentTriangle: 'Warning triangle',
        equipmentVest: 'High-visibility vest',
        equipmentFirstAidKit: 'First aid kit',
        equipmentMats: 'Floor mats',
        equipmentPhoneHolder: 'Phone holder',
        equipmentPhoneCharger: 'Car charger',

        section4Header: '4. VISUAL AND TECHNICAL CONDITION AND NOTES',
        section4Paragraph: 'Scratches, paintwork damage, glass damage, interior remarks:',

        section5Header: '5. STATEMENTS AND FINAL CLAUSES',

        imagesAttachment: 'Appendix No. 1 – Photographic documentation of the vehicle\'s condition is attached to the report.',
        imagesAttachmentHeader: 'Appendix No. 1 to the vehicle handover report.',
        imagesAttachmentText: 'Prepared on: {date} at {place}. Applies to vehicle brand {model}, registration number: {registrationNumber}, VIN number: {vin}.',
        imageNumer: 'Photo number ',

        handoverClauses: [
            'The Recipient confirms receipt of the vehicle with equipment listed in Section 3, has familiarized himself with its actual and technical condition and raises no objections except those listed in Section 4.',
            'The Employee accepts the vehicle with obligation to return and confirms full material responsibility for entrusted property in accordance with Art. 124 of the Polish Labour Code, based on a separate material responsibility agreement.',
            'Undertakes to use the vehicle as intended, comply with traffic regulations and return it in a condition not worsened beyond normal operational wear, with the same fuel / battery level as at handover.',
        ],
        returnClauses: [
            'The driver returns the vehicle with the equipment listed in Section 3.',
            'The fleet manager confirms receipt of the vehicle. Any missing items, differences in fuel and charge levels, and discrepancies in equipment and visual condition from Section 4 will be recorded in the Remarks field and are subject to financial settlement.',
            'On the date of signing this return report, the Employee\'s financial liability for the entrusted property ceases, subject to liability for damage and shortages identified upon return and hidden damage revealed during verification.',
        ],
        unilateralClauses: [
            'The vehicle was unilaterally acquired by the Fleet Manager due to the driver\'s failure to return the vehicle within the specified timeframe.',
            'The vehicle pickup and verification of its condition were conducted jointly in the presence of the aforementioned Witness. The Witness confirms by handwritten signature that the entries in Sections 2, 3, and 4 match the actual condition at the time of vehicle opening.',
            'Personal items belonging to the Driver found in the vehicle interior: [ ] None / [ ] Found and secured (details in a separate Property Securing Protocol).',
            'Missing equipment items (including e.g. the primary key, registration certificate) that the Driver failed to return, and any undocumented damages present at vehicle handover, will be assessed and will be subject to financial settlement or debt collection procedures.',
        ],

        signatureDriver: 'Driver',
        signatureManager: 'Fleet Manager',
        signatureWitness: 'Witness',
        signatureRetriever: 'Fleet Manager (Recipient)',
    }
};

export default handoverTranslations;