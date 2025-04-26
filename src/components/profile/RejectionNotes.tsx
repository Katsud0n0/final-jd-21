
import React from 'react';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { Request } from '@/types/profileTypes';

interface RejectionNote {
  title: string;
  rejecter: string;
  reason: string;
  date: string;
}

interface RejectionNotesProps {
  userRequests: Request[];
}

const RejectionNotes = ({ userRequests }: RejectionNotesProps) => {
  // Extract rejection notes from user requests (only for requests created by the user)
  const rejectionNotes = userRequests
    .filter(req => req.rejections && req.rejections.length > 0)
    .flatMap(req => {
      return (req.rejections || []).map(rejection => ({
        title: req.title,
        rejecter: rejection.username,
        reason: rejection.reason || "No reason provided",
        date: rejection.date
      }));
    });
  
  return (
    <div className="bg-jd-card rounded-lg p-6">
      <h3 className="text-xl font-medium mb-6">Rejection Notes</h3>
      
      {rejectionNotes.length > 0 ? (
        <div className="space-y-4">
          {rejectionNotes.map((note, index) => (
            <div key={index} className="border border-jd-bg rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{note.title}</h4>
                  <p className="text-sm text-jd-mutedText mt-1">
                    Rejected by <span className="text-jd-purple">{note.rejecter}</span> on {note.date}
                  </p>
                </div>
                <div className="bg-amber-100 text-amber-800 p-1 rounded">
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div className="mt-3 bg-jd-bg p-3 rounded-lg flex items-start gap-2">
                <MessageSquare size={16} className="mt-1 text-jd-mutedText" />
                <p className="text-sm">{note.reason}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="h-16 w-16 bg-jd-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-jd-mutedText" />
          </div>
          <h4 className="text-lg font-medium mb-2">No Rejection Notes</h4>
          <p className="text-jd-mutedText">
            You don't have any rejection notes for your requests.
          </p>
        </div>
      )}
    </div>
  );
};

export default RejectionNotes;
