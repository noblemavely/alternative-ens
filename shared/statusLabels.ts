export const STATUS_LABELS: Record<string, string> = {
  pending: "New",
  interested: "Contacted",
  rejected: "Closed – Lost",
  new: "New",
  contacted: "Contacted",
  attempting_contact: "Attempting Contact",
  engaged: "Engaged",
  qualified: "Qualified",
  proposal_sent: "Proposal / Quotation Sent",
  negotiation: "Negotiation",
  verbal_agreement: "Verbal Agreement",
  closed_won: "Closed – Won",
  closed_lost: "Closed – Lost",
};

export const STATUS_VALUES = [
  "new",
  "contacted",
  "attempting_contact",
  "engaged",
  "qualified",
  "proposal_sent",
  "negotiation",
  "verbal_agreement",
  "closed_won",
  "closed_lost",
] as const;

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  attempting_contact: "bg-yellow-100 text-yellow-800",
  engaged: "bg-green-100 text-green-800",
  qualified: "bg-emerald-100 text-emerald-800",
  proposal_sent: "bg-indigo-100 text-indigo-800",
  negotiation: "bg-orange-100 text-orange-800",
  verbal_agreement: "bg-teal-100 text-teal-800",
  closed_won: "bg-green-200 text-green-900",
  closed_lost: "bg-red-100 text-red-800",
  pending: "bg-gray-100 text-gray-800",
  interested: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
};
