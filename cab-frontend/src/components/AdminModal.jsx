import { useEffect } from "react";

function AdminModal({ title, onClose, children, wide = false }) {
    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [onClose]);

    return (
        <div className="admin-modal-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <section className={`admin-modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
                <header className="admin-modal-header">
                    <h2>{title}</h2>
                    <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close dialog">×</button>
                </header>
                {children}
            </section>
        </div>
    );
}

export default AdminModal;
