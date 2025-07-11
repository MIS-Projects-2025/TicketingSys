import { ThumbsDown, ThumbsUp } from "lucide-react";

const TicketActions = ({
    onApprove,
    onDisapprove,
    remarksState,
    setRemarksState,
    remarks,
    setRemarks,
}) => {
    return (
        <div className="space-y-4">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-6">
                <button className="btn btn-primary gap-2" onClick={onApprove}>
                    <ThumbsUp className="w-5 h-5" />
                    Approve
                </button>

                <button
                    className="btn btn-primary gap-2"
                    onClick={() => setRemarksState("show")}
                >
                    <ThumbsDown className="w-5 h-5" />
                    Disapprove
                </button>
            </div>

            {/* Remarks Section */}
            {remarksState === "show" && (
                <div
                    className="transition-all duration-500 ease-in-out"
                    style={{
                        opacity: remarksState === "show" ? 1 : 0,
                        transform:
                            remarksState === "show"
                                ? "translateY(0)"
                                : "translateY(20px)",
                    }}
                >
                    <label className="floating-label">
                        <textarea
                            className="textarea textarea-bordered w-full h-24"
                            placeholder="Enter remarks for disapproval..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />
                        <span>Remarks</span>
                    </label>

                    <div className="flex gap-2 mt-4">
                        <button
                            className="btn btn-error"
                            onClick={onDisapprove}
                        >
                            Submit Disapproval
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={() => setRemarksState("hide")}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketActions;
