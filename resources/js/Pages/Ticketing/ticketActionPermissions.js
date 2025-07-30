export function getAvailableActions({
    formState,
    userAccountType,
    typeOfRequest,
    remarksState,
}) {
    return {
        canAssignProgrammer:
            formState === "assigning_programmer" &&
            (userAccountType.includes("MIS_SUPERVISOR") ||
                userAccountType.includes("PROGRAMMER")),
        canAssessTicket:
            formState === "assessing" && userAccountType === "PROGRAMMER",
        canReturnTicket:
            formState === "assessing" && userAccountType === "PROGRAMMER",
        canApproveDH:
            formState === "approving" &&
            userAccountType === "DEPARTMENT_HEAD" &&
            typeOfRequest === "request_form" &&
            remarksState !== "show",
        canApproveOD:
            formState === "approving" &&
            userAccountType === "OD" &&
            typeOfRequest === "request_form" &&
            remarksState !== "show",
        canDisapproveDH:
            formState === "approving" &&
            userAccountType === "DEPARTMENT_HEAD" &&
            typeOfRequest === "request_form" &&
            remarksState !== "show",
        canDisapproveOD:
            formState === "approving" &&
            userAccountType === "OD" &&
            typeOfRequest === "request_form" &&
            remarksState !== "show",
        canGenerate: formState === "create",
    };
}
