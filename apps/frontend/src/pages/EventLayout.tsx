import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { EventDetailHeader, EventFormModal, EventSectionTabs } from '@/features/events';
import { EventDetailSkeleton } from '@/features/events/components/EventDetailSkeleton';
import { EventSectionSkeleton } from '@/features/events/components/EventSectionSkeleton';
import { useEventDetail, type EventLayoutContext } from '@/features/events/hooks';
import { useConfirmDialog } from '@/hooks/common';
import { ConfirmDialog, ErrorState } from '@/shared/components';
import { useI18nNamespacesReady } from '@/shared/hooks/useI18nNamespacesReady';
import { useEventFormModalStore } from '@/shared/store/useEventFormModalStore';
import { MainLayout } from './MainLayout';

const EVENT_LAYOUT_NAMESPACES = ['eventDetail', 'events', 'common'] as const;

/**
 * Shell of the event hub: it owns the event fetch, its loading/error/not-found
 * states, the header and the event-level modals. Sections render inside the
 * outlet and receive the loaded event through the outlet context.
 */
export function EventLayout() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(EVENT_LAYOUT_NAMESPACES);
  const isI18nReady = useI18nNamespacesReady(EVENT_LAYOUT_NAMESPACES);
  const { event, kpis, isLoading, error, refetch, handleDelete, handleToggleArchive, handleBack, isMutatingEvent } =
    useEventDetail(id);

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

  const outletContext: EventLayoutContext = { event, kpis };

  return (
    <MainLayout>
      <EventDetailHeader
        eventTitle={event.title}
        eventStatus={event.status}
        onBack={handleBack}
        onEdit={() => eventFormModalStore.openModal(event.id)}
        onDelete={() => deleteDialog.confirm(handleDelete)}
        onToggleArchive={handleToggleArchive}
        isMutatingStatus={isMutatingEvent}
      />

      <EventSectionTabs />

      {/* Local Suspense: without it, loading a section chunk would unmount the
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
