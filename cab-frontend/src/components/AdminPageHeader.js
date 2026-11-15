function AdminPageHeader({ eyebrow = "TRANSPORT MANAGEMENT", title, description, actions }) {
    return (
        <section className="admin-welcome admin-page-welcome">
            <div>
                <p className="eyebrow">{eyebrow}</p>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {actions && <div className="admin-page-actions">{actions}</div>}
        </section>
    );
}

export default AdminPageHeader;
