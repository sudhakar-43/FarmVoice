import React from 'react';

interface DiseaseHoverCardProps {
  title: string;
  description: string;
  onMoreInfo?: () => void;
}

const DiseaseHoverCard: React.FC<DiseaseHoverCardProps> = ({ title, description, onMoreInfo }) => {
  return (
    <div className="group relative w-full min-h-[254px] bg-[#f5f5f5] dark:bg-gray-800 rounded-[20px] p-[1.8rem] border-2 border-[#c3c6ce] dark:border-gray-700 hover:border-[#008bf8] hover:shadow-[0_4px_18px_0_rgba(0,0,0,0.25)] transition-all duration-500 overflow-visible flex flex-col items-center text-center">
      <div className="h-full flex flex-col justify-center gap-2 text-gray-900 dark:text-white">
        <p className="text-xl font-bold">{title}</p>
        <p className="text-[#868686] dark:text-gray-400 text-sm line-clamp-4">{description}</p>
      </div>
      <button 
        className="absolute left-[50%] bottom-0 translate-x-[-50%] translate-y-[125%] w-[60%] rounded-[1rem] border-none bg-[#008bf8] text-white text-[1rem] py-2 px-4 opacity-0 transition-all duration-300 group-hover:translate-y-[50%] group-hover:opacity-100 shadow-md cursor-pointer z-10"
        onClick={(e) => {
            e.stopPropagation();
            if (onMoreInfo) onMoreInfo();
        }}
      >
        More info
      </button>
    </div>
  );
};

export default DiseaseHoverCard;
