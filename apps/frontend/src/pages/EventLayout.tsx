import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { EventDetailHeader, EventFormModal, EventSectionTabs } from '@/features/events';
import { EventDetailSkeleton } from '@/features/events/components/EventDetailSkeleton';
import { EventSectionSkeleton } from '@/features/events/components/EventSectionSkeleton';
import { useEventDetail, useIsEventSectionRoute, type EventLayoutContext } from '@/features/events/hooks';
import { useConfirmDialog } from '@/hooks/common';
import { ConfirmDialog, ErrorState } from '@/shared/components';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';
import { useEventFormModalStore } from '@/shared/store/useEventFormModalStore';
import { MainLayout } from './MainLayout';

const EVENT_LAYOUT_NAMESPACES = ['eventDetail', 'events', 'common'] as const;

/**
 * Shell of every view of an event: it owns the event fetch, its
 * loading/error/not-found states, the header and the event-level modals.
 * Children render inside the outlet and receive the loaded event through the
 * outlet context.
 *
 * Sections (tabs) and detail views (the KPI drill-down) differ only in chrome:
 * a detail view gets neither the section tabs nor the event actions, and its
 * back button returns to the event instead of the event list.
 */
export function EventLayout() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(EVENT_LAYOUT_NAMESPACES);
  const isI18nReady = useI18nNamespacesReady(EVENT_LAYOUT_NAMESPACES);
  const isSectionRoute = useIsEventSectionRoute();
  const {
    event,
    kpis,
    isLoading,
    error,
    refetch,
    isLoadingKpis,
    kpisError,
    refetchKpis,
    handleDelete,
    handleToggleArchive,
    handleBack,
    handleBackToEvent,
    isMutatingEvent,
  } = useEventDetail(id);

  // UI state management
  const eventFormModalStore = useEventFormModalStore();
  const deleteDialog = useConfirmDialog();

  // Validate id after all hooks
  if (!id) {
    return (
      <MainLayout>
        <div className="text-center mt-10 text-red-400">{t('invalidId')}</div>
      </MainLayout>
    );
  }

  if (isLoading || !isI18nReady) {
    return (
      <MainLayout>
        <EventDetailSkeleton />
      </MainLayout>
    );
  }

  if (error) {
    const isNotFoundOrNoAccess = error instanceof ApiError && error.status === 404;

    return (
      <MainLayout>
        <ErrorState
          message={isNotFoundOrNoAccess ? t('notFoundOrNoAccess', { ns: 'common' }) : undefined}
          onRetry={isNotFoundOrNoAccess ? undefined : () => void refetch()}
        />
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="text-center mt-10">{t('notFound')}</div>
      </MainLayout>
    );
  }

  const outletContext: EventLayoutContext = {
    event,
    kpis,
    isLoadingKpis,
    kpisError,
    refetchKpis: () => void refetchKpis(),
  };

  return (
    <MainLayout>
      <EventDetailHeader
        eventTitle={event.title}
        eventStatus={event.status}
        onBack={isSectionRoute ? handleBack : handleBackToEvent}
        onEdit={isSectionRoute ? () => eventFormModalStore.openModal(event.id) : undefined}
        onDelete={isSectionRoute ? () => deleteDialog.confirm(handleDelete) : undefined}
        onToggleArchive={isSectionRoute ? handleToggleArchive : undefined}
        isMutatingStatus={isMutatingEvent}
      />

      {isSectionRoute ? <EventSectionTabs /> : null}

      {/* Local Suspense: without it, loading a child chunk would unmount the
          header and tabs behind the app-wide fallback. */}
      <Suspense fallback={<EventSectionSkeleton />}>
        <Outlet context={outletContext} />
      </Suspense>

      <EventFormModal />
      <ConfirmDialog
        open={deleteDialog.isOpen}
        title={t('deleteTitle')}
        message={t('deleteMessage')}
        confirmText={t('deleteConfirm')}
        cancelText={t('deleteCancel')}
        onConfirm={deleteDialog.handleConfirm}
        onCancel={deleteDialog.handleCancel}
      />
    </MainLayout>
  );
}
