import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="text-xl text-gray-600 mt-2">Page not found</p>
        <p className="text-gray-400 mt-1">The page you're looking for doesn't exist.</p>
        <Button className="mt-6" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    </div>
  );
};

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-500 mt-1">You don't have permission to view this page.</p>
        <Button className="mt-6" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    </div>
  );
};
