
import React, { useState } from 'react';
import { AlertTriangle, MessageSquare, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Request, Rejection } from '@/types/profileTypes';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface RejectionNote {
  id: string;
  title: string;
  rejecter: string;
  reason: string;
  date: string;
}

interface RejectionNotesProps {
  userRequests: Request[];
  onClearNotes?: () => void;
}

const RejectionNotes = ({ userRequests, onClearNotes }: RejectionNotesProps) => {
  const { toast } = useToast();
  const [showNotes, setShowNotes] = useState(true);
  const [hiddenNotes, setHiddenNotes] = useState<string[]>([]);
  
  // Extract rejection notes from user requests (only for requests created by the user)
  const rejectionNotes = userRequests
    .filter(req => req.rejections && req.rejections.length > 0)
    .flatMap(req => {
      return (req.rejections || []).map(rejection => ({
        id: req.id + rejection.date,
        title: req.title,
        rejecter: rejection.username,
        reason: rejection.reason || "No reason provided",
        date: rejection.date
      }));
    });
  
  const visibleNotes = rejectionNotes.filter(note => !hiddenNotes.includes(note.id));
  
  const handleHideNote = (noteId: string) => {
    setHiddenNotes([...hiddenNotes, noteId]);
    toast({
      title: "Note hidden",
      description: "The rejection note has been hidden."
    });
  };
  
  const handleClearAllNotes = () => {
    if (onClearNotes) {
      onClearNotes();
    } else {
      setHiddenNotes(rejectionNotes.map(note => note.id));
    }
    
    toast({
      title: "Notes cleared",
      description: "All rejection notes have been cleared."
    });
  };
  
  const toggleNotes = () => {
    setShowNotes(!showNotes);
  };
  
  return (
    <div className="bg-jd-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={toggleNotes}>
          <h3 className="text-xl font-medium">Rejection Notes</h3>
          {showNotes ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {rejectionNotes.length > 0 && showNotes && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearAllNotes}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>
      
      {showNotes && (rejectionNotes.length > 0 ? (
        <div className="space-y-4">
          {visibleNotes.length > 0 ? (
            visibleNotes.map((note, index) => (
              <div key={index} className="border border-jd-bg rounded-lg p-4 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{note.title}</h4>
                    <p className="text-sm text-jd-mutedText mt-1">
                      Rejected by <span className="text-jd-purple">{note.rejecter}</span> on {note.date}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-amber-100 text-amber-800 p-1 rounded">
                      <AlertTriangle size={16} />
                    </div>
                    <button 
                      onClick={() => handleHideNote(note.id)}
                      className="text-jd-mutedText hover:text-jd-purple rounded-full p-1"
                      title="Hide note"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 bg-jd-bg p-3 rounded-lg flex items-start gap-2">
                  <MessageSquare size={16} className="mt-1 text-jd-mutedText" />
                  <p className="text-sm">{note.reason}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-jd-mutedText">All notes have been cleared.</p>
          )}
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
      ))}
    </div>
  );
};

export default RejectionNotes;
