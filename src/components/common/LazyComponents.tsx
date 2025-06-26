
import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Composants chargés paresseusement
export const LazyCampaignTable = lazy(() => import('@/components/campaign/CampaignTable'));
export const LazyContentGenerator = lazy(() => import('@/components/campaign/ContentGenerator'));
export const LazySpreadsheetEditor = lazy(() => import('@/components/sheet/SpreadsheetEditor'));
export const LazyContentHistoryPanel = lazy(() => import('@/components/campaign/ContentHistoryPanel'));

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

// Wrapper pour les composants de campagne
export const CampaignTableLazy = withLazyLoading(LazyCampaignTable);
export const ContentGeneratorLazy = withLazyLoading(LazyContentGenerator);
export const SpreadsheetEditorLazy = withLazyLoading(LazySpreadsheetEditor);
export const ContentHistoryPanelLazy = withLazyLoading(LazyContentHistoryPanel);
