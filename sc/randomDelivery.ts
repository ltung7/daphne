import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fakerPL as faker } from '@faker-js/faker';
import inspect from './inspect.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SelectedPickupPoint {
    id: string;
    name: string;
    address: string; 
}

interface DeliveryDetails {
    point?: SelectedPickupPoint;
    cod?: boolean;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    zipCode: string;
    city: string;
    address: string;
    deliveryCost: number;
}

const generateEmail = (firstName: string, lastName: string): string => {
    const domains = [ 'gmail.com', 'wp.pl', 'onet.pl', 'o2.pl', 'interia.pl' ];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    // Normalize: remove accents (ą -> a, ł -> l) and non-alphabetic chars
    const f = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, '');
    const l = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, '');
    
    const patterns = [
        `${f}.${l}`,
        `${f}${l}`,
        `${f.charAt(0)}${l}`,
        `${f}${l.charAt(0)}`,
        `${l}.${f}`,
    ];

    let base = patterns[Math.floor(Math.random() * patterns.length)];
    
    if (Math.random() < 0.4) {
        const suffix = Math.random() > 0.5 ? faker.date.birthdate().getFullYear() : Math.floor(Math.random() * 100);
        base += suffix;
    }

    return `${base}@${domain}`;
};

const generateData = (count: number): DeliveryDetails[] => {
    return Array.from({ length: count }, () => {
        // Pick a random sex for consistency (Polish surnames often have gendered endings like -ska/-ski)
        const sex = faker.person.sexType();
        const firstName = faker.person.firstName(sex);
        const lastName = faker.person.lastName(sex);
        
        return {
            firstName,
            lastName,
            email: generateEmail(firstName, lastName),
            phone: faker.phone.number({ style: 'human' }), 
            zipCode: faker.location.zipCode(),
            city: faker.location.city(),
            address: `${faker.location.street()} ${faker.location.buildingNumber()}`,
            deliveryCost: 0,
        };
    });
};

const outputDir = path.join(__dirname, '..', 'static');
const filePath = path.join(outputDir, 'delivery.json');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const data = generateData(100);

try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    inspect(`✅ Success! 100 gender-consistent Polish records saved to: ${filePath}`);
} catch (error) {
    inspect('❌ Failed to write file:');
    inspect(error);
}