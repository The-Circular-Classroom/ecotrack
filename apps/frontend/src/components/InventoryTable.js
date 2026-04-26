// apps/frontend/src/components/InventoryTable.js
import { DataGrid } from '@mui/x-data-grid';

const STATUS_BADGE_CLASSES = {
    ForSale: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
    Sold: 'bg-red-50 text-red-700 border border-red-200',
    Donated: 'bg-green-50 text-green-700 border border-green-300',
    ForRepurpose: 'bg-blue-50 text-blue-700 border border-blue-200',
    Repurposed: 'bg-green-50 text-green-700 border border-green-300',
    Disposed: 'bg-gray-100 text-gray-700 border border-gray-300',
    GeneralOffice: 'bg-teal-50 text-teal-700 border border-teal-300',
};

const STATUS_LABELS = {
    GeneralOffice: 'General Office',
    ForSale: 'For Sale',
    Sold: 'Sold',
    Donated: 'Donated',
    ForRepurpose: 'For Repurpose',
    Repurposed: 'Repurposed',
    Disposed: 'Disposed',
};

const STORED_AT_LABELS = {
    School: 'School',
    TCC: 'TCC',
    Exited: 'Exited',
};

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
}

const columns = [
    {
        field: 'sizeName',
        headerName: 'Size',
        flex: 0.8,
        minWidth: 80,
        renderCell: ({ value }) => (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-50 text-gray-700 text-xs font-medium border border-gray-200 tabular-nums">
                {value || 'N/A'}
            </span>
        ),
    },
    {
        field: 'quantity',
        headerName: 'Quantity',
        flex: 0.6,
        minWidth: 90,
        align: 'left',
        headerAlign: 'left',
    },
    {
        field: 'lastUpdated',
        headerName: 'Last Updated',
        flex: 1,
        minWidth: 130,
        valueFormatter: (value) => formatDate(value),
    },
];
/**
 * Renders inventory balance rows using MUI DataGrid.
 *
 * Props:
 *  - items     : InventoryBalance[] (full filtered set – DataGrid handles pagination)
 *  - onRowClick: (item) => void
 */
export default function InventoryTable({ items = [], onRowClick }) {
    const rows = items.map((item) => ({
        id: item.id,
        itemStatus: item.itemStatus,
        sizeName: item.sizeOption?.sizeName ?? null,
        quantity: item.quantity ?? 0,
        storedAt: item.storedAt,
        lastUpdated: item.lastUpdated,
        _raw: item,
    }));

    return (
        <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            hideFooterSelectedRowCount
            onRowClick={({ row }) => onRowClick?.(row._raw)}
            initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            sx={{
                width: '100%',
                borderRadius: 2,
                '& .MuiDataGrid-row': {
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                },
                '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#f0fdf4',
                    outline: '1px solid #bbf7d0',
                    outlineOffset: '-1px',
                },
                '& .MuiDataGrid-row:hover .MuiDataGrid-cell': {
                    color: '#15803d',
                },
            }}
        />
    );
}