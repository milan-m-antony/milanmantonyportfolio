'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive as StorageIcon, Loader2 } from 'lucide-react'; // Using HardDrive icon for storage
import { motion } from 'framer-motion'; // Import motion

interface BucketStorageStatCardProps {
  title: string;
  currentSizeMB: number | null; 
  maxSizeMB: number | null; 
  description: string;
  isLoading?: boolean;
}

const CircularProgressRing: React.FC<{ percentage: number; size?: number; strokeWidth?: number }> = ({
  percentage,
  size = 80, 
  strokeWidth = 8, 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        className="stroke-gray-300 dark:stroke-gray-700" // Color for the "unused" part
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="stroke-primary" // Color for the "used" part
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
};

const BucketStorageStatCard: React.FC<BucketStorageStatCardProps> = ({
  title,
  currentSizeMB,
  maxSizeMB,
  description,
  isLoading,
}) => {
  const actualMaxSizeMB = maxSizeMB === null || typeof maxSizeMB === 'undefined' ? 10240 : maxSizeMB; // Default to 10GB if not provided
  const percentage = currentSizeMB && actualMaxSizeMB ? Math.min((currentSizeMB / actualMaxSizeMB) * 100, 100) : 0;

  const formatSize = (sizeInMB: number | null) => {
    if (sizeInMB === null || typeof sizeInMB === 'undefined') return 'N/A';
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full" // Ensure motion.div takes full height if Card was h-full
    >
      <Card className="shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <StorageIcon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground">Loading storage data...</p>
            </div>
          ) : currentSizeMB !== null ? (
            <>
              <div className="relative mb-3">
                <CircularProgressRing percentage={percentage} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {`${Math.round(percentage)}%`}
                  </span>
                </div>
              </div>
              <p className="text-xl font-bold">
                {formatSize(currentSizeMB)}
              </p>
              <p className="text-xs text-muted-foreground">
                used out of {formatSize(actualMaxSizeMB)}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <StorageIcon className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Data not available</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-auto pt-2">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BucketStorageStatCard; 