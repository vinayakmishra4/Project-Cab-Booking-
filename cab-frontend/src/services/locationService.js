export const searchLocations = async (query, signal) => {
    const params = new URLSearchParams({
        bbox: "68.0,6.0,98.0,38.0",
        lang: "en",
        limit: "50",
        q: query
    });
    const response = await fetch(
        `https://photon.komoot.io/api/?${params.toString()}`,
        { signal }
    );

    if (!response.ok) {
        throw new Error(`Location search failed (HTTP ${response.status}).`);
    }

    const data = await response.json();
    if (!Array.isArray(data.features)) {
        throw new Error("Location search returned an invalid response.");
    }

    const normalizedQuery = query.trim().toLocaleLowerCase();
    const locations = data.features
        .filter((feature) => feature.properties?.countrycode?.toUpperCase() === "IN")
        .map((feature) => {
            const properties = feature.properties;
            const coordinates = feature.geometry?.coordinates;
            const parts = [
                properties.name,
                properties.housenumber && properties.street
                    ? `${properties.housenumber} ${properties.street}`
                    : properties.street,
                properties.suburb,
                properties.district,
                properties.city,
                properties.state,
                properties.postcode,
                properties.country
            ].filter(Boolean);

            return {
                location: {
                    label: [...new Set(parts)].join(", "),
                    lat: Number(coordinates?.[1]),
                    lng: Number(coordinates?.[0])
                },
                matchesName: [properties.name, properties.brand, properties.operator]
                    .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery))
            };
        })
        .filter(({ location }) => location.label && Number.isFinite(location.lat) && Number.isFinite(location.lng));
    const namedMatches = locations.filter((entry) => entry.matchesName);
    const relevantLocations = namedMatches.length > 0 ? namedMatches : locations;

    return [...new Map(
        relevantLocations.map(({ location }) => [location.label.toLocaleLowerCase(), location])
    ).values()];
};
