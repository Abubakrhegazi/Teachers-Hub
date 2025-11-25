import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Chapter } from '../types';
import { Check, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';

// Icon component to handle status display in the timeline node
const StatusIcon: React.FC<{ status: Chapter['status'] }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <Check className="h-5 w-5 text-white" />;
    case 'in-progress':
      return <Clock className="h-5 w-5 text-gray-800" />;
    case 'pending':
      return <div className="h-3 w-3 bg-gray-300 rounded-full"></div>;
    default:
      return null;
  }
};

export const Roadmap: React.FC = () => {
  const { chapters } = useAppContext();

  // Find the initial chapter to display (in-progress, or first)
  const initialChapter = useMemo(() => {
    return chapters.find(c => c.status === 'in-progress') || chapters[0];
  }, [chapters]);
  
  const [selectedChapter, setSelectedChapter] = useState<Chapter | undefined>(initialChapter);

  // Find the index of the last completed chapter to color the progress bar
  const lastCompletedIndex = useMemo(() => {
    const indices = chapters.map((c, i) => c.status === 'completed' ? i : -1);
    return Math.max(...indices);
  }, [chapters]);

  // Handle case where chapters might be empty
  if (!chapters || chapters.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-white-800">Course Roadmap</h1>
        <p className="text-lg text-white-600 mt-4">No chapters have been defined for this course yet.</p>
      </div>
    );
  }

  // Fallback if selected chapter is somehow undefined
  if (!selectedChapter) {
      setSelectedChapter(chapters[0]);
      return null;
  }

  const progressPercentage = chapters.length > 1 ? Math.max(0, (lastCompletedIndex / (chapters.length - 1)) * 100) : (lastCompletedIndex >= 0 ? 100 : 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white-800">Course Roadmap</h1>
      <p className="text-lg text-white-600">Track your progress through the course chapters. Hover over a point on the timeline to see details.</p>
      
      <div className="w-full pt-8 pb-4">
        <div className="relative">
          <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 -translate-y-1/2"></div>
          <div 
             className="absolute top-5 left-0 h-1 bg-primary-500 -translate-y-1/2 transition-all duration-500 ease-out"
             style={{ width: `${progressPercentage}%` }}
          ></div>
          <div className="flex justify-between items-start relative">
            {chapters.map((chapter) => {
              let nodeColor = 'bg-white border-gray-300';
              let textColor = 'text-gray-500';
              let pulse = false;

              if (chapter.status === 'completed') {
                nodeColor = 'bg-primary-500 border-primary-600';
              } else if (chapter.status === 'in-progress') {
                nodeColor = 'bg-yellow-400 border-yellow-500';
                pulse = true;
              }

              if (selectedChapter.id === chapter.id) {
                textColor = 'text-primary-600 font-bold';
              }
              
              return (
                <div
                  key={chapter.id}
                  className="w-24 text-center cursor-pointer group"
                  onMouseEnter={() => setSelectedChapter(chapter)}
                  onClick={() => setSelectedChapter(chapter)}
                >
                  <div className={`relative mx-auto w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 group-hover:scale-110 ${nodeColor} ${selectedChapter.id === chapter.id ? 'scale-110' : ''}`}>
                    {pulse && <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping"></span>}
                    <StatusIcon status={chapter.status} />
                  </div>
                   <p className={`mt-3 text-xs sm:text-sm transition-colors duration-300 ${textColor}`}>
                    {chapter.title.split(':')[0]}
                   </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Card className="transition-all duration-300 min-h-[160px]">
        {selectedChapter && (
            <div key={selectedChapter.id} className="animate-fade-in">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 capitalize
                ${selectedChapter.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                ${selectedChapter.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${selectedChapter.status === 'pending' ? 'bg-gray-100 text-gray-800' : ''}`}
                >
                    {selectedChapter.status}
                </span>
                <h2 className="text-2xl font-bold text-gray-800">{selectedChapter.title}</h2>
                <p className="mt-2 text-white-600">{selectedChapter.description}</p>
            </div>
        )}
      </Card>
    </div>
  );
};