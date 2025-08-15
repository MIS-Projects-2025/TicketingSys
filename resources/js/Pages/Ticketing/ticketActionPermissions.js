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
        canTest:
            formState === "for_testing" &&
            ticket.TESTING_BY == emp_data?.emp_id,
        canReturnTest:
            formState === "for_testing" &&
            ticket.TESTING_BY == emp_data?.emp_id,
        // canApproveSup:
        //     formState === "approving" &&
        //     userAccountType === "SUPERVISOR" &&
        //     typeOfRequest != "request_form" &&
        //     remarksState !== "show",

        // canDisapproveSup:
        //     formState === "approving" &&
        //     userAccountType === "SUPERVISOR" &&
        //     typeOfRequest != "request_form" &&
        //     remarksState !== "show",
        canApproveDH:
            formState === "approving" &&
            userAccountType === "DEPARTMENT_HEAD" &&
            !userAccountType.includes("OD") &&
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
            remarksState !== "show",

        canDisapproveOD:
            formState === "approving" &&
            userAccountType.includes("OD") &&
            typeOfRequest === "request_form" &&
            remarksState !== "show",

        canGenerate: formState === "create",

        canResubmit:
            formState === "resubmitting" &&
            ticket.EMPLOYEE_ID === emp_data?.emp_id &&
            remarksState !== "show",

        canCancel:
            formState === "resubmitting" &&
            ticket.EMPLOYEE_ID === emp_data?.emp_id &&
            remarksState !== "show",
        canAcknowledge:
            formState === "acknowledging" &&
            ticket.ASSIGNED_TO == emp_data?.emp_id,
        canReject:
            formState === "acknowledging" &&
            ticket.ASSIGNED_TO == emp_data?.emp_id &&
            remarksState !== "show",
    };
}
