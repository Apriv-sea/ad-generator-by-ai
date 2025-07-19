
import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CampaignListSkeleton, 
  FormSkeleton, 
  CardSkeleton, 
  StatsSkeleton 
} from './SkeletonLoaders';

// Lazy loaded components - existing
export const LazyCampaignTable = lazy(() => import('@/components/campaign/CampaignTable'));
export const LazyContentGenerator = lazy(() => import('@/components/campaign/ContentGenerator'));
export const LazySpreadsheetEditor = lazy(() => import('@/components/sheet/SpreadsheetEditor'));
export const LazyContentHistoryPanel = lazy(() => import('@/components/campaign/ContentHistoryPanel'));

// Lazy loaded components - new
export const LazyCampaignWorkflow = lazy(() => import('../campaign/CampaignWorkflow'));
export const LazyCampaignExtractorWorkflow = lazy(() => import('../campaign/CampaignExtractorWorkflow'));
export const LazyContentGeneratorWorkflow = lazy(() => import('../campaign/ContentGeneratorWorkflow'));
export const LazyClientsList = lazy(() => import('../clients/ClientsList'));
export const LazyApiKeysSection = lazy(() => import('../settings/ApiKeysSection'));

// HOC pour wrapper les composants lazy avec Suspense
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function LazyComponent(props: P) {
    const defaultFallback = (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );

    return (
      <Suspense fallback={fallback || defaultFallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Wrapper components with suspense and appropriate loading states
export const CampaignWorkflowLazy = (props: any) => (
  <Suspense fallback={<CampaignListSkeleton />}>
    <LazyCampaignWorkflow {...props} />
  </Suspense>
);

export const CampaignExtractorWorkflowLazy = (props: any) => (
  <Suspense fallback={<FormSkeleton />}>
    <LazyCampaignExtractorWorkflow {...props} />
  </Suspense>
);

export const ContentGeneratorWorkflowLazy = (props: any) => (
  <Suspense fallback={<StatsSkeleton />}>
    <LazyContentGeneratorWorkflow {...props} />
  </Suspense>
);

export const ClientsListLazy = (props: any) => (
  <Suspense fallback={<CampaignListSkeleton />}>
    <LazyClientsList {...props} />
  </Suspense>
);

export const ApiKeysSectionLazy = (props: any) => (
  <Suspense fallback={<FormSkeleton />}>
    <LazyApiKeysSection {...props} />
  </Suspense>
);

// Wrapper pour les composants de campagne - existing
export const CampaignTableLazy = withLazyLoading(LazyCampaignTable);
export const ContentGeneratorLazy = withLazyLoading(LazyContentGenerator);
export const SpreadsheetEditorLazy = withLazyLoading(LazySpreadsheetEditor);
export const ContentHistoryPanelLazy = withLazyLoading(LazyContentHistoryPanel);
