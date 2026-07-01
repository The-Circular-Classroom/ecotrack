// @ts-nocheck
export default function CustomErrorButton({ title = 'Something went wrong', message, onRetry }) {
    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold">{title}</h3>
                <p className="text-red-600 mt-2">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-4 px-4 py-2 rounded-md flex items-center justify-center font-medium transition-colors text-sm cursor-pointer bg-red-500 hover:bg-red-600 text-white"
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
}