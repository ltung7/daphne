import { join } from 'path';
import htmlToPdfmake from 'html-to-pdfmake';
import { parseHTML } from 'linkedom'; // Pure JS browser emulator
import { createRequire } from 'module';

// 1. Environment-safe require resolution
let safeRequire;
if (typeof require !== 'undefined') {
    // Production (CommonJS / Google App Engine compiled state)
    safeRequire = require;
} else if (typeof import.meta !== 'undefined' && import.meta.url) {
    // Local Development (Native ES Modules / Vite Dev Server)
    safeRequire = createRequire(import.meta.url);
} else {
    throw new Error('Unable to resolve a module loading mechanism (require or import.meta).');
}

const projectRoot = process.cwd();

// 2. Safely load pdfmake using our resolved require function
const pdfmake = safeRequire('pdfmake'); // singleton instance, not a constructor

const fontsDir = join(projectRoot, 'data');
pdfmake.setLocalAccessPolicy((filePath: string) => filePath.startsWith(fontsDir));
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.addFonts({
    Roboto: {
        normal: join(fontsDir, 'Roboto-Regular.ttf'),
        bold: join(fontsDir, 'Roboto-Medium.ttf'),
        italics: join(fontsDir, 'Roboto-Italic.ttf'),
        bolditalics: join(fontsDir, 'Roboto-MediumItalic.ttf'),
    }
});

export function docDefinitionToBuffer(docDefinition: ExplicitAnyToExtend): Promise<Buffer> {
    return pdfmake.createPdf(docDefinition).getBuffer();
}

export const convertHtmlToPdf = (htmlString: string) => {
    const { window } = parseHTML(htmlString);

    // 2. CRITICAL STEP: Convert raw HTML strings into a pdfmake-readable object structure
    const convertedContent = htmlToPdfmake(htmlString, { window: window as any });

    // 3. Insert the structured objects into your document definition
    const docDefinition = {
        content: [
            convertedContent
        ]
    };
    return docDefinitionToBuffer(docDefinition)
}