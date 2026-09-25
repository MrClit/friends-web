import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCloudOff, MdLinkOff } from 'react-icons/md';
import { Outlet, useParams } from 'react-router-dom';
import { EventDetailHeader, EventFormModal, EventSectionTabs } from '@/features/events';
import { EventDetailSkeleton } from '@/features/events/components/EventDetailSkeleton';
import { EventSectionSkeleton } from '@/features/events/components/EventSectionSkeleton';
import { useEventDetail, useIsEventSectionRoute, type EventLayoutContext } from '@/features/events/hooks';
import { useConfirmDialog } from '@/hooks/common';
import { ConfirmDialog, FullPageMessage, type FullPageAction } from '@/shared/components';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';
import { describeLoadError } from '@/shared/utils/apiError';
import { useEventFormModalStore } from '@/shared/store/useEventFormModalStore';
import { MainLayout } from './MainLayout';

const EVENT_LAYOUT_NAMESPACES = ['eventDetail', 'events', 'common', 'notFound'] as const;

/**
 * Shell of every view of an event: it owns the event fetch, its
 * loading/error/not-found states, the header and the event-level modals.
 * An event that cannot be shown replaces the whole page (FullPageMessage);
 * partial failures inside a loaded event are the sections' own ErrorState.
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

  // Early returns come after all hooks
  if (!isI18nReady) {
    return (
      <MainLayout>
        <EventDetailSkeleton />
      </MainLayout>
    );
  }

  const goHome: FullPageAction = { label: t('goHome', { ns: 'notFound' }), to: '/' };
  // A dead end: repeating the request cannot help, so the only way out is home.
  const renderUnavailable = (message: string) => (
    <MainLayout>
      <FullPageMessage
        icon={MdLinkOff}
        title={t('unavailableTitle', { ns: 'eventDetail' })}
        message={message}
        primaryAction={goHome}
      />
    </MainLayout>
  );

  if (!id) return renderUnavailable(t('invalidLink', { ns: 'common' }));

  if (isLoading) {
    return (
      <MainLayout>
        <EventDetailSkeleton />
      </MainLayout>
    );
  }

  if (error) {
    const { message, isRetryable } = describeLoadError(error, t);
    if (!isRetryable) return renderUnavailable(message ?? t('notFoundOrNoAccess', { ns: 'common' }));

    return (
      <MainLayout>
        <FullPageMessage
          icon={MdCloudOff}
          title={t('loadFailedTitle', { ns: 'eventDetail' })}
          message={message ?? t('errorLoading', { ns: 'common' })}
          primaryAction={{ label: t('retry', { ns: 'common' }), onClick: () => void refetch() }}
          secondaryAction={goHome}
        />
      </MainLayout>
    );
  }

  if (!event) return renderUnavailable(t('notFoundOrNoAccess', { ns: 'common' }));

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
