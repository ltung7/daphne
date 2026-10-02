export function sortByTimestamp(data: any): any {
	if (
		Array.isArray(data) &&
		data.length > 1 &&
		typeof data[0] === 'object' &&
		data[0] !== null &&
		typeof data[0].timestamp === 'number'
	) {
		return data.sort((a: any, b: any) => b.timestamp - a.timestamp);
	}

	return data;
}
