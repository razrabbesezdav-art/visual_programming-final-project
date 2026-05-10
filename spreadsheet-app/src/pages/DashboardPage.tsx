import React from 'react';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleOpenDocument = (id: string) => {
    navigate(`/documents/${id}`);
  };
  
  return <Dashboard onOpenDocument={handleOpenDocument} />;
};