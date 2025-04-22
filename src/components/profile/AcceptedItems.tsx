
import React from 'react';
import { Clock, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Request } from '@/types/profileTypes';

interface AcceptedItemsProps {
  acceptedItems: Request[];
  handleMarkCompleted: (itemId: string) => void;
  handleAbandon: (itemId: string) => void;
  hasMarkedCompleted: (item: Request) => boolean;
  user: any;
}

const AcceptedItems = ({ acceptedItems, handleMarkCompleted, handleAbandon, hasMarkedCompleted, user }: AcceptedItemsProps) => {
  return (
    <div className="bg-jd-card rounded-lg p-6">
      <h3 className="text-xl font-medium mb-6">Accepted Items</h3>
      <p className="text-jd-mutedText mb-4">
        Requests and projects you've accepted and are currently working on
      </p>
      
      {acceptedItems.length > 0 ? (
        <div className="space-y-4">
          {acceptedItems.map((item, index) => (
            <div key={index} className="border border-jd-bg rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-jd-purple">{item.department}</p>
                  <p className="text-sm text-jd-mutedText mt-1">
                    {item.description?.slice(0, 100)}{item.description?.length > 100 ? '...' : ''}
                  </p>
                  <div className="mt-2 flex items-center">
                    <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs">In Process</span>
                    {item.lastStatusUpdateTime && (
                      <div className="flex items-center gap-1 text-xs text-jd-mutedText ml-4">
                        <Clock size={12} />
                        <span>
                          Last updated: {item.lastStatusUpdateTime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    className={`flex items-center gap-1 bg-green-500 hover:bg-green-600 ${hasMarkedCompleted(item) ? 'opacity-60 pointer-events-none cursor-not-allowed' : ''}`}
                    onClick={() => handleMarkCompleted(item.id)}
                    disabled={hasMarkedCompleted(item)}
                  >
                    <Check size={16} />
                    {hasMarkedCompleted(item) ? "Completed (Waiting for others)" : "Mark Completed"}
                  </Button>
                  
                  {/* Show Abandon button only for requests, not for projects */}
                  {item.type !== "project" && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="flex items-center gap-1"
                      onClick={() => handleAbandon(item.id)}
                      disabled={item.type === "project"}
                    >
                      <X size={16} />
                      Abandon
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-jd-bg rounded-lg">
          <Clock size={48} className="mx-auto text-jd-mutedText mb-3" />
          <h4 className="text-lg font-medium mb-2">No Accepted Items</h4>
          <p className="text-jd-mutedText max-w-md mx-auto">
            You haven't accepted any requests or projects yet. Items you accept will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default AcceptedItems;
