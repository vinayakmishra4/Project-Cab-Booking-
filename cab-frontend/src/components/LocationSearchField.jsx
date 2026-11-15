import { useEffect, useId, useState } from "react";
import { searchLocations } from "../services/locationService";

function LocationSearchField({
    label,
    value,
    selected = false,
    onChange,
    onSelect,
    placeholder,
    inputClassName = "",
    wrapperClassName = "",
    markerClassName = "",
    disabled = false
}) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);
    const listId = useId();

    useEffect(() => {
        const query = value.trim();
        if (selected || query.length < 3) {
            setSuggestions([]);
            setLoading(false);
            setError("");
            setIsOpen(false);
            return undefined;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            setLoading(true);
            setError("");
            try {
                const results = await searchLocations(query, controller.signal);
                setSuggestions(results);
                setActiveIndex(-1);
                setIsOpen(true);
                if (results.length === 0) setError("No matching places found. Try a nearby landmark or a more specific name.");
            } catch (searchError) {
                if (searchError.name !== "AbortError") {
                    setSuggestions([]);
                    setIsOpen(true);
                    setError(searchError.message || "Could not search locations. Check your internet connection and try again.");
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 400);

        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [value, selected]);

    const selectLocation = (location) => {
        onSelect(location);
        setSuggestions([]);
        setError("");
        setActiveIndex(-1);
        setIsOpen(false);
    };

    const handleKeyDown = (event) => {
        if (event.key === "ArrowDown" && suggestions.length) {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((index) => (index + 1) % suggestions.length);
        } else if (event.key === "ArrowUp" && suggestions.length) {
            event.preventDefault();
            setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
        } else if (event.key === "Enter" && isOpen && suggestions.length) {
            event.preventDefault();
            selectLocation(suggestions[activeIndex >= 0 ? activeIndex : 0]);
        } else if (event.key === "Escape") {
            setIsOpen(false);
        }
    };

    const activeOption = activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined;

    return (
        <div className={`location-search-field ${wrapperClassName}`}>
            <div className={inputClassName}>
                {markerClassName && <span className={`location-dot ${markerClassName}`} aria-hidden="true"></span>}
                <input
                    className="form-control"
                    type="text"
                    disabled={disabled}
                    role="combobox"
                    aria-label={label}
                    aria-autocomplete="list"
                    aria-expanded={isOpen && suggestions.length > 0}
                    aria-controls={listId}
                    aria-activedescendant={activeOption}
                    autoComplete="off"
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) => {
                        onChange(event.target.value);
                        setSuggestions([]);
                        setError("");
                        setActiveIndex(-1);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (suggestions.length) setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                />
            </div>
            {isOpen && (loading || error || suggestions.length > 0) && (
                <div className="location-search-results">
                    {loading && <p className="location-search-message" role="status">Searching locations…</p>}
                    {!loading && error && <p className="location-search-message location-search-error" role="status">{error}</p>}
                    {!loading && suggestions.length > 0 && (
                        <>
                            <ul id={listId} role="listbox" aria-label={`${label} suggestions`}>
                                {suggestions.map((location, index) => (
                                    <li key={`${location.lat}-${location.lng}-${location.label}`} role="presentation">
                                        <button
                                            id={`${listId}-option-${index}`}
                                            type="button"
                                            role="option"
                                            aria-selected={activeIndex === index}
                                            className={activeIndex === index ? "active" : ""}
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => selectLocation(location)}
                                        >
                                            <span className="location-suggestion-pin" aria-hidden="true">⌖</span>
                                            <span>{location.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <p className="location-search-attribution">Search by Photon · © OpenStreetMap contributors</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default LocationSearchField;
