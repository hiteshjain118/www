import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, Pipeline as PipelineType } from '../services/api';

const Pipeline: React.FC = () => {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pipeline, setPipeline] = useState<PipelineType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadPipeline = async () => {
      if (!pipelineId || !user) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.getPipeline(pipelineId, user.cbid);
        
        if (response.success && response.data) {
          setPipeline(response.data);
        } else {
          setError(response.error || 'Failed to load pipeline');
        }
      } catch (err) {
        setError('Failed to load pipeline');
        console.error('Error loading pipeline:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPipeline();
  }, [pipelineId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => navigate('/profile')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">Pipeline not found</div>
          <button
            onClick={() => navigate('/profile')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/profile')}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {pipeline.name || `Pipeline ${pipeline.cbId.slice(-6)}`}
                </h1>
                <p className="text-sm text-gray-500">
                  Created {new Date(pipeline.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Edit Pipeline
              </button>
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Run Pipeline
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pipeline Details */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pipeline Details</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Pipeline ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pipeline.cbId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Owner ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pipeline.ownerId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(pipeline.createdAt).toLocaleString()}
                  </dd>
                </div>
                {pipeline.parentThreadId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Parent Thread</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <button
                        onClick={() => navigate(`/thread/${pipeline.parentThreadId}`)}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        View Thread
                      </button>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Pipeline Configuration */}
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Configuration</h2>
              <div className="text-gray-500">
                Pipeline configuration will be displayed here once implemented.
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Edit Pipeline
                </button>
                <button className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                  Run Pipeline
                </button>
                <button className="w-full bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
                  Duplicate Pipeline
                </button>
                <button className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                  Delete Pipeline
                </button>
              </div>
            </div>

            {/* Recent Runs */}
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Runs</h2>
              <div className="text-gray-500">
                No recent runs available.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pipeline; 