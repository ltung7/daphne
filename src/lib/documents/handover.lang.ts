// Translations for the Vehicle Handover and Acceptance protocol document.
// Flat structure: one key per piece of text, mirroring the fields used
// in the document template. Add more locales by adding another key
// to the `translations` record.

interface DocumentTranslations {
    title: string
    handoverSubtitle: string
    returnSubtitle: string
    unilateralSubtitle: string
    recoveryLocation: string
    witness: string
    reasonForRecovery: string
    section1Header: string
    place: string
    date: string
    manager: string
    retriever: string
    driver: string
    section2Header: string
    model: string
    plate: string
    mileage: string
    fuel: string
    battery: string
    section3Header: string
    equipmentKey: string
    equipmentSpareKey: string
    equipmentRegistration: string
    equipmentRoofSign: string
    equipmentTire: string
    equipmentFuelCard: string
    equipmentCarWashCard: string
    equipmentExtinguisher: string
    equipmentTriangle: string
    equipmentVest: string
    equipmentFirstAidKit: string
    equipmentMats: string
    equipmentPhoneHolder: string
    equipmentPhoneCharger: string
    section4Header: string
    section4Paragraph: string
    section5Header: string
    handoverClauses: string[]
    returnClauses: string[]
    unilateralClauses: string[]
    signatureDriver: string
    signatureManager: string
    signatureWitness: string
    signatureRetriever: string
}


export const translations: Record<DocumentGenerator.Locale, DocumentTranslations> = {
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

        signatureDriver: 'Podpis przyjmującego',
        signatureManager: 'Podpis wydającego',
        signatureWitness: 'Podpis świadka',
        signatureRetriever: 'Podpis menadżera floty (Przejmujący)',
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
    },
    uk: {
        title: 'ПРОТОКОЛ ОБРОБКИ ТА ПРИЙМАННЯ',
        handoverSubtitle: 'Передача транспортного засобу',
        returnSubtitle: 'Повернення транспортного засобу',
        unilateralSubtitle: 'Одностороннє прийняття транспортного засобу',
        recoveryLocation: 'Точне місце озбрання транспортного засобу (адреса/опис)',
        witness: 'Свідок прийому (Ім’я та прізвище)',
        reasonForRecovery: 'Причина одностороннього прийняття', // напр. відсутність контакту, кінець контракту, підкинення

        section1Header: '1. ДАТА ТА СТОРІНКИ',
        place: 'Місце',
        date: 'Дата',
        manager: 'Передавник',
        retriever: 'Менеджер флоти (Приймаючий)',
        driver: 'Отримувач',

        section2Header: '2. ТРАНСПОРТНИЙ ЗАСІБ ТА ОДОМЕТР',
        model: 'Марка та модель',
        plate: 'Реєстраційний номер',
        mileage: 'Пробіг [км]',
        fuel: 'Рівень палива (%)',
        battery: 'Рівень заряду акумулятора (%)',

        section3Header: '3. ОБЛАДНАННЯ ТА ДОКУМЕНТИ АВТОПАРКУ',
        equipmentKey: 'Головний ключ',
        equipmentSpareKey: 'Запасний ключ',
        equipmentRegistration: 'Свідоцтво про реєстрацію',
        equipmentRoofSign: 'Ліхтар на даху ТАКСІ',
        equipmentTire: 'Запасне колесо / ремкомплект',
        equipmentFuelCard: 'Паливна картка',
        equipmentCarWashCard: 'Картка автомийки',
        equipmentExtinguisher: 'Вогнегасник',
        equipmentTriangle: 'Знак аварійної зупинки',
        equipmentVest: 'Світловідбивальний жилет',
        equipmentFirstAidKit: 'Аптечка першої допомоги',
        equipmentMats: 'Килимки на підлогу',
        equipmentPhoneHolder: 'Тримач для телефону',
        equipmentPhoneCharger: 'Зарядка авто',

        section4Header: '4. ВІЗУАЛЬНИЙ ТА ТЕХНІЧНИЙ СТАН ТА КОМЕНТАРІ',
        section4Paragraph: 'Подряпини, пошкодження лакофарбового покриття, пошкодження вікон, коментарі до салону:',

        section5Header: '5. ОБІРНІ ТА ЗАВЕРШУВАЮЧІ КЛАУЗУЛИ',
        handoverClauses: [
            'Особа, яка отримує транспортний засіб, підтверджує отримання транспортного засобу з обладнанням, переліченим у Розділі 3, ознайомилася з його фактичним і технічним станом і не висуває жодних заперечень, окрім зауважень, перелічених у Розділі 4.',
            'Працівник приймає транспортний засіб із зобов\'язанням повернути його та підтверджує прийняття повної фінансової відповідальності за довірене майно із зобов\'язанням повернути його відповідно до ст. 124 Трудового кодексу, на підставі окремої угоди про фінансову відповідальність.',
            'Я зобов\'язуюся використовувати транспортний засіб відповідно до його цільового призначення, дотримуватися правил дорожнього руху та повернути транспортний засіб у стані, що не погіршився понад нормальний знос, з тим самим рівнем пального/ заряду, як приді під час передачі.',
        ],
        returnClauses: [
            'Водій повертає транспортний засіб з обладнанням, переліченим у Розділі 3.',
            'Керівник автопарку підтверджує отримання транспортного засобу. Будь-які відсутні предмети, різниця в рівнях палива та заряду, а також розбіжності в обладнанні та візуальному стані з Розділу 4 будуть зафіксовані в полі «Примітки» та підлягають фінансовому врегулюванню.',
            'З дати підписання цього акту повернення фінансова відповідальність Працівника за довірене майно припиняється, з урахуванням відповідальності за пошкодження та недахопи, виявлені під час повернення, та приховані пошкодження, виявлені під час перевірки.',
        ],
        unilateralClauses: [
            'Транспортний засіб був односторонньо прийнятий Менеджером флоти через відсутність відпричинення транспортного засобу від Драйвера у визначений термін.',
            'Прийом транспортного засобу та верифікація його стану відбулися комісивно, у присутності вищевикладеного Свідка. Свідок підтверджує шістьнавечним підписом збігсясть записів у Розділах 2, 3 і 4 із фактичним станом у момент відкриття транспортного засобу.',
            'Речі особисті, належні Драйверу, що знаходяться усередині транспортного засобу: [ ] Немає / [ ] Знайдено і узбережено (деталі у окремому Протоколі узбереження речей).',
            'Відсутні елементи обладнання (накрийм ключ, свідоцтво про реєстрацію), яких Драйвер не повернув, а також можливі пошкодження, не задокументовані під час видачі транспортного засобу, будуть оцінені та підлягають фінансовому врегулюванню або процедурі відбору.',
        ],

        signatureDriver: 'Приймаюча сторона - Водій',
        signatureManager: 'Передаюча сторона',
        signatureWitness: 'Підпис свідка',
        signatureRetriever: 'Підпис менеджера флоти (Приймаючий)',
    },
    be: {
        title: 'АКТ ПРЫЁМУ-ПЕРАДАЧЫ',
        handoverSubtitle: 'Перадача транспартнага сродку',
        returnSubtitle: 'Вяртанне транспартнага сродку',
        unilateralSubtitle: 'Адностраонная адзыменаіца транспартнага сродку',
        recoveryLocation: 'Дакладныя месца вызначэння транспартнага сродку (адрас/апіс)',
        witness: 'Свядок Прыймае (Імя і прозвішча)',
        reasonForRecovery: 'Прычына адностраоннай адзымены', // напр. несязможнасць зьвязі, на канец угоды, адлягчэнне

        section1Header: '1. ДАТА І БАКІ',
        place: 'Месца:',
        date: 'Дата:',
        manager: 'Той, хто перадае:',
        retriever: 'Менеджар флоты (Прымае):',
        driver: 'Той, хто прымае:',

        section2Header: '2. ТРАНСПАРТНЫ СРОдак і ПАКАННЕ ЛІЧЫЛЬНІКA',
        model: 'Марка і мадэль:',
        plate: 'Рэгістрацыйны нумар',
        mileage: 'Прабег [км]',
        fuel: 'Узроўнень паліва (%)',
        battery: 'Стан батарэі (%)',

        section3Header: '3. АБСТАЛЯВАННЕ І ФЛОЦКІЯ ДАКУМЕНТЫ',
        equipmentKey: 'Асноўны ключ',
        equipmentSpareKey: 'Запасны ключ',
        equipmentRegistration: 'Пасведчанне аб рэгістрацыі',
        equipmentRoofSign: 'Ліхтар на даху TAXI',
        equipmentTire: 'Запасное кола і рамонтны камплект',
        equipmentFuelCard: 'Паліўная карта',
        equipmentCarWashCard: 'Карта мыйкі',
        equipmentExtinguisher: 'Вогнетушыцель',
        equipmentTriangle: 'Аварыйны знак',
        equipmentVest: 'Святлоадбівальная камізэлька',
        equipmentFirstAidKit: 'Аптэчка',
        equipmentMats: 'Дыванікі',
        equipmentPhoneHolder: 'Трымальнік для тэлефона',
        equipmentPhoneCharger: 'Аўтамабільная зарадка',

        section4Header: '4. ВІЗУАЛЬНЫ, ТЭХНІЧНЫ СТАН І ЗАЎВАГІ',
        section4Paragraph: 'Драпіны, пашкоджанні лакафарбавага пакрыцця, пашкоджанні шкла, заўвагі да салона:',

        section5Header: '5. ОБІРНЫЯ І СФАРМАВАЮЧЫЕ КЛАУЗУЛЫ',
        handoverClauses: [
            'Той, хто прымае, пацвярджае атрыманне транспартнага сродку разам з абсталяваннем, пералічаным у Раздзеле 3, азнаёміўся з яго фактычным і тэхнічным станам і не мае прэтэнзій, акрамя заўваг, указаных у Раздзеле 4.',
            'Супрацоўнік прымае транспартны сродак з абавязкам вяртання і пацвярджае прыняцце поўнай матэрыяльнай адказнасці за давераную маёмасць з абавязкам вяртання згодна з арт. 124 Працоўнага кодэкса, на падставе асобнай дамовы аб матэрыяльнай адказнасці.',
            'Абавязваецца выкарыстоўваць транспартны сродак у адпаведнасці з яго прызначэннення, выконваць правілы дарожнага руху і вярнуць транспартны сродак у стане, не пагоршаным звыш нармальнага эксплуатацыйнага зносу, з такім жа ўзроўнем паліва / зараду, як пры выдацы.',
        ],
        returnClauses: [
            'Кіроўца вяртае транспартны сродак з абсталяваннем, пералічаным у раздзеле 3.',
            'Кіраўнік аўтапарка пацвярджае атрыманне транспартнага сродку. Любыя адсутныя элементы, адрозненні ў ўзроўні паліва і зарадкі, а таксама адрозненні ў абсталяванні і візуальным стане з раздзела 4 будуць запісаны ў полі \'Заўвагі\' і падлягаюць фінансаваму ўрэгуляванню.',
            'З даты падпісання гэтага акта вяртання фінансавая адказнасць Супрацоўніка за давераную маёмасць спыняецца, з улікам адказнасці за пашкодженні і недахопы, выяўленыя пры вяртанні, і схаваныя пашкоджанні, выяўленыя падчас праверкі.',
        ],
        unilateralClauses: [
            'Транспартны сродак был адностраонна адзыменены Менеджарам флоты через немагчобнасць вярнуць транспартны сродак кіроўкі ў вызначаны тэрмін.',
            'Прыйом транспартнага сродку і правярае него стану адбыўся камісіўна, ў прэсутнасці вышэй згаданага Свядка. Свядок пацвярджае рукавітным падпісом згоднасць запісаў у Раздзелах 2, 3 і 4 з фактычным станам у момант адкрыцця транспартнага сродку.',
            'Рэчы асобісты, належычыя кіроўцы, якія знаходзяцца ўвнутры транспартнага сродку: [ ] Няма / [ ] Знойдзена і захаваная (дэталі ў адрозным Протаколе захавання рэчы).',
            'Адсутныя элементы абсталявання (на прыладжэнне, напрыклад, галоўны ключ, свідоцтво рэгістрацыі), якія кіроўца не вяртае, а таксама магчымыя пашкодженні, не дакументаваныя przy выдацы транспартнага сродку, будуць ацэнаваны і падлягаюць фінансаваму ўрэгуляванню ці працэдуре відбіру.',
        ],

        signatureDriver: 'Прымаючая сторона - Кіроўца',
        signatureManager: 'Перадаючая сторона',
        signatureWitness: 'Падпіс свядка',
        signatureRetriever: 'Падпіс менеджара флоты (Прымаючы)',
    },
    ne: {
        title: 'हस्तान्तरण मुचुल्का',
        handoverSubtitle: 'सवारी साधन हस्तान्तरण',
        returnSubtitle: 'सवारी साधन फिर्ता',
        unilateralSubtitle: 'एकैकार्यवादी सवारी साधन प्राप्ति',
        recoveryLocation: 'सवारी साधन रिकवरीको निश्चित स्थान (पहिले/विवरण)',
        witness: 'रिकवरी साक्षी (नाम र ठेका)',
        reasonForRecovery: 'एकैकार्यवादी प्राप्तिको कारण', // जस्तै: संपर्क अभयास, अनुबन्ध समाप्त, छोड्ना

        section1Header: '१. मिति र पक्षहरू',
        place: 'स्थान:',
        date: 'मिति:',
        manager: 'हस्तान्तरण गर्ने:',
        retriever: 'फ्लीट म्यानेजर (प्राप्तकर्ता):',
        driver: 'ग्रहण गर्ने:',

        section2Header: '२. सवारी साधन र मिटरको अवस्था',
        model: 'ब्रान्ड र मोडेल:',
        plate: 'दर्ता नम्बर',
        mileage: 'गुडेको दूरी [किमी]',
        fuel: 'इन्धनको स्तर (%)',
        battery: 'ब्याट्रीको अवस्था (%)',

        section3Header: '३. उपकरण र फ्लीट कागजातहरू',
        equipmentKey: 'मुख्य साँचो',
        equipmentSpareKey: 'जगेडा साँचो',
        equipmentRegistration: 'दर्ता प्रमाणपत्र',
        equipmentRoofSign: 'TAXI छत बत्ती',
        equipmentTire: 'जगेडा पाङ्ग्रा र मर्मत किट',
        equipmentFuelCard: 'इन्धन कार्ड',
        equipmentCarWashCard: 'कार धुलाई कार्ड',
        equipmentExtinguisher: 'अग्नि नियन्त्रक',
        equipmentTriangle: 'चेतावनी त्रिकोण',
        equipmentVest: 'रिफ्लेक्टिभ ज्याकेट',
        equipmentFirstAidKit: 'प्राथमिक उपचार बाकस',
        equipmentMats: 'फ्लोर म्याट',
        equipmentPhoneHolder: 'फोन होल्डर',
        equipmentPhoneCharger: 'कार चार्जर',

        section4Header: '४. दृश्य, प्राविधिक अवस्था र कैफियतहरू',
        section4Paragraph: 'खरोंचहरू, पेन्टको क्षति, सिसाको क्षति, भित्री भाग सम्बन्धी कैफियतहरू:',

        section5Header: '५. बयानहरू र अन्तिम क्लाजुलहरू',
        handoverClauses: [
            'ग्रहण गर्नेले खण्ड ३ मा उल्लेखित उपकरणहरू सहित सवारी साधन प्राप्त गरेको पुष्टि गर्दछ, यसको वास्तविक र प्राविधिक अवस्थासँग परिचित छ र खण्ड ४ मा उल्लेखित कैफियतहरू बाहेक कुनै आपत्ति जनाउँदैन।',
            'कर्मचारीले फिर्ता गर्ने दायित्व सहित सवारी साधन ग्रहण गर्दछ र छुट्टै भौतिक जिम्मेवारी सम्झौताको आधारमा श्रम संहिताको धारा १२४ अनुसार सुम्पिएको सम्पत्तिको लागि पूर्ण भौतिक जिम्मेवारी स्वीकार गरेको पुष्टि गर्दछ।',
            'ऊ/उनी सवारी साधनलाई यसको उद्देश्य अनुसार प्रयोग गर्न, ट्राफिक नियमहरूको पालना गर्न र सामान्य सञ्चालन खर्चभन्दा बढी नबिग्रिएको अवस्थामा, प्रदान गर्दाको बेलाको जस्तै इन्धन / चार्ज स्तर सहित सवारी साधन फिर्ता गर्न प्रतिबद्ध छ।',
        ],
        returnClauses: [
            'चालकले धारा ३ मा सूचीबद्ध उपकरणहरू सहित गाडी फिर्ता गर्दछ।',
            'फ्लीट प्रबन्धकले गाडीको प्राप्ति पुष्टि गर्दछ। धारा ४ बाट कुनै पनि हराएको वस्तु, इन्धन र चार्ज स्तरमा भिन्नता, र उपकरण र दृश्य अवस्थामा भिन्नताहरू टिप्पणी क्षेत्रमा रेकर्ड गरिनेछ र वित्तीय सम्झौताको अधीनमा छन्।',
            'यो फिर्ती रिपोर्टमा हस्ताक्षर गरेको मितिमा, सुम्पिएको सम्पत्तिको लागि कर्मचारीको वित्तीय दायित्व समाप्त हुन्छ, फिर्ता गर्दा पहिचान गरेको क्षति र अभाव र प्रमाणीकरणको क्रममा प्रकट भएको लुकेको क्षतिको दायित्वको अधीनमा।',
        ],
        unilateralClauses: [
            'सवारी साधनलाई दिग्गरको विफलताले व्यवस्थित समयमा फिर्ता नगर्ने कारणले एकैकार्यवादी रूपमा फ्लीट म्यानेजरले स्वीकार गरेको छ।',
            'सवारी साधनको स्वीकरण र अवस्थाको जाँच साक्षीको उपस्थितिमा एकत्रित रूपमा गरिएको छ। साक्षीले सेक्सनहरू २, ३, र ४ मा लिखित विवरणहरूको साथ सवारी साधनको खोल्ने समयमा अवस्थाको साझा एकतार गर्ने पुष्टि गर्दछ।',
            'सवारी साधनको भित्र रहेका दिग्गरका व्यक्तिगत वस्तुहरू: [ ] कुनै छैन / [ ] पाए र सुरक्षित गरियो (विवरणहरू अलग अभ्यंगक संरक्षण प्रोटोकलमा।)',
            'दिग्गरले नफराउने उपकरणहरू (जस्तै मुख्य साँचो, दर्ता प्रमाणपत्र), तथा फिर्ता दिएबाट अघि अनुपस्थित गएको व्यक्तिगत वस्तुहरू, र सवारी साधन प्रदान गर्दा दस्तावेजीकृत गएको ठूलो क्षतिहरूलाई मूल्यांकन गरी त्यसलाई वित्तीय समायोजन वा ऋण संकलन प्रक्रियामा लगाइनेछ।',
        ],

        signatureDriver: 'ग्रहण गर्ने - चालक',
        signatureManager: 'हस्तान्तरण गर्ने',
        signatureWitness: 'साक्षीको हस्ताक्षर',
        signatureRetriever: 'फ्लीट म्यानेजरको हस्ताक्षर (प्राप्तकर्ता)',
    }
};

export function fuseTranslations(
    primary: DocumentTranslations,
    secondary: DocumentTranslations,
    separator: string = ' / '
): DocumentTranslations {
    const result = {} as DocumentTranslations;

    for (const key of Object.keys(primary) as (keyof DocumentTranslations)[]) {
        const value = primary[key];

        if (Array.isArray(value)) {
            result[key] = [] as never;
            continue;
        }

        const sec = secondary[key];

        result[key] = (
            sec
                ? `${value}${separator}${sec}`
                : value
        ) as never;
    }

    return result;
}

export function getTranslations(
    locale?: DocumentGenerator.Locale
): DocumentTranslations {
    if (!locale || locale === 'pl') {
        return translations.pl
    }

    return fuseTranslations(translations.pl, translations[locale] ?? translations.en)
}