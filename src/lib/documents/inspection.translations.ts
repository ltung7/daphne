export const inspectionTranslations: Record<string, DocumentGenerator.InspectionDocumentTranslations> = {
    pl: {
        title: 'PROTOKÓŁ PRZEGLĄDU POJAZDU',
        dailySubtitle: 'Przegląd Codzienny',
        monthlySubtitle: 'Przegląd Miesięczny',

        section1Header: '1. IDENTYFIKACJA',
        registrationNumber: 'Nr rejestracyjny',
        driver: 'Kierowca',
        date: 'Data i godzina',
        uploader: 'Osoba przeprowadzająca',
        type: 'Typ przeglądu',

        section2Header: '2. LISTA KONTROLNA',
        checklistItemPass: 'OK',
        checklistItemFail: 'Usterka',
        checklistItemNa: 'N/D',
        dailyCategory: 'Codzienne',
        monthlyCategory: 'Miesięczne',

        // Daily inspection items
        daily_tires: 'Opony (ciśnienie, bieżnik, stan boków)',
        daily_cleanliness: 'Czystość (wnętrze, nadwozie, szyby)',
        daily_lost_property: 'Rzeczy zgubione / znalezione',
        daily_dashboard_alerts: 'Ostrzeżenia na desce rozdzielczej',

        // Monthly inspection items
        monthly_lighting: 'Oświetlenie (światła, kierunkowskazy, hamowanie, cofanie)',
        monthly_safety_gear: 'Wyp. bezpieczeństwa (gaśnica, trójkąt, kamizelka, apteczka)',
        monthly_fluids: 'Płyny eksploatacyjne (olej, chłodnicza, hamulcowa, myjąca)',
        monthly_brakes: 'Układ hamulcowy (skuteczność, rączka, ciśnienie)',
        monthly_documentation: 'Dokumentacja (dowód rejestr., OC, przegląd techn., licencja)',

        // Image categories
        photo_dashboard: 'Deska rozdzielcza',
        photo_front: 'Przód pojazdu',
        photo_rear: 'Tył pojazdu',
        photo_left_side: 'Lewa strona',
        photo_right_side: 'Prawa strona',

        section3Header: '3. DOKUMENTACJA FOTOGRAFICZNA',
        imagesAttachment: 'Do protokołu dołączono zdjęcia dokumentujące stan pojazdu',
        imagesAttachmentHeader: 'ZAŁĄCZNIK FOTOGRAFICZNY DO PROTOKÓŁU PRZEGLĄDU',
        imagesAttachmentText: 'Sporządzony w dniu: {date}. Pojazd: {registrationNumber}. Kierowca: {driver}.',
        imageNumer: 'Zdjęcie nr {i}',

        signatureInspector: 'Podpis kontrolującego',
        signatureDriver: 'Podpis kierowcy (opcjonalnie)',
    },
    en: {
        title: 'VEHICLE INSPECTION REPORT',
        dailySubtitle: 'Daily Inspection',
        monthlySubtitle: 'Monthly Inspection',

        section1Header: '1. IDENTIFICATION',
        registrationNumber: 'Registration Number',
        driver: 'Driver',
        date: 'Date & Time',
        uploader: 'Inspector',
        type: 'Inspection Type',

        section2Header: '2. CHECKLIST',
        checklistItemPass: 'OK',
        checklistItemFail: 'Defect',
        checklistItemNa: 'N/A',
        dailyCategory: 'Daily',
        monthlyCategory: 'Monthly',

        // Daily inspection items
        daily_tires: 'Tires (pressure, tread, sidewall condition)',
        daily_cleanliness: 'Cleanliness (interior, body, windows)',
        daily_lost_property: 'Lost / found property',
        daily_dashboard_alerts: 'Dashboard warning lights',

        // Monthly inspection items
        monthly_lighting: 'Lighting (headlights, indicators, brake, reverse)',
        monthly_safety_gear: 'Safety equipment (extinguisher, triangle, vest, first aid)',
        monthly_fluids: 'Fluids (oil, coolant, brake, washer)',
        monthly_brakes: 'Brakes (effectiveness, handbrake, pressure)',
        monthly_documentation: 'Documentation (registration, insurance, tech inspection, license)',

        // Image categories
        photo_dashboard: 'Dashboard',
        photo_front: 'Front of vehicle',
        photo_rear: 'Rear of vehicle',
        photo_left_side: 'Left side',
        photo_right_side: 'Right side',

        section3Header: '3. PHOTOGRAPHIC DOCUMENTATION',
        imagesAttachment: 'Photographs documenting vehicle condition are attached to this report',
        imagesAttachmentHeader: 'PHOTOGRAPHIC APPENDIX TO INSPECTION REPORT',
        imagesAttachmentText: 'Prepared on: {date}. Vehicle: {registrationNumber}. Driver: {driver}.',
        imageNumer: 'Photo #{i}',

        signatureInspector: 'Inspector signature',
        signatureDriver: 'Driver signature (optional)',
    }
};

export default inspectionTranslations;