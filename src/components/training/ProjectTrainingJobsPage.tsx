import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, FilterIcon, PlusIcon, SearchIcon, Zap } from 'lucide-react';
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
import { useProjectTrainingJobs } from '../../hooks';
import { projectAPI, trainingJobAPI, workspaceAPI } from '../../api';
import type { JobStatus, Project, TrainingJob, Workspace } from '../../types';

const MAX_TRAINING_PAGE_SIZE = 100;
type JobSortField = 'id' | 'name' | 'created_at' | 'updated_at' | 'time_spent';

const STATUS_OPTIONS: Array<{ value: 'all' | JobStatus; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'standby', label: 'Standby' },
  { value: 'running', label: 'Running' },
  { value: 'finished', label: 'Finished' },
  { value: 'failed', label: 'Failed' },
  { value: 'canceled', label: 'Canceled' },
];

export const ProjectTrainingJobsPage: React.FC = () => {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const navigate = useNavigate();

  const workspaceIdNum = workspaceId ? parseInt(workspaceId, 10) : undefined;
  const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;

  const { trainingJobs, loading, error, totalCount, fetchTrainingJobs } = useProjectTrainingJobs(workspaceIdNum, projectIdNum);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sortField, setSortField] = useState<JobSortField>('created_at');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const loadMeta = async () => {
      if (!workspaceIdNum || !projectIdNum) {
        setLoadingMeta(false);
        return;
      }

      try {
        setLoadingMeta(true);
        const [workspaceData, projectData] = await Promise.all([
          workspaceAPI.getById(workspaceIdNum),
          projectAPI.getById(workspaceIdNum, projectIdNum),
        ]);

        setWorkspace(workspaceData);
        setProject(projectData);
      } catch (loadError) {
        console.error('Failed to load project training metadata:', loadError);
      } finally {
        setLoadingMeta(false);
      }
    };

    loadMeta();
  }, [workspaceIdNum, projectIdNum]);

  useEffect(() => {
    setPage(1);
  }, [searchText, statusFilter]);

  useEffect(() => {
    if (!workspaceIdNum || !projectIdNum) return;

    const safePageSize = Math.min(pageSize, MAX_TRAINING_PAGE_SIZE);
    const offset = (page - 1) * safePageSize;
    const keyword = searchText.trim();

    fetchTrainingJobs({
      limit: safePageSize,
      offset,
      keyword: keyword.length > 0 ? keyword : undefined,
      job_status: statusFilter === 'all' ? undefined : [statusFilter],
      order_by: sortField,
      desc: sortDesc,
    });
  }, [workspaceIdNum, projectIdNum, page, pageSize, searchText, statusFilter, sortField, sortDesc, fetchTrainingJobs]);

  const stats = useMemo(() => {
    return {
      total: totalCount,
      running: trainingJobs.filter((job) => job.status === 'running').length,
      finished: trainingJobs.filter((job) => job.status === 'finished').length,
      failed: trainingJobs.filter((job) => job.status === 'failed').length,
    };
  }, [trainingJobs, totalCount]);

  const handleCancelJob = async (targetProjectId: number, jobId: number) => {
    if (!workspaceIdNum) return;
    await trainingJobAPI.cancel(workspaceIdNum, targetProjectId, jobId);
    await fetchTrainingJobs({
      limit: Math.min(pageSize, MAX_TRAINING_PAGE_SIZE),
      offset: (page - 1) * Math.min(pageSize, MAX_TRAINING_PAGE_SIZE),
      keyword: searchText.trim() || undefined,
      job_status: statusFilter === 'all' ? undefined : [statusFilter],
      order_by: sortField,
      desc: sortDesc,
    });
  };

  const handleRetry = async () => {
    await fetchTrainingJobs({
      limit: Math.min(pageSize, MAX_TRAINING_PAGE_SIZE),
      offset: (page - 1) * Math.min(pageSize, MAX_TRAINING_PAGE_SIZE),
      keyword: searchText.trim() || undefined,
      job_status: statusFilter === 'all' ? undefined : [statusFilter],
      order_by: sortField,
      desc: sortDesc,
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPage(1);
    setPageSize(Math.min(newPageSize, MAX_TRAINING_PAGE_SIZE));
  };

  const handleViewJob = (job: TrainingJob) => {
    navigate(`/workspaces/${workspaceIdNum}/projects/${job.project_id}/training-jobs`);
  };

  if (loading || loadingMeta) {
    return (
      <Layout>
        <LoadingState message="Loading project training jobs..." />
      </Layout>
    );
  }

  if (!workspace || !project) {
    return (
      <Layout>
        <EmptyState
          icon={Zap}
          title="Project not found"
          description="The project does not exist or you do not have access."
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
                  { label: project.name, href: `/workspaces/${workspaceIdNum}/projects/${projectIdNum}` },
                  { label: 'Training Jobs', active: true },
                ]}
              />
              <Button variant="outline" size="sm" onClick={() => navigate(`/workspaces/${workspaceIdNum}/projects/${projectIdNum}`)}>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Project
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 mb-2">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{project.name} Training Jobs</h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">All training tasks under this project.</p>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/workspaces/${workspaceIdNum}/projects/${projectIdNum}`)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Training Job
              </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <SearchIcon className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                    <Input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search by job name or job id"
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <select
                    value={sortField}
                    onChange={(e) => {
                      setSortField(e.target.value as JobSortField);
                      setPage(1);
                    }}
                    className="w-full px-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                  >
                    <option value="created_at">Sort by Created Time</option>
                    <option value="updated_at">Sort by Updated Time</option>
                    <option value="name">Sort by Name</option>
                    <option value="time_spent">Sort by Time Spent</option>
                    <option value="id">Sort by ID</option>
                  </select>
                  <select
                    value={sortDesc ? 'desc' : 'asc'}
                    onChange={(e) => {
                      setSortDesc(e.target.value === 'desc');
                      setPage(1);
                    }}
                    className="w-full px-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
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
                    description="No training jobs match your filters in this project."
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
                      onView={handleViewJob}
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
