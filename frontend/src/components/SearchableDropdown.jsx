import { useEffect, useState } from "react";

const SearchableDropdown = ({ options, value, onChange, placeholder = "Select..." }) => {
    const [search, setSearch] = useState("");

    const [showDropdown, setShowDropdown] = useState(false);

    // 🆕 Sync search state when parent resets value
    useEffect(() => {
        setSearch(value || "");  // fallback to empty string
    }, [value]);

    const filtered = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val) => {
        onChange(val);
        setSearch(val);
        setShowDropdown(false);
    };

    return (
        <div className="position-relative">
            <input
                type="text"
                className="form-control"
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />

            {showDropdown && (
                <ul className="list-group position-absolute w-100" style={{ maxHeight: "200px", overflowY: "auto" , zIndex: 9999999}}>
                    {filtered.length === 0 ? (
                        <li className="list-group-item text-muted">No results</li>
                    ) : (
                        filtered.map((opt, idx) => (
                            <li
                                key={idx}
                                className="list-group-item list-group-item-action"
                                onMouseDown={() => handleSelect(opt)}
                                style={{ cursor: "pointer" }}
                            >
                                {opt}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default SearchableDropdown;
