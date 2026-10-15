export const ProcessRequestStatusEnum = {
  ACCEPTED: 1,
  REJECTED: 2,
};
export const RequestStatusEnum = {
  ...ProcessRequestStatusEnum,
  PENDING: 0,
};

export const FilterRequestsEnum = {
  INBOX: "inbox",
  SENT: "sent",
  ALL: "all",
};
export const SortRequestsEnum = {
  CREATED_AT_ASC: "createdAt-asc",
  CREATED_AT_DESC: "createdAt-desc",
};
