import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, FilterIcon, SearchIcon, Zap } from 'lucide-react';
import { Layout } from '../layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Pagination } from '../ui/Pagination';
import { StatCard } from '../ui/StatCard';
import { TrainingJobCard } from './TrainingJobCard';
import { useTrainingJobs } from '../../hooks';
import { workspaceAPI } from '../../api';
import type { JobStatus, TrainingJob, Workspace } from '../../types';

const MAX_TRAINING_PAGE_SIZE = 100;

const STATUS_OPTIONS: Array<{ value: 'all' | JobStatus; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'standby', label: 'Standby' },
  { value: 'running', label: 'Running' },
  { value: 'finished', label: 'Finished' },
  { value: 'failed', label: 'Failed' },
  { value: 'canceled', label: 'Canceled' },
];

export const WorkspaceTrainingJobsPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const workspaceIdNum = workspaceId ? parseInt(workspaceId, 10) : undefined;
  const { trainingJobs, loading, error, totalCount, cancelTrainingJob, fetchTrainingJobs } = useTrainingJobs(workspaceIdNum);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');
  const [projectTypeFilter, setProjectTypeFilter] = useState<'all' | string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!workspaceIdNum) {
        setLoadingWorkspace(false);
        return;
      }

      try {
        setLoadingWorkspace(true);
        const ws = await workspaceAPI.getById(workspaceIdNum);
        setWorkspace(ws);
      } catch (loadError) {
        console.error('Failed to load workspace:', loadError);
      } finally {
        setLoadingWorkspace(false);
      }
    };

    loadWorkspace();
  }, [workspaceIdNum]);

  useEffect(() => {
    setPage(1);
  }, [searchText, statusFilter, projectTypeFilter]);

  useEffect(() => {
    if (!workspaceIdNum) return;

    const safePageSize = Math.min(pageSize, MAX_TRAINING_PAGE_SIZE);
    const offset = (page - 1) * safePageSize;
    const keyword = searchText.trim();

    fetchTrainingJobs({
      limit: safePageSize,
      offset,
      keyword: keyword.length > 0 ? keyword : undefined,
      job_status: statusFilter === 'all' ? undefined : [statusFilter],
      project_types: projectTypeFilter === 'all' ? undefined : [projectTypeFilter],
      order_by: 'created_at',
      desc: true,
    });
  }, [workspaceIdNum, page, pageSize, searchText, statusFilter, projectTypeFilter, fetchTrainingJobs]);

  const projectTypeOptions = useMemo(() => {
    const uniqueTypes = Array.from(new Set(trainingJobs.map((job) => job.project_type).filter(Boolean)));
    return ['all', ...uniqueTypes];
  }, [trainingJobs]);

  const stats = useMemo(() => {
    return {
      total: totalCount,
      running: trainingJobs.filter((job) => job.status === 'running').length,
      finished: trainingJobs.filter((job) => job.status === 'finished').length,
      failed: trainingJobs.filter((job) => job.status === 'failed').length,
    };
  }, [trainingJobs, totalCount]);

  const handleViewProjectJobs = (job: TrainingJob) => {
    navigate(`/workspaces/${workspaceIdNum}/projects/${job.project_id}/training-jobs`);
  };

  const handleCancelJob = async (projectId: number, jobId: number) => {
    await cancelTrainingJob(projectId, jobId);
  };

  const handleRetry = async () => {
    const safePageSize = Math.min(pageSize, MAX_TRAINING_PAGE_SIZE);
    const offset = (page - 1) * safePageSize;
    const keyword = searchText.trim();

    await fetchTrainingJobs({
      limit: safePageSize,
      offset,
      keyword: keyword.length > 0 ? keyword : undefined,
      job_status: statusFilter === 'all' ? undefined : [statusFilter],
      project_types: projectTypeFilter === 'all' ? undefined : [projectTypeFilter],
      order_by: 'created_at',
      desc: true,
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPage(1);
    setPageSize(Math.min(newPageSize, MAX_TRAINING_PAGE_SIZE));
  };

  if (loadingWorkspace || loading) {
    return (
      <Layout>
        <LoadingState message="Loading training jobs..." />
      </Layout>
    );
  }

  if (!workspace) {
    return (
      <Layout>
        <EmptyState
          icon={Zap}
          title="Workspace not found"
          description="The workspace does not exist or you do not have access."
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <Breadcrumb
                items={[
                  { label: 'Workspaces', href: '/workspaces' },
                  { label: workspace.name, href: `/workspaces/${workspaceIdNum}` },
                  { label: 'Training Jobs', active: true },
                ]}
              />
              <Button variant="outline" size="sm" onClick={() => navigate(`/workspaces/${workspaceIdNum}`)}>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Workspace
              </Button>
            </div>

            <div className="flex items-center space-x-4 mb-2">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{workspace.name} Training Jobs</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">All training tasks in this workspace.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Total" value={stats.total} icon={Zap} iconColor="text-white" iconBgColor="bg-orange-500" />
              <StatCard title="Running" value={stats.running} icon={Zap} iconColor="text-white" iconBgColor="bg-blue-500" />
              <StatCard title="Finished" value={stats.finished} icon={Zap} iconColor="text-white" iconBgColor="bg-green-500" />
              <StatCard title="Failed" value={stats.failed} icon={Zap} iconColor="text-white" iconBgColor="bg-red-500" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FilterIcon className="w-5 h-5 mr-2 text-orange-600" />
                  Filter Training Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <SearchIcon className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                    <Input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search by job name, project, or job id"
                      className="pl-10"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | JobStatus)}
                    className="w-full px-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={projectTypeFilter}
                    onChange={(e) => setProjectTypeFilter(e.target.value)}
                    className="w-full px-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                  >
                    {projectTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Project Types' : type}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {error ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <Button onClick={handleRetry}>Retry</Button>
                </CardContent>
              </Card>
            ) : trainingJobs.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <EmptyState
                    icon={Zap}
                    title="No training jobs found"
                    description="No training jobs match your filters in this workspace."
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trainingJobs.map((job) => (
                    <TrainingJobCard
                      key={job.id}
                      job={job}
                      onView={handleViewProjectJobs}
                      onCancel={handleCancelJob}
                    />
                  ))}
                </div>

                {totalCount > pageSize && (
                  <Pagination
                    currentPage={page}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                    gridConfig={{ cols: { sm: 1, md: 2, lg: 4, xl: 4 } }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
