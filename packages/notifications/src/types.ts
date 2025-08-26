export type NotifTopic = "AUTH" | "ORDER" | "INVOICE" | "SHIPPING" | "CURATOR" | "COMMISSION" | "PAYOUT" | "CART" | "SYSTEM";
export type NotifChannel = "EMAIL" | "INAPP";

export type EmailTemplateName = import("@artfromromania/email").TemplateName;
export type EmailTemplatePayloads = import("@artfromromania/email").TemplatePayloads;

export type EnqueueEmailParams<T extends EmailTemplateName> = {
  userId?: string;
  email?: string;
  topic: NotifTopic;
  template: T;
  payload: EmailTemplatePayloads[T];
  replyTo?: string;
};
