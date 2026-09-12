import axios from "axios";
import { env } from "$env/dynamic/private";
import { logger } from "$lib/utils/logger";

const SYSTEM_PROMPT = `You are a vehicle data expert for a Polish fleet management system. Given a user query describing a vehicle (e.g., "plugin hybryd toyota corolla 2023"), return a JSON object matching the Vehicle.Type schema.

Rules:
- id: "" (default, empty string)
- name: Specific model identifier with year, body type, trim - only discerning info (e.g., "Corolla 2023 Sedan PHEV")
- makeModel: General make and model only (e.g., "Toyota Corolla")
- fuelType: Map to one of: gas, hybrid, electric, phev, mhev, diesel, cng, hybrid-gas, mhev-diesel, ethanol, hybrid-diesel, lpg, hydrogen
- transmission: manual, automatic, cvt, semi-automatic, dual-clutch (default automatic for modern cars)
- requiredDrivingLicense: B for passenger cars, adjust for other vehicle types
- image: "" (default, empty string)
- seats: Typical seat count including driver (usually 5 for sedans/hatchbacks, 7 for SUVs/minivans)
- premium: true if vehicle qualifies for Bolt Premium (luxury brands, high-end trims)
- xl: true if vehicle qualifies for Bolt XL (7+ seats, large SUVs/minivans)
- eco: true if vehicle qualifies for Bolt Green/Eco (electric, PHEV, hybrid)
- foodDelivery: false (default)
- notes: Always include "AI generated" plus any relevant details

If uncertain about any field, use sensible defaults or leave empty string/false. Prefer the most common version of the model  that match description.`;

export const getVehicleTypeFromQuery = async (query: string): Promise<Vehicle.Type | null> => {
	const apiKey = env.OPENROUTER_API_KEY;

	if (!apiKey) {
		throw new Error('OPENROUTER_API_KEY environment variable is missing.');
	}

	try {
		const response = await axios.post(
			'https://openrouter.ai/api/v1/chat/completions',
			{
				model: 'openrouter/free',
				messages: [
					{ role: 'system', content: SYSTEM_PROMPT },
					{ role: 'user', content: query }
				],
				temperature: 0.2,
				response_format: { type: 'json_object' }
			},
			{
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
					'X-Title': 'Fleet Vehicle Type Generator'
				}
			}
		);

		const rawContent = response.data.choices[0]?.message?.content;
		if (!rawContent) {
			logger.error('Empty response from OpenRouter for vehicle type query:', query);
			return null;
		}

		const parsed = JSON.parse(rawContent) as Vehicle.Type;
		logger.log(`Generated vehicle type for query "${query}" using model: ${response.data.model}`);
		return parsed;
	} catch (error) {
		logger.error('Failed to get vehicle type from OpenRouter:', error);
		return null;
	}
};