
import React from 'react';
import { Archive, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Request } from '@/types/profileTypes';

interface ArchivedProjectsProps {
  archivedProjects: Request[];
  handleUnarchive: (projectId: string) => void;
  handleDelete: (projectId: string) => void;
  getDaysRemaining: (archivedAt: string) => string;
}

const ArchivedProjects = ({ archivedProjects, handleUnarchive, handleDelete, getDaysRemaining }: ArchivedProjectsProps) => {
  return (
    <div className="bg-jd-card rounded-lg p-6">
      <h3 className="text-xl font-medium mb-6">Archived Projects</h3>
      <p className="text-jd-mutedText mb-4">
        Projects you've archived. These are hidden from the main view but still stored in the system.
        <br />If a project's status is still pending, it will be permanently deleted 7 days after archiving.
      </p>
      
      {archivedProjects.length > 0 ? (
        <div className="space-y-4">
          {archivedProjects.map((project, index) => (
            <div key={index} className="border border-jd-bg rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{project.title}</h4>
                  <p className="text-sm text-jd-purple">{project.department}</p>
                  <p className="text-sm text-jd-mutedText mt-1">
                    {project.description?.slice(0, 100)}{project.description?.length > 100 ? '...' : ''}
                  </p>
                  <div className="mt-2 flex items-center">
                    <span className="text-xs text-jd-mutedText">
                      Archived on: {new Date(project.archivedAt || '').toLocaleDateString()}
                    </span>
                    {project.status === "Pending" && (
                      <div className="ml-4 flex items-center gap-1 text-xs text-jd-orange">
                        <Clock size={12} />
                        <span>
                          Auto-delete in: {getDaysRemaining(project.archivedAt || '')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleUnarchive(project.id)}
                  >
                    Restore
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(project.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-jd-bg rounded-lg">
          <Archive size={48} className="mx-auto text-jd-mutedText mb-3" />
          <h4 className="text-lg font-medium mb-2">No Archived Projects</h4>
          <p className="text-jd-mutedText max-w-md mx-auto">
            Projects you archive will appear here. Archived projects are hidden from the main requests view.
          </p>
        </div>
      )}
    </div>
  );
};

export default ArchivedProjects;
