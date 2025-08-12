export function getAvailableActions({
    formState,
    userAccountType,
    typeOfRequest,
    remarksState,
    emp_data,
    ticket,
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
            !userAccountType.includes("OD") &&
            typeOfRequest === "request_form" &&
            remarksState !== "show",

        canApproveOD:
            formState === "approving" &&
            userAccountType.includes("OD") &&
            typeOfRequest === "request_form" &&
            remarksState !== "show",

        canDisapproveDH:
            formState === "approving" &&
            userAccountType === "DEPARTMENT_HEAD" &&
            !userAccountType.includes("OD") &&
            typeOfRequest === "request_form" &&
            remarksState !== "show",

        canDisapproveOD:
            formState === "approving" &&
            userAccountType.includes("OD") &&
            typeOfRequest === "request_form" &&
            remarksState !== "show",

        canGenerate: formState === "create",

        canResubmit:
            formState === "resubmitting" &&
            ticket.EMPLOYEE_ID === emp_data?.EMPLOYID &&
            remarksState !== "show",

        canCancel:
            formState === "resubmitting" &&
            ticket.EMPLOYEE_ID === emp_data?.EMPLOYID &&
            remarksState !== "show",
    };
}
