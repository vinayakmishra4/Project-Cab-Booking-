function AdminPagination({ page, pageCount, total, pageSize, onPageChange }) {
    if (total <= pageSize) return null;
    return (
        <div className="admin-pagination" aria-label="Table pagination">
            <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
            <div>
                <button type="button" className="btn btn-outline-secondary admin-secondary-button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Previous</button>
                <span>Page {page} of {pageCount}</span>
                <button type="button" className="btn btn-outline-secondary admin-secondary-button" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>Next</button>
            </div>
        </div>
    );
}

export default AdminPagination;
