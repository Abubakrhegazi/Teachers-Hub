
import React from 'react';
import { Card } from '../components/ui/Card';

export const AboutUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-white-800 mb-6 text-center">About Our Teacher</h1>
      
      <Card className="mb-8">
        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
           {/* Placeholder for video */}
          <iframe 
            className="w-full h-full"
            style={{aspectRatio: "16/9"}}
            src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Example video
            title="Introduction Video" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      </Card>

      <Card>
  <div className="prose max-w-none text-gray-700">
    <h2 className="text-2xl font-semibold text-gray-800">Meet Menna Khaled</h2>
    <p>
      With over 6 years of hands-on experience as a teaching assistant, 
      Menna Khaled has supported and taught more than 200 students across 
      different educational systems. Her journey includes working with 
      students abroad in the UAE, where she built a reputation for her 
      patience, dedication, and ability to explain ideas in a clear, engaging 
      way.
    </p>
    <p>
      Menna believes that every student learns differently, and she tailors 
      her approach to meet each student’s individual needs. Whether assisting 
      in core subjects or helping students strengthen their foundations, 
      she blends structure with creativity to ensure lessons are both 
      effective and enjoyable.
    </p>
    <h3 className="text-xl font-semibold text-gray-800 mt-6">Our Assistants</h3>
    <p>
      Menna works alongside a supportive team of skilled assistant teachers 
      who share her passion for helping students grow. Together, they provide 
      personalized guidance, small-group support, and constant reinforcement 
      of key concepts—ensuring every student receives the attention they need 
      to thrive.
    </p>
  </div>
</Card>

    </div>
  );
};
