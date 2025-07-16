import type { MockEmail } from '../types';

const MOCK_EMAILS: MockEmail[] = [
  {
    id: 'email-1',
    from: 'shipping.agent@global-forwarding.com',
    subject: 'FW: Checklist for AWB 789-12345678',
    snippet: 'Hi team, please find attached the checklist for the upcoming shipment. Kindly review and approve.',
    date: '2 hours ago',
    status: 'new',
    pdfAttachmentName: 'checklist_78912345678.pdf',
  },
  {
    id: 'email-2',
    from: 'customs.broker@fastlane.logistics',
    subject: 'Checklist for AWB 456-98765432 - URGENT',
    snippet: 'Approval needed ASAP for the attached checklist. AWB 456-98765432. Thanks.',
    date: '1 day ago',
    status: 'new',
    pdfAttachmentName: 'draft_boe_45698765432.pdf',
  },
  {
    id: 'email-3',
    from: 'shipping.agent@global-forwarding.com',
    subject: 'RE: Approved Checklist for AWB 123-11223344',
    snippet: 'This checklist was approved last week. For your records.',
    date: '5 days ago',
    status: 'approved',
    pdfAttachmentName: 'checklist_approved_12311223344.pdf',
  },
];

export const gmailService = {
  getChecklistEmails: async (): Promise<MockEmail[]> => {
    // Simulate network delay
    await new Promise(res => setTimeout(res, 300));
    return MOCK_EMAILS;
  },
  getEmailById: async (id: string): Promise<MockEmail | undefined> => {
    // Simulate network delay
    await new Promise(res => setTimeout(res, 100));
    return MOCK_EMAILS.find(email => email.id === id);
  }
};
