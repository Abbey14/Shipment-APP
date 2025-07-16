import React, { useEffect, useState } from 'react';
import { gmailService } from '../services/gmailService';
import type { MockEmail } from '../types';
import { Mail, FileText, CheckCircle, Hourglass } from 'lucide-react';

const EmailRow: React.FC<{ email: MockEmail }> = ({ email }) => (
    <a href={`#/verify/${email.id}`} className="block hover:bg-slate-800/50 transition-colors duration-150">
        <div className="flex items-center p-4 border-b border-slate-800">
            <div className="w-1/12 text-center">
                 {email.status === 'new' && <Hourglass className="h-5 w-5 mx-auto text-yellow-400" aria-label="New" />}
                 {email.status === 'approved' && <CheckCircle className="h-5 w-5 mx-auto text-green-400" aria-label="Approved" />}
                 {email.status === 'processed' && <Mail className="h-5 w-5 mx-auto text-cyan-400" aria-label="Processed" />}
            </div>
            <div className="w-3/12 font-medium text-slate-300 truncate" title={email.from}>{email.from}</div>
            <div className="w-5/12 text-slate-300 truncate" title={email.subject}>{email.subject}</div>
            <div className="w-2/12 text-slate-400 text-sm truncate" title={email.pdfAttachmentName}>
                <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{email.pdfAttachmentName}</span>
                </div>
            </div>
            <div className="w-1/12 text-slate-500 text-sm text-right">{email.date}</div>
        </div>
    </a>
);


export const Dashboard: React.FC = () => {
  const [emails, setEmails] = useState<MockEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = async () => {
      setIsLoading(true);
      const emailList = await gmailService.getChecklistEmails();
      setEmails(emailList);
      setIsLoading(false);
    };
    fetchEmails();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-slate-400 mb-8">Checklists awaiting verification from your inbox.</p>
      
      <div className="bg-slate-900 rounded-lg shadow-lg overflow-hidden border border-slate-800">
        <div className="flex items-center p-4 bg-slate-800/50 text-xs text-slate-400 font-medium uppercase">
            <div className="w-1/12 text-center">Status</div>
            <div className="w-3/12">From</div>
            <div className="w-5/12">Subject</div>
            <div className="w-2/12">Attachment</div>
            <div className="w-1/12 text-right">Date</div>
        </div>
        {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading emails...</div>
        ) : (
            <div>
                {emails.map(email => <EmailRow key={email.id} email={email} />)}
            </div>
        )}
      </div>
    </div>
  );
};
