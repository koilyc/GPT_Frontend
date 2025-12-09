import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Zap } from 'lucide-react';
import type { TrainingJob } from '../../types';

interface TrainingJobCardProps {
  job: TrainingJob;
  onCancel?: (projectId: number, jobId: number) => void;
  onDelete?: (projectId: number, jobId: number) => void;
  onView?: (job: TrainingJob) => void;
}

const getStatusInfo = (status: TrainingJob['status']) => {
  switch (status) {
    case 'standby':
      return {
        color: 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50',
        text: 'Standby'
      };
    case 'running':
      return {
        color: 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
        text: 'Running'
      };
    case 'finished':
      return {
        color: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700/50',
        text: 'Finished'
      };
    case 'canceled':
      return {
        color: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
        text: 'Canceled'
      };
    case 'failed':
      return {
        color: 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700/50',
        text: 'Failed'
      };
    default:
      return {
        color: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
        text: status
      };
  }
};

export const TrainingJobCard: React.FC<TrainingJobCardProps> = ({
  job,
  onCancel,
  onDelete,
  onView,
}) => {
  const canCancel = job.status === 'running' || job.status === 'standby';
  const canDelete = job.status === 'finished' || job.status === 'canceled' || job.status === 'failed';
  const statusInfo = getStatusInfo(job.status);

  return (
    <Card className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 rounded-lg shadow-sm">
            <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full uppercase font-medium shadow-sm border ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
        
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">{job.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-1">
          {job.project_name} • {job.project_type}
        </p>
        
        {/* Always reserve space for progress bar to keep consistent card height */}
        <div className="mb-4">
          {job.current_progress !== undefined && job.status === 'running' ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{job.current_progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${job.current_progress}%` }}
                />
              </div>
            </>
          ) : (
            // Reserve space with invisible placeholder to maintain consistent height
            <div className="h-[40px]" />
          )}
        </div>
        
        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Project ID:</span>
            <span>{job.project_id}</span>
          </div>
          <div className="flex justify-between">
            <span>Created by:</span>
            <span>User {job.created_by}</span>
          </div>
          {job.started_at && (
            <div className="flex justify-between">
              <span>Started:</span>
              <span>{new Date(job.started_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        {job.fail_reason && job.status === 'failed' && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-1">Error:</p>
            <p className="text-sm text-red-600 dark:text-red-400">{job.fail_reason}</p>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex gap-2">
            {onView && (
              <Button
                onClick={() => onView(job)}
                className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 dark:from-orange-500 dark:to-amber-500 dark:hover:from-orange-600 dark:hover:to-amber-600 text-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                View Details
              </Button>
            )}
            
            {canCancel && onCancel && (
              <Button
                onClick={() => onCancel(job.project_id, job.id)}
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
              >
                Cancel
              </Button>
            )}
            
            {canDelete && onDelete && (
              <Button
                onClick={() => onDelete(job.project_id, job.id)}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
