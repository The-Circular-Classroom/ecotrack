import { Backdrop, CircularProgress } from '@mui/material';
import CustomButton from '@/components/ui/CustomButton';

export default function DeleteConfirmModal({ open, onClose, onConfirm, loading, title, description }) {
    return (
        <Backdrop
            open={open}
            onClick={() => !loading && onClose()}
            sx={{ zIndex: 60, p: 2 }}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
                <p className="text-sm text-gray-500 mb-6">{description}</p>
                <div className="flex gap-3">
                    <CustomButton
                        variant="ghost"
                        disabled={loading}
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </CustomButton>
                    <CustomButton
                        variant="danger"
                        disabled={loading}
                        onClick={onConfirm}
                        icon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                        className="flex-1"
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </CustomButton>
                </div>
            </div>
        </Backdrop>
    );
}